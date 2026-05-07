use {
    crate::{events::AgentVaultWithdrawn, state::AgentVault},
    quasar_lang::prelude::*,
};

/// Agent-authorized withdrawal from a self-custodied payment vault.
#[derive(Accounts)]
#[instruction(_amount: u64)]
pub struct WithdrawAgentVault<'info> {
    /// Agent wallet / withdrawal authority.
    pub authority: &'info mut Signer,
    #[account(mut, seeds = AgentVault::seeds(authority), bump)]
    pub vault: &'info mut Account<AgentVault>,
}

impl<'info> WithdrawAgentVault<'info> {
    #[inline(always)]
    pub fn withdraw_agent_vault(&mut self, amount: u64) -> Result<(), ProgramError> {
        if amount == 0 {
            return Err(ProgramError::InvalidArgument);
        }
        if self.vault.authority != *self.authority.address() {
            return Err(ProgramError::InvalidAccountData);
        }
        if !self.vault.is_active() {
            return Err(ProgramError::InvalidAccountData);
        }
        if u64::from(self.vault.balance) < amount {
            return Err(ProgramError::InsufficientFunds);
        }

        let vault_view = self.vault.to_account_view();
        let authority_view = self.authority.to_account_view();
        let new_vault_lamports = vault_view
            .lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let new_authority_lamports = authority_view
            .lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        set_lamports(vault_view, new_vault_lamports);
        set_lamports(authority_view, new_authority_lamports);

        self.vault.balance = u64::from(self.vault.balance)
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .into();
        self.vault.lifetime_withdrawn = u64::from(self.vault.lifetime_withdrawn)
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .into();

        emit!(AgentVaultWithdrawn {
            vault: *self.vault.address(),
            authority: *self.authority.address(),
            amount,
        });

        Ok(())
    }
}
