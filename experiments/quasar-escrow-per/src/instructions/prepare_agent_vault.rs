use {
    crate::{
        events::AgentVaultPrepared,
        state::{AgentVault, AgentVaultInner, AgentVaultStatus},
    },
    quasar_lang::prelude::*,
};

/// Prepare a self-custodied agent vault for the payee/agent wallet.
#[derive(Accounts)]
pub struct PrepareAgentVault<'info> {
    /// Payer funds rent for the vault setup.
    pub payer: &'info mut Signer,
    /// Agent wallet / withdrawal authority for this vault.
    /// CHECK: authority may be any wallet; withdraw later requires signer.
    pub authority: &'info UncheckedAccount,
    #[account(
        init_if_needed,
        payer = payer,
        seeds = AgentVault::seeds(authority),
        bump,
    )]
    pub vault: &'info mut Account<AgentVault>,
    pub system_program: &'info Program<System>,
}

impl<'info> PrepareAgentVault<'info> {
    #[inline(always)]
    pub fn prepare_agent_vault(
        &mut self,
        bumps: &PrepareAgentVaultBumps,
    ) -> Result<(), ProgramError> {
        if self.vault.authority == Address::default() {
            self.vault.set_inner(AgentVaultInner {
                authority: *self.authority.address(),
                balance: 0,
                lifetime_credited: 0,
                lifetime_withdrawn: 0,
                status: AgentVaultStatus::Active as u8,
                bump: bumps.vault,
            });
        } else if self.vault.authority != *self.authority.address() {
            return Err(ProgramError::InvalidAccountData);
        }

        emit!(AgentVaultPrepared {
            vault: *self.vault.address(),
            authority: *self.authority.address(),
        });

        Ok(())
    }
}
