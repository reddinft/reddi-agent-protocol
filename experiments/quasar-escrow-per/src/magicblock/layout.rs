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

/// Data for Delegation Program `delegate`.
///
/// Mirrors the JS SDK layout:
/// - 8-byte discriminator
/// - `commitFrequencyMs` u32 little-endian (`u32::MAX` = SDK default)
/// - seed vector length u32 little-endian (0 here)
/// - validator Option: 1 + 32-byte validator pubkey
#[inline(always)]
pub const fn delegate_account_data(validator: [u8; 32]) -> [u8; 49] {
    let mut out = [0u8; 49];
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

    let seed_len = 0u32.to_le_bytes();
    i = 0;
    while i < 4 {
        out[offset + i] = seed_len[i];
        i += 1;
    }
    offset += 4;

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
        5, 61, 71, 26, 133, 158, 115, 46, 104, 11, 201, 88, 248, 65, 7, 43, 143, 63, 188, 25,
        115, 155, 230, 151, 196, 198, 129, 18, 111, 140, 31, 116,
    ];

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
    }

    #[test]
    fn permission_instruction_data_matches_magicblock_js_sdk_fixture() {
        assert_eq!(hex(&create_permission_data_members_none()), "000000000000000000");
        assert_eq!(hex(&delegate_permission_data()), "0300000000000000");
        assert_eq!(hex(&commit_and_undelegate_permission_data()), "0500000000000000");
    }

    #[test]
    fn delegate_account_data_matches_magicblock_js_sdk_fixture() {
        assert_eq!(
            hex(&delegate_account_data(DEVNET_TEE_VALIDATOR_BYTES)),
            "0000000000000000ffffffff0000000001053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74"
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
