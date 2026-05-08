//! MagicBlock PER instruction data layouts.
//!
//! These functions are intentionally small, deterministic, and `no_std` so the
//! PER program can build CPI data on-chain without heap allocation.

/// SDK discriminator for Permission Program `createPermission`.
pub const CREATE_PERMISSION_DISCRIMINATOR: [u8; 8] = [0, 0, 0, 0, 0, 0, 0, 0];

/// SDK discriminator for Permission Program `delegatePermission`.
pub const DELEGATE_PERMISSION_DISCRIMINATOR: [u8; 8] = [3, 0, 0, 0, 0, 0, 0, 0];

/// SDK discriminator for Permission Program `commitAndUndelegatePermission`.
pub const COMMIT_AND_UNDELEGATE_PERMISSION_DISCRIMINATOR: [u8; 8] = [5, 0, 0, 0, 0, 0, 0, 0];

/// Bincode discriminant for Magic Program `MagicBlockInstruction::ScheduleIntentBundle`.
pub const SCHEDULE_INTENT_BUNDLE_DISCRIMINATOR: [u8; 4] = [11, 0, 0, 0];

/// SDK discriminator for Delegation Program `delegate`.
pub const DELEGATE_ACCOUNT_DISCRIMINATOR: [u8; 8] = [0, 0, 0, 0, 0, 0, 0, 0];

/// MagicBlock member flag: authority.
pub const MEMBER_AUTHORITY_FLAG: u8 = 1 << 0;
/// MagicBlock member flag: can see tx logs.
pub const MEMBER_TX_LOGS_FLAG: u8 = 1 << 1;
/// MagicBlock member flag: can see tx balances.
pub const MEMBER_TX_BALANCES_FLAG: u8 = 1 << 2;
/// MagicBlock member flag: can see tx messages.
pub const MEMBER_TX_MESSAGES_FLAG: u8 = 1 << 3;
/// MagicBlock member flag: can see account signatures.
pub const MEMBER_ACCOUNT_SIGNATURES_FLAG: u8 = 1 << 4;

/// Serialize SDK `MembersArgs { members: null }`.
#[inline(always)]
pub const fn serialize_members_none() -> [u8; 1] {
    [0]
}

/// Data for Permission Program `createPermission` with `members: null`.
#[inline(always)]
pub const fn create_permission_data_members_none() -> [u8; 9] {
    let mut out = [0u8; 9];
    let mut i = 0;
    while i < 8 {
        out[i] = CREATE_PERMISSION_DISCRIMINATOR[i];
        i += 1;
    }
    out[8] = serialize_members_none()[0];
    out
}

/// Data for Permission Program `delegatePermission`.
#[inline(always)]
pub const fn delegate_permission_data() -> [u8; 8] {
    DELEGATE_PERMISSION_DISCRIMINATOR
}

/// Data for Permission Program `commitAndUndelegatePermission`.
#[inline(always)]
pub const fn commit_and_undelegate_permission_data() -> [u8; 8] {
    COMMIT_AND_UNDELEGATE_PERMISSION_DISCRIMINATOR
}

