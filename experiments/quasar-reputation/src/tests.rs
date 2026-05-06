/// QuasarSVM tests for the Quasar blind commit-reveal reputation.
///
/// Parity with Anchor `tests/reputation.rs`:
///   1. Full happy path — both commit, both reveal, scores applied (commit→reveal)
///   2. commit→expire happy path — consumer commits, specialist ghosts, expiry penalises
///   3. Reveal rejected before both parties commit (BothMustCommitFirst parity)
///   4. Tampered reveal rejected — wrong salt (CommitmentMismatch parity)
///   5. Unauthorized reveal — neither consumer nor specialist
///   6. Duplicate commit rejected (AlreadyCommitted parity)
///   7. Expiry boundary — expire rejected before RATING_EXPIRE_SLOTS
///   8. Expiry boundary — expire succeeds after RATING_EXPIRE_SLOTS
///
/// Additional Quasar-specific tests:
///   9. Commit to already-revealed rating rejected (AlreadyFinalised parity)
///  10. Invalid score rejected (score 0 and score 11)
extern crate std;

use {
    quasar_lang::traits::HasSeeds,
    quasar_svm::{Account, AccountMeta, Instruction, Pubkey, QuasarSvm},
    std::{println, vec},
};

// ── Setup ─────────────────────────────────────────────────────────────────────

fn setup() -> QuasarSvm {
    let elf = std::fs::read(
        concat!(env!("CARGO_MANIFEST_DIR"), "/target/deploy/quasar_reputation.so"),
    )
    .expect("build .so first: cargo build-sbf --manifest-path experiments/quasar-reputation/Cargo.toml");
    QuasarSvm::new().with_program(&crate::ID, &elf)
}

fn funded(address: Pubkey) -> Account {
    quasar_svm::token::create_keyed_system_account(&address, 5_000_000_000)
}

fn empty(address: Pubkey) -> Account {
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

fn rating_pda(job_id: u128) -> Pubkey {
    Pubkey::find_program_address(
        &[
            <crate::state::RatingAccount as HasSeeds>::SEED_PREFIX,
            &job_id.to_le_bytes(),
        ],
        &crate::ID,
    )
    .0
}

fn sha256_commitment(job_id: u128, score: u8, salt: &[u8; 32]) -> [u8; 32] {
    use sha2::{Digest, Sha256};
    let mut h = Sha256::new();
    h.update([score]);
    h.update(salt);
    h.update(job_id.to_le_bytes());
    h.update(crate::ID.as_ref());
    h.finalize().into()
}

/// Convert [u8; 16] job_id to u128 (LE) for instruction encoding
fn job_id_to_u128(job_id: [u8; 16]) -> u128 {
    u128::from_le_bytes(job_id)
}

// ── Instruction builders ──────────────────────────────────────────────────────

/// Builds a `register` instruction (disc=0).
fn register_ix(owner: Pubkey, agent: Pubkey, model: &str) -> Instruction {
    let model_bytes = model.as_bytes();
    assert!(model_bytes.len() <= 64);
    let mut model_data = [0u8; 64];
    model_data[..model_bytes.len()].copy_from_slice(model_bytes);

    let mut data = vec![0u8]; // disc=0
    data.push(0u8);           // agent_type=Primary
    data.push(model_bytes.len() as u8);
    data.extend_from_slice(&model_data);
    data.extend_from_slice(&1_000_000u64.to_le_bytes());
    data.push(0u8); // min_reputation

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(agent, false),
            AccountMeta::new(owner, true),
            AccountMeta::new(fee_collector(), false),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    }
}

