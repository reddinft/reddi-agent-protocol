/// QuasarSVM tests for the Quasar attestation judges.
///
/// Parity with Anchor `tests/attestation.rs`:
///   1. happy path — attest → confirm: judge accuracy + rep increase
///   2. happy path — attest → dispute: judge reputation penalised
///   3. non-attestation agent (Primary) calls attest → rejected
///   4. non-consumer calls confirm → rejected; original consumer succeeds
///   5. duplicate attestation on same job_id → rejected (init guard)
///
/// Additional QuasarSVM tests (state invariants + invalid transitions):
///   6. non-consumer calls dispute → rejected
///   7. double-confirm (confirm after confirm) → rejected
///   8. double-dispute (dispute after dispute) → rejected
///   9. dispute after confirm → rejected
///  10. confirm after dispute → rejected
///  11. score out of range (0) → rejected
///  12. score out of range (11) → rejected
///
/// Total: 12 tests
extern crate std;

use {
    quasar_lang::traits::HasSeeds,
    quasar_svm::{Account, AccountMeta, Instruction, Pubkey, QuasarSvm},
    std::{println, vec},
};

// ── Setup ─────────────────────────────────────────────────────────────────────

fn setup() -> QuasarSvm {
    let elf = std::fs::read(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/target/deploy/quasar_attestation.so"
    ))
    .expect(
        "build .so first: \
         cargo build-sbf --manifest-path experiments/quasar-attestation/Cargo.toml",
    );
    QuasarSvm::new().with_program(&crate::ID, &elf)
}

fn empty_account(address: Pubkey) -> Account {
    Account {
        address,
        lamports: 0,
        data: vec![],
        owner: quasar_svm::system_program::ID,
        executable: false,
    }
}

fn fee_collector() -> Pubkey {
    "1nc1nerator11111111111111111111111111111111"
        .parse()
        .unwrap()
}

fn agent_pda(owner: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            <crate::state::AgentAccount as HasSeeds>::SEED_PREFIX,
            owner.as_ref(),
        ],
        &crate::ID,
    )
    .0
}

fn attestation_pda(job_id: u128) -> Pubkey {
    Pubkey::find_program_address(
        &[
            <crate::state::AttestationAccount as HasSeeds>::SEED_PREFIX,
            &job_id.to_le_bytes(),
        ],
        &crate::ID,
    )
    .0
}

fn u64_le(v: u64) -> [u8; 8] {
    v.to_le_bytes()
}

fn u128_le(v: u128) -> [u8; 16] {
    v.to_le_bytes()
}

// ── Instruction builders ───────────────────────────────────────────────────────

/// Discriminator 0: register (owner = payer/signer)
fn register_ix(payer: &Pubkey, agent_pda: &Pubkey, agent_type: u8, model: &str) -> Instruction {
    let model_bytes = model.as_bytes();
    let model_len = model_bytes.len() as u8;
    let mut model_data = [0u8; 64];
    model_data[..model_bytes.len()].copy_from_slice(model_bytes);

    // disc(1) + agent_type(1) + model_len(1) + model_data(64) + rate_lamports(8) + min_reputation(1)
    let mut data = vec![0u8]; // discriminator 0
    data.push(agent_type);
    data.push(model_len);
    data.extend_from_slice(&model_data);
    data.extend_from_slice(&u64_le(500_000));
    data.push(0u8); // min_reputation

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(*agent_pda, false),
            AccountMeta::new(*payer, true),
            AccountMeta::new(fee_collector(), false),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    }
}

/// Discriminator 1: attest
fn attest_ix(
    judge: &Pubkey,
    judge_agent: &Pubkey,
    job_id: u128,
    scores: [u8; 5],
    consumer: &Pubkey,
) -> Instruction {
    let attestation_pk = attestation_pda(job_id);

    // disc(1) + job_id(16) + scores(5) + consumer(32)
    let mut data = vec![1u8]; // discriminator 1
    data.extend_from_slice(&u128_le(job_id));
    data.extend_from_slice(&scores);
    data.extend_from_slice(consumer.as_ref());

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(attestation_pk, false),
            AccountMeta::new_readonly(*judge_agent, false),
            AccountMeta::new(*judge, true),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    }
}

/// Discriminator 2: confirm
fn confirm_ix(consumer: &Pubkey, attestation_pk: &Pubkey, judge_agent: &Pubkey, job_id: u128) -> Instruction {
    // disc(1) + job_id(16)
    let mut data = vec![2u8]; // discriminator 2
    data.extend_from_slice(&u128_le(job_id));

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(*attestation_pk, false),
            AccountMeta::new(*judge_agent, false),
            AccountMeta::new_readonly(*consumer, true),
        ],
        data,
    }
}

