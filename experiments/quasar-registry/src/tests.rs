/// QuasarSVM tests for the Quasar agent registry.
///
/// Covers parity with Anchor `test_registry.rs`:
///   1. register Primary agent (happy path)
///   2. register Attestation agent (happy path)
///   3. register Both agent (happy path)
///   4. duplicate registration rejected
///   5. update_agent owner-only (happy path + unauthorized failure)
///   6. deregister closes PDA and returns rent to owner
///   7. unauthorized deregister rejected
extern crate std;

use {
    quasar_lang::traits::HasSeeds,
    quasar_svm::{Account, AccountMeta, Instruction, Pubkey, QuasarSvm},
    std::{println, vec},
};

// ── Setup ─────────────────────────────────────────────────────────────────────

fn setup() -> QuasarSvm {
    let elf = std::fs::read(
        concat!(env!("CARGO_MANIFEST_DIR"), "/target/deploy/quasar_registry.so"),
    )
    .expect("build .so first: cargo build-sbf --manifest-path experiments/quasar-registry/Cargo.toml");
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

fn agent_pda(owner: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[<crate::state::AgentAccount as HasSeeds>::SEED_PREFIX, owner.as_ref()],
        &crate::ID,
    )
    .0
}

/// The Solana incinerator address used as fee_collector.
fn fee_collector() -> Pubkey {
    "1nc1nerator11111111111111111111111111111111"
        .parse()
        .unwrap()
}

// ── Instruction builders ──────────────────────────────────────────────────────

/// Builds a `register` instruction.
/// Encodes: [disc=0][agent_type u8][model_len u8][model_data: 64 bytes][rate_lamports u64][min_reputation u8]
/// All fixed-size — no dynamic encoding needed.
fn register_ix(
    owner: Pubkey,
    agent: Pubkey,
    agent_type: u8,
    model: &str,
    rate_lamports: u64,
    min_reputation: u8,
) -> Instruction {
    let model_bytes = model.as_bytes();
    assert!(model_bytes.len() <= 64, "model too long for test");
    let mut model_data = [0u8; 64];
    model_data[..model_bytes.len()].copy_from_slice(model_bytes);

    let mut data = vec![0u8]; // discriminator = 0
    data.push(agent_type);                          // agent_type: u8
    data.push(model_bytes.len() as u8);             // model_len: u8
    data.extend_from_slice(&model_data);            // model_data: [u8; 64]
    data.extend_from_slice(&rate_lamports.to_le_bytes()); // rate_lamports: u64
    data.push(min_reputation);                      // min_reputation: u8

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

/// Builds an `update` instruction.
/// Encodes: [disc=1][rate_lamports u64][min_reputation u8][active bool]
fn update_ix(
    owner: Pubkey,
    agent: Pubkey,
    rate_lamports: u64,
    min_reputation: u8,
    active: bool,
) -> Instruction {
    let mut data = vec![1u8]; // discriminator = 1
    data.extend_from_slice(&rate_lamports.to_le_bytes());
    data.push(min_reputation);
    data.push(active as u8);

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(agent, false),
            AccountMeta::new_readonly(owner, true),
        ],
        data,
    }
}

/// Builds a `deregister` instruction.
/// Encodes: [disc=2]
fn deregister_ix(owner: Pubkey, agent: Pubkey) -> Instruction {
    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(agent, false),
            AccountMeta::new(owner, true),
        ],
        data: vec![2u8], // discriminator = 2
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/// Test 1: register Primary agent — happy path.
/// Parity: `register_primary_agent_success` in Anchor test_registry.rs
#[test]
fn test_register_primary_agent() {
    let mut svm = setup();

    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let fee_before = svm
        .get_account(&fee_coll)
        .map(|a| a.lamports)
        .unwrap_or(0);

    let result = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 3),
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
        ],
    );

    result.assert_success();
    println!("  REGISTER CU: {}", result.compute_units_consumed);

    let fee_after = result
        .account(&fee_coll)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert!(
        fee_after.saturating_sub(fee_before) >= 10_000_000,
        "registration fee (0.01 SOL) should be charged"
    );

    let agent_account = result.account(&agent).expect("agent PDA should exist");
    assert!(agent_account.lamports > 0, "agent PDA should hold rent-exempt lamports");
}

/// Test 2: register Attestation agent — happy path.
/// Parity: `register_attestation_agent_success` in Anchor tests.
#[test]
fn test_register_attestation_agent() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let result = svm.process_instruction(
        &register_ix(owner, agent, 1, "llama4", 500_000, 0),
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
        ],
    );
    result.assert_success();
    println!("  REGISTER (attestation) CU: {}", result.compute_units_consumed);
}

/// Test 3: register Both agent — happy path.
/// Parity: `register_both_success` in Anchor tests.
#[test]
fn test_register_both_agent() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let result = svm.process_instruction(
        &register_ix(owner, agent, 2, "sonnet", 2_000_000, 10),
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
        ],
    );
    result.assert_success();
    println!("  REGISTER (both) CU: {}", result.compute_units_consumed);
}

