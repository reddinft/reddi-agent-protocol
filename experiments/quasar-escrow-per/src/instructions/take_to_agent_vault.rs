use {
    crate::{
        events::AgentVaultCredited,
        state::{AgentVault, EscrowAccount, EscrowStatus},
    },
    quasar_lang::prelude::*,
};

/// Credit an escrow release into the payee's self-custodied agent vault.
///
/// This is the local/base semantics for the MagicBlock vault settlement target:
/// the TEE version should mutate delegated escrow + delegated vault, not an
/// arbitrary wallet payee account.
#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct TakeToAgentVault<'info> {
    /// Original payer authorizes release, matching the existing `take` flow.
    pub payer: &'info mut Signer,
    #[account(mut, seeds = EscrowAccount::seeds(payer, escrow_id), bump)]
    pub escrow: &'info mut Account<EscrowAccount>,
    #[account(mut, seeds = AgentVault::seeds(escrow.payee), bump)]
    pub vault: &'info mut Account<AgentVault>,
}

impl<'info> TakeToAgentVault<'info> {
    #[inline(always)]
    pub fn take_to_agent_vault(&mut self, escrow_id: u64) -> Result<(), ProgramError> {
        if u64::from(self.escrow.escrow_id) != escrow_id {
            return Err(ProgramError::InvalidArgument);
        }
        if self.escrow.status != EscrowStatus::Locked as u8 {
            return Err(ProgramError::InvalidAccountData);
        }
        if self.vault.authority != self.escrow.payee {
            return Err(ProgramError::InvalidAccountData);
        }
        if !self.vault.is_active() {
            return Err(ProgramError::InvalidAccountData);
        }

        let amount = u64::from(self.escrow.amount);
        let escrow_view = self.escrow.to_account_view();
        let vault_view = self.vault.to_account_view();

        let new_escrow_lamports = escrow_view
            .lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let new_vault_lamports = vault_view
            .lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        set_lamports(escrow_view, new_escrow_lamports);
        set_lamports(vault_view, new_vault_lamports);

        self.escrow.status = EscrowStatus::Released as u8;
        self.vault.balance = u64::from(self.vault.balance)
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .into();
        self.vault.lifetime_credited = u64::from(self.vault.lifetime_credited)
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .into();

        emit!(AgentVaultCredited {
            escrow: *self.escrow.address(),
            vault: *self.vault.address(),
            authority: self.vault.authority,
            amount,
        });

        Ok(())
    }
}
