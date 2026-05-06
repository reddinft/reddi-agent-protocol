/// QuasarSVM tests for the SOL-native escrow POC.
///
/// Covers:
///   1. lock → release (happy path)
///   2. lock → cancel / refund (happy path)
///   3. unauthorized release — wrong payer (auth failure)
///   4. zero amount rejected
///   5. release on closed (cancelled) escrow rejected
extern crate std;

use {
    quasar_lang::traits::HasSeeds,
    quasar_svm::{Account, AccountMeta, Instruction, Pubkey, QuasarSvm},
    std::{println, vec},
};

// ── Setup ─────────────────────────────────────────────────────────────────────

fn setup() -> QuasarSvm {
    let elf = std::fs::read(
        concat!(env!("CARGO_MANIFEST_DIR"), "/target/deploy/quasar_escrow_poc.so"),
    )
    .expect("build .so first: cargo build-sbf --manifest-path experiments/quasar-escrow/Cargo.toml");
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

fn counter_pda(payer: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[<crate::state::UserEscrowCounter as HasSeeds>::SEED_PREFIX, payer.as_ref()],
        &crate::ID,
    )
    .0
}

fn escrow_pda(payer: &Pubkey, escrow_id: u64) -> Pubkey {
    let escrow_id_bytes = escrow_id.to_le_bytes();
    Pubkey::find_program_address(
        &[
            <crate::state::EscrowAccount as HasSeeds>::SEED_PREFIX,
            payer.as_ref(),
            &escrow_id_bytes,
        ],
        &crate::ID,
    )
    .0
}

// ── Instruction builders ──────────────────────────────────────────────────────

fn lock_ix(
    payer: Pubkey,
    payee: Pubkey,
    counter: Pubkey,
    escrow: Pubkey,
    amount: u64,
    escrow_id: u64,
) -> Instruction {
    let mut data = vec![0u8]; // discriminator = 0
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(&escrow_id.to_le_bytes());
    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(payer, true),
            AccountMeta::new_readonly(payee, false),
            AccountMeta::new(counter, false),
            AccountMeta::new(escrow, false),
            AccountMeta::new_readonly(quasar_svm::system_program::ID, false),
        ],
        data,
    }
}

fn release_ix(payer: Pubkey, payee: Pubkey, escrow: Pubkey, escrow_id: u64) -> Instruction {
    let mut data = vec![1u8]; // discriminator = 1
    data.extend_from_slice(&escrow_id.to_le_bytes());
    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(payer, true),
            AccountMeta::new(payee, false),
            AccountMeta::new(escrow, false),
        ],
        data,
    }
}

fn cancel_ix(payer: Pubkey, escrow: Pubkey, escrow_id: u64) -> Instruction {
    let mut data = vec![2u8]; // discriminator = 2
    data.extend_from_slice(&escrow_id.to_le_bytes());
    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new(payer, true),
            AccountMeta::new(escrow, false),
        ],
        data,
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

/// Test 1: lock → release happy path.
#[test]
fn test_lock_and_release() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow_id = 0u64;
    let escrow = escrow_pda(&payer, escrow_id);
    let amount: u64 = 1_000_000_000;

    // --- Lock ---
    let lock_result = svm.process_instruction(
        &lock_ix(payer, payee, counter, escrow, amount, escrow_id),
        &[funded(payer), empty(payee), empty(counter), empty(escrow)],
    );

    lock_result.assert_success();
    println!("  LOCK CU:    {}", lock_result.compute_units_consumed);

    let escrow_lamports = lock_result.account(&escrow).expect("escrow exists").lamports;
    assert!(escrow_lamports >= amount, "escrow holds locked lamports");

    // --- Release ---
    let payee_before = lock_result.account(&payee).map(|a| a.lamports).unwrap_or(0);

    let release_result = svm.process_instruction(
        &release_ix(payer, payee, escrow, escrow_id),
        &[
            lock_result.account(&payer).unwrap().clone(),
            lock_result.account(&payee).cloned().unwrap_or(empty(payee)),
            lock_result.account(&escrow).unwrap().clone(),
        ],
    );

    release_result.assert_success();
    println!("  RELEASE CU: {}", release_result.compute_units_consumed);

    let payee_after = release_result.account(&payee).map(|a| a.lamports).unwrap_or(0);
    assert!(payee_after >= payee_before + amount, "payee received funds");
    let escrow_after = release_result.account(&escrow);
    assert!(
        escrow_after.map(|a| a.lamports).unwrap_or(0) == 0,
        "escrow PDA should be closed (lamports=0) after release"
    );
}

