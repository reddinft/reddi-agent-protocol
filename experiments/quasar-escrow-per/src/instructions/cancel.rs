/// cancel_escrow — port of Anchor cancel_escrow_handler
///
/// Parity:
/// - payer authorization
/// - locked-state guard
/// - lamports escrow -> payer (refund)
/// - close escrow to payer
///
/// Restores the Anchor 7-day CANCEL_WINDOW_SLOTS guard so payers cannot lock
/// work and immediately cancel after the payee begins execution.
use {
    crate::{
        events::EscrowCancelled,
        state::{EscrowAccount, EscrowStatus, CANCEL_WINDOW_SLOTS},
    },
    quasar_lang::{
        prelude::*,
        sysvars::{clock::Clock, Sysvar as _},
    },
};

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct Cancel<'info> {
    /// Only payer can cancel
    pub payer: &'info mut Signer,
    #[account(
        mut,
        has_one = payer,
        seeds = EscrowAccount::seeds(payer, escrow_id),
        bump = escrow.bump,
        close = payer,
    )]
    pub escrow: &'info mut Account<EscrowAccount>,
}

impl<'info> Cancel<'info> {
    #[inline(always)]
    pub fn cancel(&mut self, escrow_id: u64) -> Result<(), ProgramError> {
        if self.escrow.escrow_id != escrow_id {
            return Err(ProgramError::InvalidArgument);
        }

        if self.escrow.status != EscrowStatus::Locked as u8 {
            return Err(ProgramError::InvalidAccountData);
        }

        let clock = Clock::get()?;
        let elapsed = clock
            .slot
            .get()
            .saturating_sub(self.escrow.created_slot.get());
        if elapsed < CANCEL_WINDOW_SLOTS {
            return Err(ProgramError::InvalidArgument);
        }

        let amount = u64::from(self.escrow.amount);

        // Refund escrow lamports back to payer
        let escrow_view = self.escrow.to_account_view();
        let payer_view = self.payer.to_account_view();

        let new_escrow_lamports = escrow_view
            .lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let new_payer_lamports = payer_view
            .lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        set_lamports(escrow_view, new_escrow_lamports);
        set_lamports(payer_view, new_payer_lamports);

        self.escrow.status = EscrowStatus::Cancelled as u8;

        emit!(EscrowCancelled {
            escrow: *self.escrow.address(),
            payer: *self.payer.address(),
            amount,
        }); // amount is already u64 here

        Ok(())
    }
}