/// Builds a `commit` instruction (disc=1).
/// job_id: u128 (LE bytes of the [u8; 16] job UUID)
/// role: 0=Consumer, 1=Specialist
fn commit_ix(
    job_id: u128,
    commitment: [u8; 32],
    role: u8,
    signer: Pubkey,
    consumer_pk: Pubkey,
    specialist_pk: Pubkey,
    rating: Pubkey,
) -> Instruction {
    let mut data = vec![1u8]; // disc=1
    data.extend_from_slice(&job_id.to_le_bytes()); // u128 = 16 bytes
    data.extend_from_slice(&commitment);            // [u8; 32]
    data.push(role);                                // u8
    data.extend_from_slice(consumer_pk.as_ref());   // [u8; 32]
    data.extend_from_slice(specialist_pk.as_ref()); // [u8; 32]

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(rating, false),
            AccountMeta::new(signer, true),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    }
}

/// Builds a `reveal` instruction (disc=2).
fn reveal_ix(
    job_id: u128,
    score: u8,
    salt: [u8; 32],
    signer: Pubkey,
    rating: Pubkey,
    specialist_agent: Pubkey,
    consumer_agent: Pubkey,
) -> Instruction {
    let mut data = vec![2u8]; // disc=2
    data.extend_from_slice(&job_id.to_le_bytes()); // u128
    data.push(score);                              // u8
    data.extend_from_slice(&salt);                 // [u8; 32]

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(rating, false),
            AccountMeta::new_readonly(signer, true),
            AccountMeta::new(specialist_agent, false),
            AccountMeta::new(consumer_agent, false),
        ],
        data,
    }
}

/// Builds an `expire` instruction (disc=3).
fn expire_ix(
    job_id: u128,
    caller: Pubkey,
    rating: Pubkey,
    specialist_agent: Pubkey,
    consumer_agent: Pubkey,
) -> Instruction {
    let mut data = vec![3u8]; // disc=3
    data.extend_from_slice(&job_id.to_le_bytes()); // u128

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(rating, false),
            AccountMeta::new_readonly(caller, true),
            AccountMeta::new(specialist_agent, false),
            AccountMeta::new(consumer_agent, false),
        ],
        data,
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Register an agent and return (agent_pda, agent_account, owner_account_after).
/// NOTE: fee_collector is NOT passed explicitly — QuasarSVM auto-creates fee_collector
/// from program_cache or as a fallback. We pass it in accounts to ensure lamport tracking.
fn register_agent(svm: &mut QuasarSvm, owner: Pubkey) -> (Pubkey, Account, Account) {
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let result = svm.process_instruction(
        &register_ix(owner, agent, "test-model"),
        &[
            empty(agent),
            funded(owner),
            Account {
                address: fee_coll,
                lamports: 0,
                data: vec![],
                owner: quasar_svm::system_program::ID,
                executable: false,
            },
            // NOTE: system_program NOT passed explicitly — SVM auto-creates builtins
        ],
    );
    result.assert_success();
    (
        agent,
        result.account(&agent).unwrap().clone(),
        result.account(&owner).unwrap().clone(),
    )
}

/// Read RatingState byte from raw account data (at offset 1 + 147 = 147 from start of data).
/// RatingAccountZc layout: job_id[16] + consumer[32] + specialist[32]
///   + consumer_commitment[32] + specialist_commitment[32]
///   + consumer_score[1] + specialist_score[1] + state[1] = 147
fn read_state_byte(svm: &QuasarSvm, rating: &Pubkey) -> u8 {
    let acct = svm.get_account(rating).expect("rating must exist");
    acct.data[147] // 1 (disc) + 16 + 32 + 32 + 32 + 32 + 1 + 1 = 147
}

fn read_consumer_score(svm: &QuasarSvm, rating: &Pubkey) -> u8 {
    let acct = svm.get_account(rating).expect("rating must exist");
    acct.data[145] // 1 + 16 + 32 + 32 + 32 + 32 = 145
}

fn read_specialist_score(svm: &QuasarSvm, rating: &Pubkey) -> u8 {
    let acct = svm.get_account(rating).expect("rating must exist");
    acct.data[146] // 1 + 16 + 32 + 32 + 32 + 32 + 1 = 146
}