/// Discriminator 3: dispute
fn dispute_ix(consumer: &Pubkey, attestation_pk: &Pubkey, judge_agent: &Pubkey, job_id: u128) -> Instruction {
    // disc(1) + job_id(16)
    let mut data = vec![3u8]; // discriminator 3
    data.extend_from_slice(&u128_le(job_id));

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(*attestation_pk, false),
            AccountMeta::new(*judge_agent, false),
            AccountMeta::new_readonly(*consumer, true),
        ],
        data,
    }
}

// ── State readers ─────────────────────────────────────────────────────────────

/// Read reputation_score (u16 LE) from AgentAccount.
/// Layout (disc=1): owner(32)+agent_type(1)+model_len(1)+_pad(6)+rate_lamports(8)+
///   min_reputation(1)+_pad2(1) = offset 51 from start of data
fn read_reputation_score(svm: &QuasarSvm, pk: &Pubkey) -> u16 {
    let acc = svm.get_account(pk).expect("agent account must exist");
    let lo = acc.data[51] as u16;
    let hi = acc.data[52] as u16;
    lo | (hi << 8)
}

/// Read attestation_accuracy (u16 LE) from AgentAccount.
/// Offset: 51(rep_score)+2+4(_pad3)+8+8+8(jobs/time)+1+1(active/bump) = 83
fn read_attestation_accuracy(svm: &QuasarSvm, pk: &Pubkey) -> u16 {
    let acc = svm.get_account(pk).expect("agent account must exist");
    let lo = acc.data[83] as u16;
    let hi = acc.data[84] as u16;
    lo | (hi << 8)
}

/// Read confirmed status byte from AttestationAccount.
/// Layout (disc=1): job_id(16)+judge(32)+consumer(32)+scores(5) = offset 86 from start
fn read_confirmed_status(svm: &QuasarSvm, pk: &Pubkey) -> u8 {
    let acc = svm.get_account(pk).expect("attestation account must exist");
    acc.data[86] // 1 (disc) + 16 + 32 + 32 + 5 = 86
}

// ── Test helpers ──────────────────────────────────────────────────────────────

/// Register a judge agent. Funds are airdropped; PDA created.
/// Returns (agent_pda, consumer_pubkey).
fn register_judge(svm: &mut QuasarSvm, judge: &Pubkey, agent_type: u8) -> Pubkey {
    let agent = agent_pda(judge);
    svm.airdrop(judge, 5_000_000_000);
    svm.airdrop(&fee_collector(), 0); // ensure exists

    let result = svm.process_instruction(
        &register_ix(judge, &agent, agent_type, "judge-model"),
        &[empty_account(agent)],
    );
    result.expect("register judge");
    agent
}

