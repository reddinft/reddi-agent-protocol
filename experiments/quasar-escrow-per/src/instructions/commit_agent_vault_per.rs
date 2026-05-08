use {
    crate::{
        magicblock::{constants as mb_constants, layout as mb_layout},
        state::AgentVault,
    },
    quasar_lang::prelude::*,
};

/// Accounts required to commit and undelegate a MagicBlock PER agent-vault permission.
#[derive(Accounts)]
pub struct CommitAgentVaultPer<'info> {
    /// Agent wallet that owns the vault authority and pays commit costs.
    pub authority: &'info mut Signer,
    /// CHECK: AgentVault PDA is delegated by this point, so its base-layer owner is
    /// MagicBlock's Delegation Program and the account data may be zeroed. Keep
    /// PDA seed validation, but do not require this program to own/deserialise it.
    #[account(mut, seeds = AgentVault::seeds(authority), bump)]
    pub agent_vault: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock permission PDA for the vault/permissioned account.
    pub permission: &'info mut UncheckedAccount,
    /// CHECK: Validated against the pinned MagicBlock Permission Program before PDA signing.
    pub permission_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock program used by commit+undelegate.
    pub magic_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock context account used by commit+undelegate.
    pub magic_context: &'info mut UncheckedAccount,
}

impl<'info> CommitAgentVaultPer<'info> {
    #[inline(always)]
    pub fn commit_agent_vault_per(
        &mut self,
        bumps: &CommitAgentVaultPerBumps,
    ) -> Result<(), ProgramError> {
        if *self.permission_program.address() != mb_constants::PERMISSION_PROGRAM_ID
            || *self.magic_program.address() != mb_constants::MAGIC_PROGRAM_ID
            || *self.magic_context.address() != mb_constants::MAGIC_CONTEXT_ID
        {
            return Err(ProgramError::InvalidArgument);
        }

        let bump = [bumps.agent_vault];
        let seeds = [
            Seed::from(&b"agent_vault"[..]),
            Seed::from(self.authority.address().as_ref()),
            Seed::from(&bump),
        ];

        let mut commit = DynCpiCall::<5, 8>::new(self.permission_program.address());
        commit.push_account(self.authority.to_account_view(), true, true)?;
        commit.push_account(self.agent_vault.to_account_view(), true, true)?;
        commit.push_account(self.permission.to_account_view(), false, true)?;
        commit.push_account(self.magic_program.to_account_view(), false, false)?;
        commit.push_account(self.magic_context.to_account_view(), false, true)?;
        commit.set_data(&mb_layout::commit_and_undelegate_permission_data())?;
        commit.invoke_signed(&seeds)
    }
}