/// Read reputation_score (u16 LE) from AgentAccount.
/// AgentAccountZc: owner[32] + agent_type[1] + model_len[1] + _pad[6] + rate_lamports[8]
///   + min_reputation[1] + _pad2[1] + reputation_score[2] = 1+52=51
fn read_reputation_score(svm: &QuasarSvm, agent: &Pubkey) -> u16 {
    let acct = svm.get_account(agent).expect("agent must exist");
    let lo = acct.data[51] as u16;
    let hi = acct.data[52] as u16;
    lo | (hi << 8)
}

/// Read jobs_completed (u64 LE): offset = 51+2+4 = 57
fn read_jobs_completed(svm: &QuasarSvm, agent: &Pubkey) -> u64 {
    let acct = svm.get_account(agent).expect("agent must exist");
    let mut bytes = [0u8; 8];
    bytes.copy_from_slice(&acct.data[57..65]);
    u64::from_le_bytes(bytes)
}

/// Read jobs_failed (u64 LE): offset = 65
fn read_jobs_failed(svm: &QuasarSvm, agent: &Pubkey) -> u64 {
    let acct = svm.get_account(agent).expect("agent must exist");
    let mut bytes = [0u8; 8];
    bytes.copy_from_slice(&acct.data[65..73]);
    u64::from_le_bytes(bytes)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/// Test 1: Full happy path — both commit, both reveal, scores applied.
/// Parity: `test_commit_and_reveal_both` in Anchor reputation.rs
#[test]
fn test_commit_and_reveal_both() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, specialist_acct) =
        register_agent(&mut svm, specialist);

    let job_id_bytes = [1u8; 16];
    let job_id = job_id_to_u128(job_id_bytes);
    let rating = rating_pda(job_id);
    let c_salt = [0xAAu8; 32];
    let s_salt = [0xBBu8; 32];
    let c_score: u8 = 8;
    let s_score: u8 = 7;

    // Consumer commits (first call — creates RatingAccount)
    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();
    println!("  COMMIT (consumer, first) CU: {}", r1.compute_units_consumed);

    // Specialist commits (second call — reuses RatingAccount)
    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, s_score, &s_salt), 1, specialist,
                   consumer, specialist, rating),
        &[
            r1.account(&rating).unwrap().clone(),
            funded(specialist),
        ],
    );
    r2.assert_success();
    println!("  COMMIT (specialist, second) CU: {}", r2.compute_units_consumed);

    // State should now be BothCommitted (1)
    assert_eq!(read_state_byte(&svm, &rating), 1, "state should be BothCommitted");

    // Consumer reveals
    let r3 = svm.process_instruction(
        &reveal_ix(job_id, c_score, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    r3.assert_success();
    println!("  REVEAL (consumer) CU: {}", r3.compute_units_consumed);

    // Specialist reveals — triggers finalisation
    let r4 = svm.process_instruction(
        &reveal_ix(job_id, s_score, s_salt, specialist, rating, specialist_agent, consumer_agent),
        &[
            r3.account(&rating).unwrap().clone(),
            specialist_acct.clone(),
            r3.account(&specialist_agent).unwrap().clone(),
            r3.account(&consumer_agent).unwrap().clone(),
        ],
    );
    r4.assert_success();
    println!("  REVEAL (specialist) CU: {}", r4.compute_units_consumed);

    // State should be Revealed (2)
    assert_eq!(read_state_byte(&svm, &rating), 2, "state should be Revealed");
    assert_eq!(read_consumer_score(&svm, &rating), c_score);
    assert_eq!(read_specialist_score(&svm, &rating), s_score);

    // Reputation scores should be non-zero
    let spec_rep = read_reputation_score(&svm, &specialist_agent);
    let cons_rep = read_reputation_score(&svm, &consumer_agent);
    assert!(spec_rep > 0, "specialist reputation should update: got {}", spec_rep);
    assert!(cons_rep > 0, "consumer reputation should update: got {}", cons_rep);

    // jobs_completed should be 1 for both
    assert_eq!(read_jobs_completed(&svm, &specialist_agent), 1);
    assert_eq!(read_jobs_completed(&svm, &consumer_agent), 1);
}

/// Test 2: commit → expire happy path.
/// Consumer commits, specialist ghosts. Expiry penalises specialist.
/// Parity: `test_expire_penalises_non_committer` in Anchor reputation.rs
#[test]
fn test_commit_and_expire() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id_bytes = [5u8; 16];
    let job_id = job_id_to_u128(job_id_bytes);
    let rating = rating_pda(job_id);
    let c_salt = [0xCCu8; 32];

    // Consumer commits (specialist ghosts)
    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, 9, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let spec_rep_before = read_reputation_score(&svm, &specialist_agent);
    let spec_failed_before = read_jobs_failed(&svm, &specialist_agent);

    // Warp past RATING_EXPIRE_SLOTS (1_512_000)
    svm.sysvars.warp_to_slot(1_512_100);

    // Consumer triggers expiry
    let r2 = svm.process_instruction(
        &expire_ix(job_id, consumer, rating, specialist_agent, consumer_agent),
        &[
            r1.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    r2.assert_success();
    println!("  EXPIRE CU: {}", r2.compute_units_consumed);

    // State should be Expired (3)
    assert_eq!(read_state_byte(&svm, &rating), 3, "state should be Expired");

    // Specialist should be penalised (jobs_failed++)
    let spec_rep_after = read_reputation_score(&svm, &specialist_agent);
    let spec_failed_after = read_jobs_failed(&svm, &specialist_agent);

    // score is 0 initially, saturating_sub stays 0
    assert!(
        spec_rep_after <= spec_rep_before,
        "specialist score should not increase: before={}, after={}",
        spec_rep_before, spec_rep_after
    );
    assert_eq!(
        spec_failed_after,
        spec_failed_before + 1,
        "specialist jobs_failed should increment"
    );

    // Consumer should NOT be penalised
    let cons_failed = read_jobs_failed(&svm, &consumer_agent);
    assert_eq!(cons_failed, 0, "consumer committed — should not be penalised");
}

/// Test 3: Reveal rejected before both parties commit.
/// Parity: `test_reveal_rejected_before_both_commit` in Anchor reputation.rs
#[test]
fn test_reveal_rejected_before_both_commit() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([2u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xAAu8; 32];
    let c_score: u8 = 9;

    // Only consumer commits
    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    // Consumer tries to reveal immediately — state is Pending, not BothCommitted
    let r2 = svm.process_instruction(
        &reveal_ix(job_id, c_score, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r1.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(r2.is_err(), "reveal before BothCommitted should fail (BothMustCommitFirst)");
}

/// Test 4: Tampered reveal rejected — wrong salt.
/// Parity: `test_tampered_reveal_rejected` in Anchor reputation.rs
#[test]
fn test_tampered_reveal_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, specialist_acct) =
        register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([3u8; 16]);
    let rating = rating_pda(job_id);
    let real_salt = [0x11u8; 32];
    let wrong_salt = [0xFFu8; 32];
    let c_score: u8 = 5;
    let s_score: u8 = 5;

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &real_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, s_score, &real_salt), 1, specialist,
                   consumer, specialist, rating),
        &[r1.account(&rating).unwrap().clone(), funded(specialist)],
    );
    r2.assert_success();

    // Consumer reveals with WRONG salt → CommitmentMismatch
    let r3 = svm.process_instruction(
        &reveal_ix(job_id, c_score, wrong_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(r3.is_err(), "reveal with wrong salt should fail (CommitmentMismatch)");
}

/// Test 5: Unauthorized reveal — signer is neither consumer nor specialist.
#[test]
fn test_unauthorized_reveal_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, _) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([6u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xAAu8; 32];
    let s_salt = [0xBBu8; 32];
    let c_score: u8 = 7;
    let s_score: u8 = 8;

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, s_score, &s_salt), 1, specialist,
                   consumer, specialist, rating),
        &[r1.account(&rating).unwrap().clone(), funded(specialist)],
    );
    r2.assert_success();

    // Attacker tries to reveal
    let attack = svm.process_instruction(
        &reveal_ix(job_id, c_score, c_salt, attacker, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            funded(attacker),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(attack.is_err(), "unauthorized reveal should fail (UnauthorisedSigner)");
}

/// Test 6: Duplicate commit rejected.
/// Parity: `test_duplicate_commit_rejected` in Anchor reputation.rs
#[test]
fn test_duplicate_commit_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    register_agent(&mut svm, consumer);
    register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([4u8; 16]);
    let rating = rating_pda(job_id);
    let salt = [0x55u8; 32];

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, 8, &salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    // Consumer tries to commit again — AlreadyCommitted
    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, 9, &salt), 0, consumer,
                   consumer, specialist, rating),
        &[
            r1.account(&rating).unwrap().clone(),
            r1.account(&consumer).unwrap().clone(),
        ],
    );
    assert!(r2.is_err(), "duplicate commit should fail (AlreadyCommitted)");
}