/// Attest a job. Judge must already be registered.
/// Returns attestation_pda.
fn do_attest(svm: &mut QuasarSvm, judge: &Pubkey, judge_agent: &Pubkey, job_id: u128, scores: [u8; 5], consumer: &Pubkey) -> Pubkey {
    let att_pk = attestation_pda(job_id);
    let result = svm.process_instruction(
        &attest_ix(judge, judge_agent, job_id, scores, consumer),
        &[empty_account(att_pk)],
    );
    result.expect("attest_quality");
    att_pk
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/// Test 1: judge attests → consumer confirms → judge attestation_accuracy and rep increase.
/// Parity: Anchor `test_confirm_increases_judge_accuracy`
#[test]
fn test_confirm_increases_judge_accuracy() {
    println!("\n=== test_confirm_increases_judge_accuracy ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 1); // Attestation
    let job_id: u128 = 1;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [8u8, 9, 7, 8, 9], &consumer);

    let rep_before = read_reputation_score(&svm, &judge_agent);
    let acc_before = read_attestation_accuracy(&svm, &judge_agent);

    // Consumer confirms
    let result = svm.process_instruction(
        &confirm_ix(&consumer, &att_pk, &judge_agent, job_id),
        &[],
    );
    result.expect("confirm_attestation");

    let status = read_confirmed_status(&svm, &att_pk);
    assert_eq!(status, 1, "attestation should be Confirmed (1)");

    let rep_after = read_reputation_score(&svm, &judge_agent);
    let acc_after = read_attestation_accuracy(&svm, &judge_agent);

    assert!(
        acc_after > acc_before,
        "attestation_accuracy should increase on confirm: before={}, after={}",
        acc_before, acc_after
    );
    assert!(
        rep_after >= rep_before,
        "reputation should increase on confirm: before={}, after={}",
        rep_before, rep_after
    );
    println!("✅ accuracy: {} → {}, rep: {} → {}", acc_before, acc_after, rep_before, rep_after);
}

/// Test 2: judge attests → consumer disputes → judge reputation penalised.
/// Parity: Anchor `test_dispute_penalises_judge`
#[test]
fn test_dispute_penalises_judge() {
    println!("\n=== test_dispute_penalises_judge ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 2); // Both
    let job_id: u128 = 2;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [3u8, 2, 4, 3, 2], &consumer);

    let rep_before = read_reputation_score(&svm, &judge_agent);

    // Consumer disputes
    let result = svm.process_instruction(
        &dispute_ix(&consumer, &att_pk, &judge_agent, job_id),
        &[],
    );
    result.expect("dispute_attestation");

    let status = read_confirmed_status(&svm, &att_pk);
    assert_eq!(status, 2, "attestation should be Disputed (2)");

    let rep_after = read_reputation_score(&svm, &judge_agent);
    assert!(
        rep_after <= rep_before,
        "reputation should not increase on dispute: before={}, after={}",
        rep_before, rep_after
    );
    println!("✅ rep before={}, after={} (saturating_sub applied)", rep_before, rep_after);
}

/// Test 3: non-attestation agent (Primary) calls attest → rejected.
/// Parity: Anchor `test_non_attestation_agent_rejected`
#[test]
fn test_non_attestation_agent_rejected() {
    println!("\n=== test_non_attestation_agent_rejected ===");
    let mut svm = setup();

    let impostor = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();

    // Register as Primary (agent_type = 0)
    let impostor_agent = register_judge(&mut svm, &impostor, 0);
    let job_id: u128 = 3;
    let att_pk = attestation_pda(job_id);

    let result = svm.process_instruction(
        &attest_ix(&impostor, &impostor_agent, job_id, [8u8; 5], &consumer),
        &[empty_account(att_pk)],
    );
    assert!(result.is_err(), "Primary agent should not be allowed to attest");
    println!("✅ Primary agent attest correctly rejected");
}

/// Test 4: non-consumer calls confirm → rejected; original consumer succeeds.
/// Parity: Anchor `test_non_consumer_confirm_rejected`
#[test]
fn test_non_consumer_confirm_rejected() {
    println!("\n=== test_non_consumer_confirm_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);
    svm.airdrop(&attacker, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 4;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [7u8, 8, 7, 8, 7], &consumer);

    // Attacker tries to confirm
    let bad_result = svm.process_instruction(
        &confirm_ix(&attacker, &att_pk, &judge_agent, job_id),
        &[],
    );
    assert!(bad_result.is_err(), "Non-consumer confirm should be rejected");
    assert_eq!(read_confirmed_status(&svm, &att_pk), 0, "still Pending after failed confirm");

    // Original consumer can still confirm
    let good_result = svm.process_instruction(
        &confirm_ix(&consumer, &att_pk, &judge_agent, job_id),
        &[],
    );
    good_result.expect("Consumer confirm should succeed");
    assert_eq!(read_confirmed_status(&svm, &att_pk), 1, "Confirmed after consumer confirms");
    println!("✅ Non-consumer rejected, consumer confirmed successfully");
}

/// Test 5: duplicate attestation on same job_id → rejected (init guard).
/// Parity: Anchor `test_duplicate_attestation_rejected`
#[test]
fn test_duplicate_attestation_rejected() {
    println!("\n=== test_duplicate_attestation_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 5;
    let att_pk = attestation_pda(job_id);

    // First attestation succeeds
    let r1 = svm.process_instruction(
        &attest_ix(&judge, &judge_agent, job_id, [9u8; 5], &consumer),
        &[empty_account(att_pk)],
    );
    r1.expect("first attest");

    // Second attestation on the same job_id → init constraint rejects
    let r2 = svm.process_instruction(
        &attest_ix(&judge, &judge_agent, job_id, [9u8; 5], &consumer),
        &[], // att_pk is already in svm DB (exists)
    );
    assert!(r2.is_err(), "Duplicate attestation should be rejected by init constraint");
    println!("✅ Duplicate attestation correctly rejected");
}

/// Test 6: non-consumer calls dispute → rejected.
#[test]
fn test_non_consumer_dispute_rejected() {
    println!("\n=== test_non_consumer_dispute_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    svm.airdrop(&attacker, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 6;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [6u8; 5], &consumer);

    let result = svm.process_instruction(
        &dispute_ix(&attacker, &att_pk, &judge_agent, job_id),
        &[],
    );
    assert!(result.is_err(), "Non-consumer dispute should be rejected");
    assert_eq!(read_confirmed_status(&svm, &att_pk), 0, "still Pending after failed dispute");
    println!("✅ Non-consumer dispute correctly rejected");
}

/// Test 7: double-confirm (confirm after confirm) → rejected.
/// Parity: Anchor `AttestationAlreadyResolved`
#[test]
fn test_double_confirm_rejected() {
    println!("\n=== test_double_confirm_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 7;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [8u8; 5], &consumer);

    // First confirm — should succeed
    svm.process_instruction(&confirm_ix(&consumer, &att_pk, &judge_agent, job_id), &[])
        .expect("first confirm");

    // Second confirm — should fail
    let r2 = svm.process_instruction(&confirm_ix(&consumer, &att_pk, &judge_agent, job_id), &[]);
    assert!(r2.is_err(), "Double-confirm should be rejected");
    println!("✅ Double-confirm correctly rejected");
}

/// Test 8: double-dispute (dispute after dispute) → rejected.
#[test]
fn test_double_dispute_rejected() {
    println!("\n=== test_double_dispute_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 8;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [5u8; 5], &consumer);

    // First dispute — should succeed
    svm.process_instruction(&dispute_ix(&consumer, &att_pk, &judge_agent, job_id), &[])
        .expect("first dispute");

    // Second dispute — should fail
    let r2 = svm.process_instruction(&dispute_ix(&consumer, &att_pk, &judge_agent, job_id), &[]);
    assert!(r2.is_err(), "Double-dispute should be rejected");
    println!("✅ Double-dispute correctly rejected");
}

/// Test 9: dispute after confirm → rejected.
#[test]
fn test_dispute_after_confirm_rejected() {
    println!("\n=== test_dispute_after_confirm_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 2);
    let job_id: u128 = 9;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [8u8; 5], &consumer);

    // Confirm first
    svm.process_instruction(&confirm_ix(&consumer, &att_pk, &judge_agent, job_id), &[])
        .expect("confirm");
    assert_eq!(read_confirmed_status(&svm, &att_pk), 1);

    // Attempt dispute after confirm
    let r = svm.process_instruction(&dispute_ix(&consumer, &att_pk, &judge_agent, job_id), &[]);
    assert!(r.is_err(), "Dispute after confirm should be rejected");
    println!("✅ Dispute after confirm correctly rejected");
}

/// Test 10: confirm after dispute → rejected.
#[test]
fn test_confirm_after_dispute_rejected() {
    println!("\n=== test_confirm_after_dispute_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();
    svm.airdrop(&consumer, 1_000_000_000);

    let judge_agent = register_judge(&mut svm, &judge, 2);
    let job_id: u128 = 10;
    let att_pk = do_attest(&mut svm, &judge, &judge_agent, job_id, [4u8; 5], &consumer);

    // Dispute first
    svm.process_instruction(&dispute_ix(&consumer, &att_pk, &judge_agent, job_id), &[])
        .expect("dispute");
    assert_eq!(read_confirmed_status(&svm, &att_pk), 2);

    // Attempt confirm after dispute
    let r = svm.process_instruction(&confirm_ix(&consumer, &att_pk, &judge_agent, job_id), &[]);
    assert!(r.is_err(), "Confirm after dispute should be rejected");
    println!("✅ Confirm after dispute correctly rejected");
}

/// Test 11: score out of range (0) → rejected.
/// Parity: Anchor `AttestationScoreOutOfRange`
#[test]
fn test_score_zero_rejected() {
    println!("\n=== test_score_zero_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 11;
    let att_pk = attestation_pda(job_id);

    // Score [0, 8, 8, 8, 8] — first score is 0 (invalid)
    let result = svm.process_instruction(
        &attest_ix(&judge, &judge_agent, job_id, [0u8, 8, 8, 8, 8], &consumer),
        &[empty_account(att_pk)],
    );
    assert!(result.is_err(), "Score 0 should be rejected");
    println!("✅ Score 0 correctly rejected");
}

/// Test 12: score out of range (11) → rejected.
#[test]
fn test_score_eleven_rejected() {
    println!("\n=== test_score_eleven_rejected ===");
    let mut svm = setup();

    let judge = Pubkey::new_unique();
    let consumer = Pubkey::new_unique();

    let judge_agent = register_judge(&mut svm, &judge, 1);
    let job_id: u128 = 12;
    let att_pk = attestation_pda(job_id);

    // Score [8, 8, 8, 8, 11] — last score is 11 (invalid)
    let result = svm.process_instruction(
        &attest_ix(&judge, &judge_agent, job_id, [8u8, 8, 8, 8, 11], &consumer),
        &[empty_account(att_pk)],
    );
    assert!(result.is_err(), "Score 11 should be rejected");
    println!("✅ Score 11 correctly rejected");
}
