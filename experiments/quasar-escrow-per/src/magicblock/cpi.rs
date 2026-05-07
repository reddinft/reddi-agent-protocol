//! Static MagicBlock CPI account-meta plans and descriptor builders.
//!
//! These builders intentionally stop at deterministic CPI descriptors rather
//! than invoking MagicBlock programs. The on-chain instruction path can map the
//! role descriptors to concrete `AccountView`s and feed the same data/account
//! flags into Quasar `DynCpiCall`.

use super::layout;

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum ProgramRole {
    Permission,
    Delegation,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum AccountRole {
    Payer,
    Authority,
    PermissionedAccount,
    Permission,
    SystemProgram,
    PermissionProgram,
    DelegatedAccount,
    OwnerProgram,
    DelegateBuffer,
    DelegationRecord,
    DelegationMetadata,
    DelegationProgram,
    Validator,
    MagicProgram,
    MagicContext,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct AccountSpec {
    pub role: AccountRole,
    pub is_signer: bool,
    pub is_writable: bool,
}

impl AccountSpec {
    pub const fn new(role: AccountRole, is_signer: bool, is_writable: bool) -> Self {
        Self {
            role,
            is_signer,
            is_writable,
        }
    }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct CpiDescriptor<const MAX_ACCTS: usize, const DATA_LEN: usize> {
    pub program: ProgramRole,
    pub accounts: [AccountSpec; MAX_ACCTS],
    pub data: [u8; DATA_LEN],
    /// Account that must be invoked with PDA signer seeds, if any.
    pub signer_role: Option<AccountRole>,
}

impl<const MAX_ACCTS: usize, const DATA_LEN: usize> CpiDescriptor<MAX_ACCTS, DATA_LEN> {
    pub const fn new(
        program: ProgramRole,
        accounts: [AccountSpec; MAX_ACCTS],
        data: [u8; DATA_LEN],
        signer_role: Option<AccountRole>,
    ) -> Self {
        Self {
            program,
            accounts,
            data,
            signer_role,
        }
    }
}

/// SDK order for Permission Program `createPermission`.
pub const CREATE_PERMISSION_ACCOUNTS: [AccountSpec; 4] = [
    AccountSpec::new(AccountRole::PermissionedAccount, true, false),
    AccountSpec::new(AccountRole::Permission, false, true),
    AccountSpec::new(AccountRole::Payer, true, true),
    AccountSpec::new(AccountRole::SystemProgram, false, false),
];

/// SDK order for Permission Program `delegatePermission`.
pub const DELEGATE_PERMISSION_ACCOUNTS: [AccountSpec; 11] = [
    AccountSpec::new(AccountRole::Payer, true, true),
    AccountSpec::new(AccountRole::Authority, true, true),
    AccountSpec::new(AccountRole::PermissionedAccount, true, true),
    AccountSpec::new(AccountRole::Permission, false, true),
    AccountSpec::new(AccountRole::SystemProgram, false, false),
    AccountSpec::new(AccountRole::PermissionProgram, false, false),
    AccountSpec::new(AccountRole::DelegateBuffer, false, true),
    AccountSpec::new(AccountRole::DelegationRecord, false, true),
    AccountSpec::new(AccountRole::DelegationMetadata, false, true),
    AccountSpec::new(AccountRole::DelegationProgram, false, false),
    AccountSpec::new(AccountRole::Validator, false, false),
];

/// SDK order for Delegation Program `delegate`.
pub const DELEGATE_ESCROW_ACCOUNTS: [AccountSpec; 7] = [
    AccountSpec::new(AccountRole::Payer, true, true),
    AccountSpec::new(AccountRole::DelegatedAccount, true, true),
    AccountSpec::new(AccountRole::OwnerProgram, false, false),
    AccountSpec::new(AccountRole::DelegateBuffer, false, true),
    AccountSpec::new(AccountRole::DelegationRecord, false, true),
    AccountSpec::new(AccountRole::DelegationMetadata, false, true),
    AccountSpec::new(AccountRole::SystemProgram, false, false),
];

/// Same Delegation Program account order when delegating an `AgentVault` PDA.
pub const DELEGATE_AGENT_VAULT_ACCOUNTS: [AccountSpec; 7] = DELEGATE_ESCROW_ACCOUNTS;

/// SDK order for Permission Program `commitAndUndelegatePermission`.
pub const COMMIT_AND_UNDELEGATE_PERMISSION_ACCOUNTS: [AccountSpec; 5] = [
    AccountSpec::new(AccountRole::Authority, true, true),
    AccountSpec::new(AccountRole::PermissionedAccount, true, true),
    AccountSpec::new(AccountRole::Permission, false, true),
    AccountSpec::new(AccountRole::MagicProgram, false, false),
    AccountSpec::new(AccountRole::MagicContext, false, true),
];

pub const fn create_permission_descriptor() -> CpiDescriptor<4, 9> {
    CpiDescriptor::new(
        ProgramRole::Permission,
        CREATE_PERMISSION_ACCOUNTS,
        layout::create_permission_data_members_none(),
        Some(AccountRole::PermissionedAccount),
    )
}

pub const fn delegate_permission_descriptor() -> CpiDescriptor<11, 8> {
    CpiDescriptor::new(
        ProgramRole::Permission,
        DELEGATE_PERMISSION_ACCOUNTS,
        layout::delegate_permission_data(),
        Some(AccountRole::PermissionedAccount),
    )
}

pub const fn delegate_escrow_descriptor(
    validator: [u8; 32],
    payer: [u8; 32],
    escrow_id: u64,
) -> CpiDescriptor<7, 107> {
    CpiDescriptor::new(
        ProgramRole::Delegation,
        DELEGATE_ESCROW_ACCOUNTS,
        layout::delegate_escrow_data(validator, payer, escrow_id),
        Some(AccountRole::DelegatedAccount),
    )
}

pub const fn delegate_agent_vault_descriptor(
    validator: [u8; 32],
    authority: [u8; 32],
) -> CpiDescriptor<7, 100> {
    CpiDescriptor::new(
        ProgramRole::Delegation,
        DELEGATE_AGENT_VAULT_ACCOUNTS,
        layout::delegate_agent_vault_data(validator, authority),
        Some(AccountRole::DelegatedAccount),
    )
}

pub const fn commit_and_undelegate_permission_descriptor() -> CpiDescriptor<5, 8> {
    CpiDescriptor::new(
        ProgramRole::Permission,
        COMMIT_AND_UNDELEGATE_PERMISSION_ACCOUNTS,
        layout::commit_and_undelegate_permission_data(),
        Some(AccountRole::PermissionedAccount),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEVNET_TEE_VALIDATOR_BYTES: [u8; 32] = [
        5, 61, 71, 26, 133, 158, 115, 46, 104, 11, 201, 88, 248, 65, 7, 43, 143, 63, 188, 25, 115,
        155, 230, 151, 196, 198, 129, 18, 111, 140, 31, 116,
    ];

    fn flags(specs: &[AccountSpec]) -> Vec<(bool, bool)> {
        specs
            .iter()
            .map(|spec| (spec.is_signer, spec.is_writable))
            .collect()
    }

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
    }

    extern crate std;
    use std::{format, string::String, vec::Vec};

    #[test]
    fn create_permission_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&CREATE_PERMISSION_ACCOUNTS),
            [(true, false), (false, true), (true, true), (false, false)]
        );
    }

    #[test]
    fn delegate_permission_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&DELEGATE_PERMISSION_ACCOUNTS),
            [
                (true, true),
                (true, true),
                (true, true),
                (false, true),
                (false, false),
                (false, false),
                (false, true),
                (false, true),
                (false, true),
                (false, false),
                (false, false),
            ]
        );
    }

    #[test]
    fn delegate_escrow_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&DELEGATE_ESCROW_ACCOUNTS),
            [
                (true, true),
                (true, true),
                (false, false),
                (false, true),
                (false, true),
                (false, true),
                (false, false),
            ]
        );
    }

    #[test]
    fn delegate_agent_vault_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&DELEGATE_AGENT_VAULT_ACCOUNTS),
            flags(&DELEGATE_ESCROW_ACCOUNTS)
        );
    }

    #[test]
    fn commit_and_undelegate_permission_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&COMMIT_AND_UNDELEGATE_PERMISSION_ACCOUNTS),
            [
                (true, true),
                (true, true),
                (false, true),
                (false, false),
                (false, true)
            ]
        );
    }

    #[test]
    fn descriptors_pin_programs_data_and_pda_signer_roles() {
        let create = create_permission_descriptor();
        assert_eq!(create.program, ProgramRole::Permission);
        assert_eq!(hex(&create.data), "000000000000000000");
        assert_eq!(create.signer_role, Some(AccountRole::PermissionedAccount));

        let delegate_permission = delegate_permission_descriptor();
        assert_eq!(delegate_permission.program, ProgramRole::Permission);
        assert_eq!(hex(&delegate_permission.data), "0300000000000000");
        assert_eq!(
            delegate_permission.signer_role,
            Some(AccountRole::PermissionedAccount)
        );

        let delegate_escrow = delegate_escrow_descriptor(DEVNET_TEE_VALIDATOR_BYTES, [7u8; 32], 2);
        assert_eq!(delegate_escrow.program, ProgramRole::Delegation);
        assert_eq!(
            hex(&delegate_escrow.data),
            "0000000000000000ffffffff0300000006000000657363726f7720000000070707070707070707070707070707070707070707070707070707070707070708000000020000000000000001053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74"
        );
        assert_eq!(
            delegate_escrow.signer_role,
            Some(AccountRole::DelegatedAccount)
        );

        let delegate_agent_vault =
            delegate_agent_vault_descriptor(DEVNET_TEE_VALIDATOR_BYTES, [9u8; 32]);
        assert_eq!(delegate_agent_vault.program, ProgramRole::Delegation);
        assert_eq!(
            hex(&delegate_agent_vault.data),
            "0000000000000000ffffffff020000000b0000006167656e745f7661756c7420000000090909090909090909090909090909090909090909090909090909090909090901053d471a859e732e680bc958f841072b8f3fbc19739be697c4c681126f8c1f74"
        );
        assert_eq!(
            delegate_agent_vault.signer_role,
            Some(AccountRole::DelegatedAccount)
        );

        let commit = commit_and_undelegate_permission_descriptor();
        assert_eq!(commit.program, ProgramRole::Permission);
        assert_eq!(hex(&commit.data), "0500000000000000");
        assert_eq!(commit.signer_role, Some(AccountRole::PermissionedAccount));
    }
}
