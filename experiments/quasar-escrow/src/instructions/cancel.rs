/// cancel_escrow — port of Anchor cancel_escrow_handler
///
/// Parity:
/// - payer authorization
/// - locked-state guard
/// - lamports escrow -> payer (refund)
/// - close escrow to payer
///
/// Note: Anchor version has a 7-day CANCEL_WINDOW_SLOTS guard.
/// This POC omits the slot window check to keep the benchmark clean —
/// noted as a delta in QUASAR-BENCHMARKS.md.
use {
    crate::{
        events::EscrowCancelled,
        state::{EscrowAccount, EscrowStatus},
    },
    quasar_lang::prelude::*,
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

        let amount = u64::from(self.escrow.amount);

        // Refund escrow lamports back to payer
        let escrow_view = self.escrow.to_account_view();
        let payer_view = self.payer.to_account_view();

        set_lamports(escrow_view, escrow_view.lamports() - amount);
        set_lamports(payer_view, payer_view.lamports() + amount);

        self.escrow.status = EscrowStatus::Cancelled as u8;

        emit!(EscrowCancelled {
            escrow: *self.escrow.address(),
            payer: *self.payer.address(),
            amount,
        }); // amount is already u64 here

        Ok(())
    }
}
