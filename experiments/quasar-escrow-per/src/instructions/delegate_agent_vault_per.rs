use {
    crate::{
        magicblock::{constants as mb_constants, layout as mb_layout},
        state::AgentVault,
    },
    quasar_lang::{cpi::system as quasar_system, prelude::*},
};

/// Accounts required to delegate a self-custodied agent vault PDA to MagicBlock PER.
#[derive(Accounts)]
pub struct DelegateAgentVaultPer<'info> {
    /// Agent wallet that owns withdrawal authority and pays MagicBlock setup costs.
    pub authority: &'info mut Signer,
    #[account(mut, seeds = AgentVault::seeds(authority), bump)]
    pub agent_vault: &'info mut Account<AgentVault>,
    /// CHECK: MagicBlock permission PDA for the vault/permissioned account.
    pub permission: &'info mut UncheckedAccount,
    /// CHECK: Validated against the pinned MagicBlock Permission Program before PDA signing.
    pub permission_program: &'info UncheckedAccount,
    /// CHECK: Validated against the pinned MagicBlock Delegation Program before PDA signing.
    pub delegation_program: &'info UncheckedAccount,
    /// CHECK: Validated against this PER program id before PDA signing.
    pub owner_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock delegate buffer for the permission PDA.
    pub permission_delegate_buffer: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation record for the permission PDA.
    pub permission_delegation_record: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation metadata for the permission PDA.
    pub permission_delegation_metadata: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegate buffer for the vault PDA.
    pub vault_delegate_buffer: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation record for the vault PDA.
    pub vault_delegation_record: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation metadata for the vault PDA.
    pub vault_delegation_metadata: &'info mut UncheckedAccount,
    /// CHECK: Validated against the pinned devnet MagicBlock TEE validator before PDA signing.
    pub validator: &'info UncheckedAccount,
    pub system_program: &'info Program<System>,
}

impl<'info> DelegateAgentVaultPer<'info> {
    #[inline(always)]
    pub fn delegate_agent_vault_per(
        &mut self,
        bumps: &DelegateAgentVaultPerBumps,
    ) -> Result<(), ProgramError> {
        if self.agent_vault.authority != *self.authority.address() || !self.agent_vault.is_active()
        {
            return Err(ProgramError::InvalidArgument);
        }
        if *self.permission_program.address() != mb_constants::PERMISSION_PROGRAM_ID
            || *self.delegation_program.address() != mb_constants::DELEGATION_PROGRAM_ID
            || *self.owner_program.address() != crate::ID
            || *self.validator.address() != mb_constants::DEVNET_TEE_VALIDATOR_ID
        {
            return Err(ProgramError::InvalidArgument);
        }

        let bump = [bumps.agent_vault];
        let seeds = [
            Seed::from(&b"agent_vault"[..]),
            Seed::from(self.authority.address().as_ref()),
            Seed::from(&bump),
        ];

        let mut create = DynCpiCall::<4, 9>::new(self.permission_program.address());
        create.push_account(self.agent_vault.to_account_view(), true, false)?;
        create.push_account(self.permission.to_account_view(), false, true)?;
        create.push_account(self.authority.to_account_view(), true, true)?;
        create.push_account(self.system_program.to_account_view(), false, false)?;
        create.set_data(&mb_layout::create_permission_data_members_none())?;
        create.invoke_signed(&seeds)?;

        let mut delegate_permission = DynCpiCall::<11, 8>::new(self.permission_program.address());
        delegate_permission.push_account(self.authority.to_account_view(), true, true)?;
        delegate_permission.push_account(self.authority.to_account_view(), true, true)?;
        delegate_permission.push_account(self.agent_vault.to_account_view(), true, true)?;
        delegate_permission.push_account(self.permission.to_account_view(), false, true)?;
        delegate_permission.push_account(self.system_program.to_account_view(), false, false)?;
        delegate_permission.push_account(
            self.permission_program.to_account_view(),
            false,
            false,
        )?;
        delegate_permission.push_account(
            self.permission_delegate_buffer.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.permission_delegation_record.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.permission_delegation_metadata.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.delegation_program.to_account_view(),
            false,
            false,
        )?;
        delegate_permission.push_account(self.validator.to_account_view(), false, false)?;
        delegate_permission.set_data(&mb_layout::delegate_permission_data())?;
        delegate_permission.invoke_signed(&seeds)?;

        // Match MagicBlock's PDA delegation lifecycle: copy state to the delegate
        // buffer, zero the account, assign to System, then transfer ownership to
        // the Delegation Program. Commit/undelegate restores the base-layer PDA.
        let mut vault_view = self.agent_vault.to_account_view().clone();
        unsafe { vault_view.borrow_unchecked_mut().fill(0) };
        unsafe { vault_view.assign(self.system_program.address()) };
        quasar_system::assign(&vault_view, self.delegation_program.address())
            .invoke_signed(&seeds)?;

        let validator = self.validator.address().to_bytes();
        let authority = self.authority.address().to_bytes();
        let mut delegate_vault = DynCpiCall::<7, 100>::new(self.delegation_program.address());
        delegate_vault.push_account(self.authority.to_account_view(), true, true)?;
        delegate_vault.push_account(self.agent_vault.to_account_view(), true, true)?;
        delegate_vault.push_account(self.owner_program.to_account_view(), false, false)?;
        delegate_vault.push_account(self.vault_delegate_buffer.to_account_view(), false, true)?;
        delegate_vault.push_account(self.vault_delegation_record.to_account_view(), false, true)?;
        delegate_vault.push_account(
            self.vault_delegation_metadata.to_account_view(),
            false,
            true,
        )?;
        delegate_vault.push_account(self.system_program.to_account_view(), false, false)?;
        delegate_vault.set_data(&mb_layout::delegate_agent_vault_data(validator, authority))?;
        delegate_vault.invoke_signed(&seeds)
    }
}