/// Data for Magic Program `ScheduleIntentBundle`:
///
/// - `commit_and_undelegate` one committed account at account index 2
/// - `undelegate_type = WithBaseActions` with one post-undelegate action
/// - action calls this program's exact `undelegate_callback` discriminator
/// - callback account metas are vault, undelegate buffer, authority, system program
///
/// The surrounding account list is expected to be:
/// 0. authority/payer signer writable
/// 1. Magic Context writable
/// 2. agent vault PDA signer writable
#[inline(always)]
pub const fn schedule_agent_vault_commit_and_undelegate_with_callback_data(
    destination_program: [u8; 32],
    vault: [u8; 32],
    undelegate_buffer: [u8; 32],
    authority: [u8; 32],
    system_program: [u8; 32],
) -> [u8; 235] {
    let mut out = [0u8; 235];
    let mut o = 0usize;
    let mut i = 0usize;

    while i < 4 {
        out[o + i] = SCHEDULE_INTENT_BUNDLE_DISCRIMINATOR[i];
        i += 1;
    }
    o += 4;

    // MagicIntentBundleArgs.commit = None (bincode Option tag)
    o += 1;
    // commit_and_undelegate = Some(...) (bincode Option tag)
    out[o] = 1;
    o += 1;
    // CommitTypeArgs::Standalone
    o += 4;
    // Vec<u8> length = 1 (u64), committed account index = 2
    out[o] = 1;
    o += 8;
    out[o] = 2;
    o += 1;
    // UndelegateTypeArgs::WithBaseActions
    out[o] = 1;
    o += 4;
    // base_actions vec length = 1
    out[o] = 1;
    o += 8;
    // ActionArgs.escrow_index = 255, data len = 8, data = undelegate callback discriminator
    out[o] = 255;
    o += 1;
    out[o] = 8;
    o += 8;
    i = 0;
    while i < 8 {
        out[o + i] = crate::magicblock::constants::UNDELEGATE_CALLBACK_DISCRIMINATOR[i];
        i += 1;
    }
    o += 8;
    // compute_units = 200_000u32
    let cu = 200_000u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[o + i] = cu[i];
        i += 1;
    }
    o += 4;
    // escrow_authority index = authority/payer index 0
    o += 1;
    i = 0;
    while i < 32 {
        out[o + i] = destination_program[i];
        i += 1;
    }
    o += 32;
    // callback ShortAccountMeta vec length = 4
    out[o] = 4;
    o += 8;

    i = 0;
    while i < 32 {
        out[o + i] = vault[i];
        i += 1;
    }
    o += 32;
    out[o] = 1;
    o += 1;

    i = 0;
    while i < 32 {
        out[o + i] = undelegate_buffer[i];
        i += 1;
    }
    o += 32;
    out[o] = 1;
    o += 1;

    i = 0;
    while i < 32 {
        out[o + i] = authority[i];
        i += 1;
    }
    o += 32;
    // authority readonly
    o += 1;

    i = 0;
    while i < 32 {
        out[o + i] = system_program[i];
        i += 1;
    }
    o += 32;
    // system readonly
    o += 1;

    // commit_finalize = None, commit_finalize_and_undelegate = None, standalone_actions len = 0
    o += 1;
    o += 1;
    // final u64 zero already present
    let _ = o;

    out
}

/// Data for Delegation Program `delegate` for this program's escrow PDA.
///
/// Mirrors the MagicBlock Rust CPI helper Borsh layout:
/// - 8-byte discriminator
/// - `commit_frequency_ms` u32 little-endian (`u32::MAX` = SDK default)
/// - `seeds: Vec<Vec<u8>>` with this program's escrow seeds, excluding bump
/// - `validator: Option<Pubkey>` as 1 + 32-byte validator pubkey
#[inline(always)]
pub const fn delegate_escrow_data(
    validator: [u8; 32],
    payer: [u8; 32],
    escrow_id: u64,
) -> [u8; 107] {
    let mut out = [0u8; 107];
    let mut offset = 0usize;
    let mut i = 0usize;
    while i < 8 {
        out[offset + i] = DELEGATE_ACCOUNT_DISCRIMINATOR[i];
        i += 1;
    }
    offset += 8;

    let freq = u32::MAX.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = freq[i];
        i += 1;
    }
    offset += 4;

    let seed_count = 3u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed_count[i];
        i += 1;
    }
    offset += 4;

    let seed0_len = 6u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed0_len[i];
        i += 1;
    }
    offset += 4;
    let seed0 = *b"escrow";
    i = 0;
    while i < 6 {
        out[offset + i] = seed0[i];
        i += 1;
    }
    offset += 6;

    let seed1_len = 32u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed1_len[i];
        i += 1;
    }
    offset += 4;
    i = 0;
    while i < 32 {
        out[offset + i] = payer[i];
        i += 1;
    }
    offset += 32;

    let seed2_len = 8u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed2_len[i];
        i += 1;
    }
    offset += 4;
    let escrow_id_bytes = escrow_id.to_le_bytes();
    i = 0;
    while i < 8 {
        out[offset + i] = escrow_id_bytes[i];
        i += 1;
    }
    offset += 8;

    out[offset] = 1;
    offset += 1;

    i = 0;
    while i < 32 {
        out[offset + i] = validator[i];
        i += 1;
    }

    out
}