/// Test 4: duplicate registration rejected.
/// Parity: `duplicate_registration_rejected` in Anchor tests.
/// The PDA already exists — `init` constraint should reject the second call.
#[test]
fn test_duplicate_registration_rejected() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let first = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 0),
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
        ],
    );
    first.assert_success();

    // Second registration with same owner — PDA already initialized
    let second = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:14b", 2_000_000, 0),
        &[
            first.account(&agent).unwrap().clone(), // already-initialized account
            first.account(&owner).unwrap().clone(),
            first
                .account(&fee_coll)
                .cloned()
                .unwrap_or_else(|| Account {
                    address: fee_coll,
                    lamports: 0,
                    data: vec![],
                    owner: quasar_svm::system_program::ID,
                    executable: false,
                }),
        ],
    );
    assert!(
        second.is_err(),
        "duplicate registration should fail, but succeeded"
    );
}

/// Test 5a: update owner-only — happy path.
/// Parity: `update_rate_owner_only` (success branch) in Anchor tests.
#[test]
fn test_update_agent_owner_success() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let register_result = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 3),
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
        ],
    );
    register_result.assert_success();

    let update_result = svm.process_instruction(
        &update_ix(owner, agent, 2_500_000, 12, false),
        &[
            register_result.account(&agent).unwrap().clone(),
            register_result.account(&owner).unwrap().clone(),
        ],
    );
    update_result.assert_success();
    println!("  UPDATE CU: {}", update_result.compute_units_consumed);
}

/// Test 5b: unauthorized update rejected.
/// Parity: `update_rate_owner_only` (failure branch) in Anchor tests.
/// `has_one = owner` constraint must reject a different signer.
#[test]
fn test_update_agent_unauthorized_fails() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let register_result = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 3),
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
        ],
    );
    register_result.assert_success();

    // Attacker tries to update — agent was seeded with owner, has_one = owner rejects
    let attack_result = svm.process_instruction(
        &update_ix(attacker, agent, 9_999_999, 0, true),
        &[
            register_result.account(&agent).unwrap().clone(),
            funded(attacker),
        ],
    );
    assert!(
        attack_result.is_err(),
        "unauthorized update should fail, but succeeded"
    );
}

/// Test 6: deregister closes PDA and returns rent to owner.
/// Parity: `deregister_closes_pda` in Anchor tests.
#[test]
fn test_deregister_closes_pda() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let register_result = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 0),
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
        ],
    );
    register_result.assert_success();

    let owner_lamports_after_register = register_result
        .account(&owner)
        .map(|a| a.lamports)
        .unwrap_or(0);

    let deregister_result = svm.process_instruction(
        &deregister_ix(owner, agent),
        &[
            register_result.account(&agent).unwrap().clone(),
            register_result.account(&owner).unwrap().clone(),
        ],
    );
    deregister_result.assert_success();
    println!("  DEREGISTER CU: {}", deregister_result.compute_units_consumed);

    // Agent PDA should be closed (lamports = 0)
    assert!(
        deregister_result
            .account(&agent)
            .map(|a| a.lamports)
            .unwrap_or(0)
            == 0,
        "agent PDA should be closed (lamports=0) after deregister"
    );

    // Owner should receive rent back
    let owner_lamports_after_deregister = deregister_result
        .account(&owner)
        .map(|a| a.lamports)
        .unwrap_or(0);
    assert!(
        owner_lamports_after_deregister > owner_lamports_after_register,
        "owner should receive rent refund on deregister"
    );
}

/// Test 7: unauthorized deregister rejected.
/// An attacker cannot close an agent PDA they don't own.
#[test]
fn test_deregister_unauthorized_fails() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    let register_result = svm.process_instruction(
        &register_ix(owner, agent, 0, "qwen3:8b", 1_000_000, 0),
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
        ],
    );
    register_result.assert_success();

    // Attacker attempts to deregister owner's agent
    // has_one = owner + seeds include owner → Quasar rejects
    let attacker_agent = agent_pda(&attacker); // wrong PDA — attacker's address
    let attack_result = svm.process_instruction(
        &deregister_ix(attacker, agent), // correct PDA but wrong signer
        &[
            register_result.account(&agent).unwrap().clone(),
            funded(attacker),
        ],
    );
    assert!(
        attack_result.is_err(),
        "unauthorized deregister should fail, but succeeded"
    );
    let _ = attacker_agent; // suppress unused warning
}

/// Test 8: model too long rejected.
/// Validates AGENT_MODEL_MAX_LEN = 64 guard.
/// We pass model_len = 65 with 64-byte data buffer — the lib.rs guard fires.
#[test]
fn test_model_too_long_rejected() {
    let mut svm = setup();
    let owner = Pubkey::new_unique();
    let agent = agent_pda(&owner);
    let fee_coll = fee_collector();

    // Craft instruction with model_len = 65 (exceeds AGENT_MODEL_MAX_LEN)
    // The lib.rs len > 64 guard should reject this before reaching register().
    let mut data = vec![0u8]; // disc
    data.push(0u8);           // agent_type = Primary
    data.push(65u8);          // model_len = 65 — INVALID (> 64)
    data.extend_from_slice(&[b'a'; 64]); // model_data: 64 bytes
    data.extend_from_slice(&1_000_000u64.to_le_bytes()); // rate_lamports
    data.push(0u8);           // min_reputation

    let ix = Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(agent, false),
            AccountMeta::new(owner, true),
            AccountMeta::new(fee_coll, false),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    };

    let result = svm.process_instruction(
        &ix,
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
        ],
    );
    assert!(
        result.is_err(),
        "registration with model_len > 64 should fail"
    );
}
