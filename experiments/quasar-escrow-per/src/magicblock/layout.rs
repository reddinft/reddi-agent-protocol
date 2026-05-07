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
    fn member_visibility_flags_are_stable() {
        assert_eq!(MEMBER_AUTHORITY_FLAG, 1);
        assert_eq!(MEMBER_TX_LOGS_FLAG, 2);
        assert_eq!(MEMBER_TX_BALANCES_FLAG, 4);
        assert_eq!(MEMBER_TX_MESSAGES_FLAG, 8);
        assert_eq!(MEMBER_ACCOUNT_SIGNATURES_FLAG, 16);
    }
}