/// Data for Delegation Program `delegate` for this program's agent vault PDA.
///
/// Seeds mirror `AgentVault`: `[b"agent_vault", authority]`, excluding bump.
#[inline(always)]
pub const fn delegate_agent_vault_data(validator: [u8; 32], authority: [u8; 32]) -> [u8; 100] {
    let mut out = [0u8; 100];
    let mut offset = 0usize;
    let mut i = 0usize;
    while i < 8 {
        out[offset + i] = DELEGATE_ACCOUNT_DISCRIMINATOR[i];
        i += 1;
    }
    offset += 8;

    let freq = u32::MAX.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = freq[i];
        i += 1;
    }
    offset += 4;

    let seed_count = 2u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed_count[i];
        i += 1;
    }
    offset += 4;

    let seed0_len = 11u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed0_len[i];
        i += 1;
    }
    offset += 4;
    let seed0 = *b"agent_vault";
    i = 0;
    while i < 11 {
        out[offset + i] = seed0[i];
        i += 1;
    }
    offset += 11;

    let seed1_len = 32u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed1_len[i];
        i += 1;
    }
    offset += 4;
    i = 0;
    while i < 32 {
        out[offset + i] = authority[i];
        i += 1;
    }
    offset += 32;

    out[offset] = 1;
    offset += 1;

    i = 0;
    while i < 32 {
        out[offset + i] = validator[i];
        i += 1;
    }

    out
}

#[cfg(test)]
mod tests {
    extern crate std;

    use super::*;
    use std::{format, string::String};

    const DEVNET_TEE_VALIDATOR_BYTES: [u8; 32] = [
        5, 61, 71, 26, 133, 158, 115, 46, 104, 11, 201, 88, 248, 65, 7, 43, 143, 63, 188, 25, 115,
        155, 230, 151, 196, 198, 129, 18, 111, 140, 31, 116,
    ];

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
    }

    #[test]
    fn permission_instruction_data_matches_magicblock_js_sdk_fixture() {
        assert_eq!(
            hex(&create_permission_data_members_none()),
            "000000000000000000"
        );
        assert_eq!(hex(&delegate_permission_data()), "0300000000000000");
        assert_eq!(
            hex(&commit_and_undelegate_permission_data()),
            "0500000000000000"
        );
    }

    #[test]
    fn delegate_escrow_data_matches_magicblock_rust_cpi_shape() {
        let payer = [7u8; 32];
        assert_eq!(
            delegate_escrow_data(DEVNET_TEE_VALIDATOR_BYTES, payer, 2).len(),
            107
        );
        assert_eq!(
            hex(&delegate_escrow_data(DEVNET_TEE_VALIDATOR_BYTES, payer, 2)),
            "0000000000000000ffffffff0300000006000000657363726f7720000000070707070707070707070707070707070707070707070707070707070707070708000000020000000000000001053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74"
        );
    }

    #[test]
    fn delegate_agent_vault_data_matches_magicblock_rust_cpi_shape() {
        let authority = [9u8; 32];
        assert_eq!(
            delegate_agent_vault_data(DEVNET_TEE_VALIDATOR_BYTES, authority).len(),
            100
        );
        assert_eq!(
            hex(&delegate_agent_vault_data(DEVNET_TEE_VALIDATOR_BYTES, authority)),
            "0000000000000000ffffffff020000000b0000006167656e745f7661756c7420000000090909090909090909090909090909090909090909090909090909090909090901053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74"
        );
    }

    #[test]
    fn schedule_agent_vault_commit_and_undelegate_with_callback_matches_magic_api_fixture() {
        assert_eq!(
            hex(&schedule_agent_vault_commit_and_undelegate_with_callback_data(
                [9u8; 32],
                [2u8; 32],
                [3u8; 32],
                [4u8; 32],
                [0u8; 32],
            )),
            "0b000000000100000000010000000000000002010000000100000000000000ff0800000000000000c41c29ce302533a7400d0300000909090909090909090909090909090909090909090909090909090909090909040000000000000002020202020202020202020202020202020202020202020202020202020202020103030303030303030303030303030303030303030303030303030303030303030104040404040404040404040404040404040404040404040404040404040404040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );
    }

    #[test]
    fn member_visibility_flags_are_stable() {
        assert_eq!(MEMBER_AUTHORITY_FLAG, 1);
        assert_eq!(MEMBER_TX_LOGS_FLAG, 2);
        assert_eq!(MEMBER_TX_BALANCES_FLAG, 4);
        assert_eq!(MEMBER_TX_MESSAGES_FLAG, 8);
        assert_eq!(MEMBER_ACCOUNT_SIGNATURES_FLAG, 16);
    }
}