/// Test 7: Expiry boundary — expire rejected before RATING_EXPIRE_SLOTS.
#[test]
fn test_expire_rejected_before_window() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([7u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xDDu8; 32];

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, 8, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    // Do NOT warp — current slot < RATING_EXPIRE_SLOTS
    let r2 = svm.process_instruction(
        &expire_ix(job_id, consumer, rating, specialist_agent, consumer_agent),
        &[
            r1.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(r2.is_err(), "expire before window should fail (NotExpired)");
}

/// Test 8: Expiry boundary — expire succeeds exactly at RATING_EXPIRE_SLOTS + 1.
#[test]
fn test_expire_succeeds_after_window() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([8u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xEEu8; 32];

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, 6, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    // Warp to exactly 1 slot past expiry window
    svm.sysvars.warp_to_slot(1_512_001);

    let r2 = svm.process_instruction(
        &expire_ix(job_id, consumer, rating, specialist_agent, consumer_agent),
        &[
            r1.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    r2.assert_success();
    assert_eq!(read_state_byte(&svm, &rating), 3, "state should be Expired");
}

/// Test 9: Commit to already-revealed rating rejected (AlreadyFinalised parity).
#[test]
fn test_commit_to_revealed_rating_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, specialist_acct) =
        register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([9u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xF1u8; 32];
    let s_salt = [0xF2u8; 32];
    let c_score: u8 = 6;
    let s_score: u8 = 8;

    // Full commit-reveal cycle
    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, s_score, &s_salt), 1, specialist,
                   consumer, specialist, rating),
        &[r1.account(&rating).unwrap().clone(), funded(specialist)],
    );
    r2.assert_success();

    let r3 = svm.process_instruction(
        &reveal_ix(job_id, c_score, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    r3.assert_success();

    let r4 = svm.process_instruction(
        &reveal_ix(job_id, s_score, s_salt, specialist, rating, specialist_agent, consumer_agent),
        &[
            r3.account(&rating).unwrap().clone(),
            specialist_acct.clone(),
            r3.account(&specialist_agent).unwrap().clone(),
            r3.account(&consumer_agent).unwrap().clone(),
        ],
    );
    r4.assert_success();

    // Try to commit again on a Revealed rating — should fail (AlreadyFinalised)
    let r5 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[
            r4.account(&rating).unwrap().clone(),
            r4.account(&consumer).unwrap().clone(),
        ],
    );
    assert!(r5.is_err(), "commit to Revealed rating should fail (AlreadyFinalised)");
}

/// Test 10: Invalid score rejected (score 0 and score 11).
#[test]
fn test_invalid_score_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _specialist_acct) =
        register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([10u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xA1u8; 32];
    let s_salt = [0xA2u8; 32];
    let c_score: u8 = 7;
    let s_score: u8 = 7;

    let r1 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, c_score, &c_salt), 0, consumer,
                   consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let r2 = svm.process_instruction(
        &commit_ix(job_id, sha256_commitment(job_id, s_score, &s_salt), 1, specialist,
                   consumer, specialist, rating),
        &[r1.account(&rating).unwrap().clone(), funded(specialist)],
    );
    r2.assert_success();

    // Try reveal with score=0 (invalid sentinel)
    let bad_0 = svm.process_instruction(
        &reveal_ix(job_id, 0, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(bad_0.is_err(), "score=0 should be rejected (InvalidScore)");

    // Try reveal with score=11 (out of range)
    let bad_11 = svm.process_instruction(
        &reveal_ix(job_id, 11, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );
    assert!(bad_11.is_err(), "score=11 should be rejected (InvalidScore)");
}

/// Audit regression: MEDIUM-1 — all-zero commitment is rejected because it is the
/// uncommitted sentinel used by RatingAccount.
#[test]
fn test_audit_zero_commitment_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    register_agent(&mut svm, consumer);
    register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([11u8; 16]);
    let rating = rating_pda(job_id);

    let result = svm.process_instruction(
        &commit_ix(job_id, [0u8; 32], 0, consumer, consumer, specialist, rating),
        &[empty(rating), funded(consumer)],
    );

    assert!(
        result.is_err(),
        "audit MEDIUM-1 regression: zero commitment must fail"
    );
}

/// Audit regression: MEDIUM-2 — commitments are domain-separated by job and
/// program, so a commitment generated for another job cannot be revealed here.
#[test]
fn test_audit_cross_job_commitment_reuse_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, consumer_acct) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([12u8; 16]);
    let other_job_id = job_id_to_u128([13u8; 16]);
    let rating = rating_pda(job_id);
    let c_salt = [0xCAu8; 32];
    let s_salt = [0xCBu8; 32];

    let r1 = svm.process_instruction(
        &commit_ix(
            job_id,
            sha256_commitment(other_job_id, 8, &c_salt),
            0,
            consumer,
            consumer,
            specialist,
            rating,
        ),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    let r2 = svm.process_instruction(
        &commit_ix(
            job_id,
            sha256_commitment(job_id, 8, &s_salt),
            1,
            specialist,
            consumer,
            specialist,
            rating,
        ),
        &[r1.account(&rating).unwrap().clone(), funded(specialist)],
    );
    r2.assert_success();

    let reveal = svm.process_instruction(
        &reveal_ix(job_id, 8, c_salt, consumer, rating, specialist_agent, consumer_agent),
        &[
            r2.account(&rating).unwrap().clone(),
            consumer_acct.clone(),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );

    assert!(
        reveal.is_err(),
        "audit MEDIUM-2 regression: cross-job commitment reuse must fail"
    );
}

/// Audit regression: MEDIUM-4 — expiry can only be triggered by the recorded
/// consumer or specialist, not an arbitrary third-party caller.
#[test]
fn test_audit_expire_third_party_rejected() {
    let mut svm = setup();
    let consumer = Pubkey::new_unique();
    let specialist = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();

    let (consumer_agent, consumer_agent_acct, _) = register_agent(&mut svm, consumer);
    let (specialist_agent, specialist_agent_acct, _) = register_agent(&mut svm, specialist);

    let job_id = job_id_to_u128([14u8; 16]);
    let rating = rating_pda(job_id);
    let salt = [0xCCu8; 32];

    let r1 = svm.process_instruction(
        &commit_ix(
            job_id,
            sha256_commitment(job_id, 8, &salt),
            0,
            consumer,
            consumer,
            specialist,
            rating,
        ),
        &[empty(rating), funded(consumer)],
    );
    r1.assert_success();

    svm.sysvars.warp_to_slot(1_512_001);

    let result = svm.process_instruction(
        &expire_ix(job_id, attacker, rating, specialist_agent, consumer_agent),
        &[
            r1.account(&rating).unwrap().clone(),
            funded(attacker),
            specialist_agent_acct.clone(),
            consumer_agent_acct.clone(),
        ],
    );

    assert!(
        result.is_err(),
        "audit MEDIUM-4 regression: third-party expiry must fail"
    );
}