/// Test 2: lock → cancel (refund) happy path.
#[test]
fn test_lock_and_cancel() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow_id = 0u64;
    let escrow = escrow_pda(&payer, escrow_id);
    let amount: u64 = 500_000_000;

    let lock_result = svm.process_instruction(
        &lock_ix(payer, payee, counter, escrow, amount, escrow_id),
        &[funded(payer), empty(payee), empty(counter), empty(escrow)],
    );
    lock_result.assert_success();

    let payer_after_lock = lock_result.account(&payer).unwrap().lamports;

    let cancel_result = svm.process_instruction(
        &cancel_ix(payer, escrow, escrow_id),
        &[
            lock_result.account(&payer).unwrap().clone(),
            lock_result.account(&escrow).unwrap().clone(),
        ],
    );

    cancel_result.assert_success();
    println!("  CANCEL CU:  {}", cancel_result.compute_units_consumed);

    let payer_after_cancel = cancel_result.account(&payer).unwrap().lamports;
    assert!(
        payer_after_cancel > payer_after_lock,
        "payer refunded after cancel"
    );
    assert!(
        cancel_result.account(&escrow).map(|a| a.lamports).unwrap_or(0) == 0,
        "escrow PDA should be closed (lamports=0) after cancel"
    );
}

/// Test 3: unauthorized release — wrong payer cannot release.
/// Seeds constraint rejects attacker because escrow seeds include payer pubkey.
#[test]
fn test_unauthorized_release_fails() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee = Pubkey::new_unique();
    let attacker = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow_id = 0u64;
    let escrow = escrow_pda(&payer, escrow_id);
    let amount: u64 = 1_000_000_000;

    // Lock as legitimate payer
    let lock_result = svm.process_instruction(
        &lock_ix(payer, payee, counter, escrow, amount, escrow_id),
        &[funded(payer), empty(payee), empty(counter), empty(escrow)],
    );
    lock_result.assert_success();

    // Attacker passes correct escrow PDA but wrong payer —
    // has_one = payer constraint rejects this.
    let attack_result = svm.process_instruction(
        &release_ix(attacker, payee, escrow, escrow_id),
        &[
            funded(attacker),
            lock_result.account(&payee).cloned().unwrap_or(empty(payee)),
            lock_result.account(&escrow).unwrap().clone(),
        ],
    );

    assert!(
        attack_result.is_err(),
        "unauthorized release should fail, but succeeded"
    );
}

/// Test 4: zero amount is rejected by the program guard.
#[test]
fn test_zero_amount_rejected() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow = escrow_pda(&payer, 0);

    let result = svm.process_instruction(
        &lock_ix(payer, payee, counter, escrow, 0, 0),
        &[funded(payer), empty(payee), empty(counter), empty(escrow)],
    );

    assert!(result.is_err(), "zero amount lock should be rejected");
}

/// Test 5: release after cancel — double-spend attempt fails.
/// The escrow PDA is closed after cancel so a subsequent release has no account to load.
#[test]
fn test_release_after_cancel_fails() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow_id = 0u64;
    let escrow = escrow_pda(&payer, escrow_id);
    let amount: u64 = 1_000_000_000;

    let lock_result = svm.process_instruction(
        &lock_ix(payer, payee, counter, escrow, amount, escrow_id),
        &[funded(payer), empty(payee), empty(counter), empty(escrow)],
    );
    lock_result.assert_success();

    let cancel_result = svm.process_instruction(
        &cancel_ix(payer, escrow, escrow_id),
        &[
            lock_result.account(&payer).unwrap().clone(),
            lock_result.account(&escrow).unwrap().clone(),
        ],
    );
    cancel_result.assert_success();
    assert!(
        cancel_result.account(&escrow).map(|a| a.lamports).unwrap_or(0) == 0,
        "escrow should be closed after cancel"
    );

    // Try release on closed/nonexistent escrow
    let release_result = svm.process_instruction(
        &release_ix(payer, payee, escrow, escrow_id),
        &[
            cancel_result.account(&payer).unwrap().clone(),
            cancel_result.account(&payee).cloned().unwrap_or(empty(payee)),
            cancel_result.account(&escrow).cloned().unwrap_or(empty(escrow)), // closed
        ],
    );

    assert!(
        release_result.is_err(),
        "release on closed escrow should fail"
    );
}

/// Test 6: payer can open multiple concurrent escrows via u64 counter ids.
#[test]
fn test_multiple_escrows_per_payer() {
    let mut svm = setup();

    let payer = Pubkey::new_unique();
    let payee_a = Pubkey::new_unique();
    let payee_b = Pubkey::new_unique();
    let counter = counter_pda(&payer);
    let escrow0 = escrow_pda(&payer, 0);
    let escrow1 = escrow_pda(&payer, 1);

    let first = svm.process_instruction(
        &lock_ix(payer, payee_a, counter, escrow0, 100_000_000, 0),
        &[funded(payer), empty(payee_a), empty(counter), empty(escrow0)],
    );
    first.assert_success();

    let second = svm.process_instruction(
        &lock_ix(payer, payee_b, counter, escrow1, 200_000_000, 1),
        &[
            first.account(&payer).unwrap().clone(),
            empty(payee_b),
            first.account(&counter).unwrap().clone(),
            empty(escrow1),
        ],
    );
    second.assert_success();

    assert!(second.account(&escrow0).is_some(), "escrow #0 still exists");
    assert!(second.account(&escrow1).is_some(), "escrow #1 exists");
}
