/// lock_escrow — port of Anchor lock_escrow_handler
///
/// Parity with Anchor version:
/// - Create escrow PDA via seeds [b"escrow", payer, escrow_id]
/// - Validate amount > 0
/// - Transfer `amount` lamports payer -> escrow
/// - Write EscrowAccount state
///
/// Quasar changes:
/// - `Context<LockEscrow>` -> `Ctx<Lock>`
/// - `Result<()>` -> `Result<(), ProgramError>`
/// - system transfer via `self.system_program.transfer(...).invoke()`
/// - `escrow.set_inner(EscrowAccountInner { ... })` instead of field assignment
/// - Clock sysvar via `Clock` in accounts (or omitted in POC — use slot 0)
use {
    crate::{
        events::EscrowLocked,
        state::{EscrowAccount, EscrowAccountInner, EscrowStatus, UserEscrowCounter, UserEscrowCounterInner},
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(amount: u64, escrow_id: u64)]
pub struct Lock<'info> {
    /// Payer (Agent A) — funds the escrow and signs
    pub payer: &'info mut Signer,
    /// Payee (Agent B) — recipient on release; no signature required
    /// CHECK: payee is just a target address, validated by application layer
    pub payee: &'info UncheckedAccount,
    /// Per-payer escrow id counter
    #[account(
        init_if_needed,
        payer = payer,
        seeds = UserEscrowCounter::seeds(payer),
        bump,
    )]
    pub counter: &'info mut Account<UserEscrowCounter>,

    /// Escrow PDA — created here
    #[account(
        init,
        payer = payer,
        seeds = EscrowAccount::seeds(payer, escrow_id),
        bump,
    )]
    pub escrow: &'info mut Account<EscrowAccount>,
    pub system_program: &'info Program<System>,
}

impl<'info> Lock<'info> {
    #[inline(always)]
    pub fn lock(
        &mut self,
        amount: u64,
        escrow_id: u64,
        bumps: &LockBumps,
    ) -> Result<(), ProgramError> {
        if amount == 0 {
            return Err(ProgramError::InvalidArgument);
        }

        if self.counter.payer == Address::default() {
            self.counter.set_inner(UserEscrowCounterInner {
                payer: *self.payer.address(),
                next_id: 0,
                bump: bumps.counter,
            });
        }

        if u64::from(self.counter.next_id) != escrow_id {
            return Err(ProgramError::InvalidArgument);
        }

        // Transfer lamports payer → escrow
        self.system_program
            .transfer(self.payer, self.escrow, amount)
            .invoke()?;

        // Write state (Quasar `set_inner` pattern)
        self.escrow.set_inner(EscrowAccountInner {
            payer: *self.payer.address(),
            payee: *self.payee.address(),
            escrow_id,
            amount,
            status: EscrowStatus::Locked as u8,
            created_at: 0, // Clock sysvar omitted from POC for simplicity
            created_slot: 0,
            bump: bumps.escrow,
        });

        self.counter.next_id = u64::from(self.counter.next_id).saturating_add(1).into();

        emit!(EscrowLocked {
            escrow: *self.escrow.address(),
            payer: *self.payer.address(),
            payee: *self.payee.address(),
            amount,
        });

        Ok(())
    }
}
