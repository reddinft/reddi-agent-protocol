//! Static MagicBlock CPI account-meta plans.
//!
//! Later phases turn these plans into `DynCpiCall` builders using concrete
//! `AccountView`s. Keeping roles/flags separate first lets us test SDK account
//! order without introducing live CPI side effects.

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

/// SDK order for Permission Program `commitAndUndelegatePermission`.
pub const COMMIT_AND_UNDELEGATE_PERMISSION_ACCOUNTS: [AccountSpec; 5] = [
    AccountSpec::new(AccountRole::Authority, true, true),
    AccountSpec::new(AccountRole::PermissionedAccount, true, true),
    AccountSpec::new(AccountRole::Permission, false, true),
    AccountSpec::new(AccountRole::MagicProgram, false, false),
    AccountSpec::new(AccountRole::MagicContext, false, true),
];

#[cfg(test)]
mod tests {
    use super::*;

    fn flags(specs: &[AccountSpec]) -> Vec<(bool, bool)> {
        specs.iter().map(|spec| (spec.is_signer, spec.is_writable)).collect()
    }

    extern crate std;
    use std::vec::Vec;

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
    fn commit_and_undelegate_permission_account_flags_match_sdk_fixture() {
        assert_eq!(
            flags(&COMMIT_AND_UNDELEGATE_PERMISSION_ACCOUNTS),
            [(true, true), (true, true), (false, true), (false, false), (false, true)]
        );
    }
}
