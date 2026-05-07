#![no_std]
//! Quasar MagicBlock PER-specific SOL escrow POC
//!
//! Separate ABI from `experiments/quasar-escrow` so the reusable base escrow
//! can remain stable for future privacy rails while MagicBlock PER gets exact
//! 8-byte instruction discriminators, including the required undelegate callback.
//!
//! Instruction map:
//! | Discriminator bytes | Name |
//! |---------------------|------|
//! | `[81, 80, 69, 82, 76, 79, 67, 75]` | `make` / lock |
//! | `[81, 80, 69, 82, 84, 65, 75, 69]` | `take` / release |
//! | `[81, 80, 69, 82, 82, 69, 70, 68]` | `refund` / cancel |
//! | `[196, 28, 41, 206, 48, 37, 51, 167]` | MagicBlock undelegate callback |

use quasar_lang::prelude::*;

#[cfg(feature = "debug")]
extern crate alloc;

mod events;
mod instructions;
mod magicblock;
mod state;

use instructions::*;

#[cfg(test)]
mod tests;

// Fresh PER-specific program ID placeholder. Phase 4 deploys this program ID to devnet
// and records deployment evidence separately from the reusable Quasar escrow ID.
declare_id!("5BJxgZY7CLAooVFCpFanTvGwR9fNwBQoXbcrrAwtBAWJ");

#[program]
mod quasar_escrow_per_poc {
    use super::*;

    /// Lock SOL into escrow.
    ///
    /// Quasar equivalent of Anchor `lock_escrow(amount, nonce)`.
    #[instruction(discriminator = [81, 80, 69, 82, 76, 79, 67, 75])]
    pub fn make(
        ctx: Ctx<Lock>,
        amount: u64,
        escrow_id: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.lock(amount, escrow_id, &ctx.bumps)
    }

    /// Release escrowed SOL to payee.
    ///
    /// Quasar equivalent of Anchor `release_escrow()`.
    #[instruction(discriminator = [81, 80, 69, 82, 84, 65, 75, 69])]
    pub fn take(
        ctx: Ctx<Release>,
        escrow_id: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.release(escrow_id)
    }

    /// Cancel escrow and refund payer.
    ///
    /// Quasar equivalent of Anchor `cancel_escrow()`. 
    /// Note: 7-day window guard from Anchor omitted — benchmarked separately.
    #[instruction(discriminator = [81, 80, 69, 82, 82, 69, 70, 68])]
    pub fn refund(
        ctx: Ctx<Cancel>,
        escrow_id: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.cancel(escrow_id)
    }

    /// MagicBlock undelegation callback entrypoint.
    ///
    /// Exact discriminator required by MagicBlock docs:
    /// `[196, 28, 41, 206, 48, 37, 51, 167]`. Phase 1 keeps this as a
    /// no-op compatibility hook; later phases wire validation/settlement.
    #[instruction(discriminator = [196, 28, 41, 206, 48, 37, 51, 167])]
    pub fn undelegate_callback(
        _ctx: Ctx<UndelegateCallback>,
    ) -> Result<(), ProgramError> {
        Ok(())
    }
}
