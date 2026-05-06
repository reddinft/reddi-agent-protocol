/// release_escrow — port of Anchor release_escrow_handler
///
/// Parity:
/// - `has_one = payer` enforcement
/// - locked-state guard
/// - lamports escrow -> payee
/// - close escrow to payer (rent returned)
///
/// Quasar changes:
/// - `close = payer` on escrow account in derive
/// - lamport transfer via `set_lamports` (same pattern as vault withdraw)
/// - status update before close
use {
    crate::{
        events::EscrowReleased,
        state::{EscrowAccount, EscrowStatus},
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct Release<'info> {
    /// Only payer can release — `has_one = payer` enforced by Quasar
    pub payer: &'info mut Signer,
    /// Payee receives funds — validated by has_one on escrow
    /// CHECK: payee is stored in escrow.payee and validated via constraint
    pub payee: &'info mut UncheckedAccount,
    #[account(
        mut,
        has_one = payer,
        has_one = payee,
        seeds = EscrowAccount::seeds(payer, escrow_id),
        bump = escrow.bump,
        close = payer,
    )]
    pub escrow: &'info mut Account<EscrowAccount>,
}

impl<'info> Release<'info> {
    #[inline(always)]
    pub fn release(&mut self, escrow_id: u64) -> Result<(), ProgramError> {
        if self.escrow.escrow_id != escrow_id {
            return Err(ProgramError::InvalidArgument);
        }

        if self.escrow.status != EscrowStatus::Locked as u8 {
            return Err(ProgramError::InvalidAccountData);
        }

        let amount = u64::from(self.escrow.amount);

        // Move lamports escrow -> payee via direct lamport manipulation
        // (escrow is PDA, can't be a system transfer signer without invoke_signed)
        let escrow_view = self.escrow.to_account_view();
        let payee_view = self.payee.to_account_view();

        let new_escrow_lamports = escrow_view
            .lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let new_payee_lamports = payee_view
            .lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        set_lamports(escrow_view, new_escrow_lamports);
        set_lamports(payee_view, new_payee_lamports);

        // Mark released (close = payer clears the rest)
        self.escrow.status = EscrowStatus::Released as u8;

        emit!(EscrowReleased {
            escrow: *self.escrow.address(),
            payee: *self.payee.address(),
            amount,
        }); // amount is already u64 here

        Ok(())
    }
}
