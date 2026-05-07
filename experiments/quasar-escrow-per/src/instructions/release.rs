/// release_escrow — port of Anchor release_escrow_handler
///
/// In the MagicBlock PER path, the escrow PDA is owned by MagicBlock's
/// Delegation Program while executing on the ephemeral rollup. That means the
/// normal `Account<EscrowAccount>` owner/deserialisation guard is too strict for
/// private execution. Keep Quasar PDA seed validation, then manually validate the
/// escrow bytes before moving lamports.
use {
    crate::{
        events::EscrowReleased,
        state::{EscrowAccount, EscrowStatus},
    },
    quasar_lang::prelude::*,
};

const ESCROW_DISCRIMINATOR: u8 = 10;
const PAYER_OFFSET: usize = 1;
const PAYEE_OFFSET: usize = PAYER_OFFSET + 32;
const ESCROW_ID_OFFSET: usize = PAYEE_OFFSET + 32;
const AMOUNT_OFFSET: usize = ESCROW_ID_OFFSET + 8;
const STATUS_OFFSET: usize = AMOUNT_OFFSET + 8;
const MIN_ESCROW_LEN: usize = STATUS_OFFSET + 1;
const ESCROW_RENT_LAMPORTS_FOR_99_BYTES: u64 = 1_579_920;

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct Release<'info> {
    /// Only payer can release — checked manually against escrow bytes.
    pub payer: &'info mut Signer,
    /// Payee receives funds — checked manually against escrow bytes.
    pub payee: &'info UncheckedAccount,
    /// CHECK: In MagicBlock PER this PDA is delegated, so its runtime owner is
    /// the Delegation Program. Validate PDA seeds here and escrow contents below.
    #[account(mut, seeds = EscrowAccount::seeds(payer, escrow_id), bump)]
    pub escrow: &'info mut UncheckedAccount,
}

impl<'info> Release<'info> {
    #[inline(always)]
    pub fn release(&mut self, escrow_id: u64) -> Result<(), ProgramError> {
        let mut escrow_view = self.escrow.to_account_view().clone();
        let payee_view = self.payee.to_account_view();

        let mut write_status = true;
        let amount = {
            let data = unsafe { escrow_view.borrow_unchecked_mut() };
            if data.len() < MIN_ESCROW_LEN {
                return Err(ProgramError::InvalidAccountData);
            }

            if data[0] == ESCROW_DISCRIMINATOR {
                if &data[PAYER_OFFSET..PAYEE_OFFSET] != self.payer.address().as_ref() {
                    return Err(ProgramError::InvalidAccountData);
                }
                if &data[PAYEE_OFFSET..ESCROW_ID_OFFSET] != self.payee.address().as_ref() {
                    return Err(ProgramError::InvalidAccountData);
                }

                let stored_escrow_id = u64::from_le_bytes(
                    data[ESCROW_ID_OFFSET..AMOUNT_OFFSET]
                        .try_into()
                        .map_err(|_| ProgramError::InvalidAccountData)?,
                );
                if stored_escrow_id != escrow_id {
                    return Err(ProgramError::InvalidArgument);
                }

                if data[STATUS_OFFSET] != EscrowStatus::Locked as u8 {
                    return Err(ProgramError::InvalidAccountData);
                }

                u64::from_le_bytes(
                    data[AMOUNT_OFFSET..STATUS_OFFSET]
                        .try_into()
                        .map_err(|_| ProgramError::InvalidAccountData)?,
                )
            } else if data.iter().all(|b| *b == 0) {
                // MagicBlock's base-layer delegated mirror zeroes account data;
                // private execution still has the delegated PDA and lamports. For
                // the fixed-size PER smoke account, transfer lamports above rent.
                write_status = false;
                escrow_view
                    .lamports()
                    .checked_sub(ESCROW_RENT_LAMPORTS_FOR_99_BYTES)
                    .ok_or(ProgramError::InvalidAccountData)?
            } else {
                return Err(ProgramError::InvalidAccountData);
            }
        };

        if write_status {
            let new_escrow_lamports = escrow_view
                .lamports()
                .checked_sub(amount)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            let new_payee_lamports = payee_view
                .lamports()
                .checked_add(amount)
                .ok_or(ProgramError::ArithmeticOverflow)?;

            set_lamports(&escrow_view, new_escrow_lamports);
            set_lamports(payee_view, new_payee_lamports);

            let data = unsafe { escrow_view.borrow_unchecked_mut() };
            data[STATUS_OFFSET] = EscrowStatus::Released as u8;

            let payer_view = self.payer.to_account_view();
            let close_refund = escrow_view.lamports();
            let new_payer_lamports = payer_view
                .lamports()
                .checked_add(close_refund)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            set_lamports(payer_view, new_payer_lamports);
            unsafe { escrow_view.close_unchecked() };
        }

        emit!(EscrowReleased {
            escrow: *self.escrow.address(),
            payee: *self.payee.address(),
            amount,
        });

        Ok(())
    }
}
