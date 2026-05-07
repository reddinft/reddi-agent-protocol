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
//! | `[81, 80, 69, 82, 68, 69, 76, 71]` | MagicBlock delegate PER CPI |
//! | `[81, 80, 69, 82, 67, 77, 73, 84]` | MagicBlock commit/undelegate PER CPI |
//! | `[81, 80, 69, 82, 86, 65, 76, 84]` | Prepare self-custodied agent vault |
//! | `[81, 80, 69, 82, 86, 84, 65, 75]` | Release escrow into agent vault |
//! | `[81, 80, 69, 82, 86, 87, 68, 82]` | Withdraw from agent vault |
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

// Fresh PER-specific devnet program ID generated for the Quasar-native MagicBlock PER path.
// Recorded separately from the reusable Quasar escrow ID.
declare_id!("7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb");

#[program]
mod quasar_escrow_per_poc {
    use super::*;

    /// Lock SOL into escrow.
    ///
    /// Quasar equivalent of Anchor `lock_escrow(amount, nonce)`.
    #[instruction(discriminator = [81, 80, 69, 82, 76, 79, 67, 75])]
    pub fn make(ctx: Ctx<Lock>, amount: u64, escrow_id: u64) -> Result<(), ProgramError> {
        ctx.accounts.lock(amount, escrow_id, &ctx.bumps)
    }

    /// Release escrowed SOL to payee.
    ///
    /// Quasar equivalent of Anchor `release_escrow()`.
    #[instruction(discriminator = [81, 80, 69, 82, 84, 65, 75, 69])]
    pub fn take(ctx: Ctx<Release>, escrow_id: u64) -> Result<(), ProgramError> {
        ctx.accounts.release(escrow_id)
    }

    /// Cancel escrow and refund payer.
    ///
    /// Quasar equivalent of Anchor `cancel_escrow()`.
    /// Note: 7-day window guard from Anchor omitted — benchmarked separately.
    #[instruction(discriminator = [81, 80, 69, 82, 82, 69, 70, 68])]
    pub fn refund(ctx: Ctx<Cancel>, escrow_id: u64) -> Result<(), ProgramError> {
        ctx.accounts.cancel(escrow_id)
    }

    /// Delegate escrow state to MagicBlock PER using explicit Quasar CPI.
    #[instruction(discriminator = [81, 80, 69, 82, 68, 69, 76, 71])]
    pub fn delegate_per(ctx: Ctx<DelegatePer>, escrow_id: u64) -> Result<(), ProgramError> {
        ctx.accounts.delegate_per(escrow_id, &ctx.bumps)
    }

    /// Commit and undelegate MagicBlock PER permission state using explicit Quasar CPI.
    #[instruction(discriminator = [81, 80, 69, 82, 67, 77, 73, 84])]
    pub fn commit_undelegate_per(
        ctx: Ctx<CommitUndelegatePer>,
        escrow_id: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.commit_undelegate_per(escrow_id, &ctx.bumps)
    }

    /// Prepare a self-custodied Quasar agent vault.
    #[instruction(discriminator = [81, 80, 69, 82, 86, 65, 76, 84])]
    pub fn prepare_agent_vault(ctx: Ctx<PrepareAgentVault>) -> Result<(), ProgramError> {
        ctx.accounts.prepare_agent_vault(&ctx.bumps)
    }

    /// Credit an escrow release into the payee's self-custodied agent vault.
    #[instruction(discriminator = [81, 80, 69, 82, 86, 84, 65, 75])]
    pub fn take_to_agent_vault(
        ctx: Ctx<TakeToAgentVault>,
        escrow_id: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.take_to_agent_vault(escrow_id)
    }

    /// Agent-authorized base-layer withdrawal from the agent vault.
    #[instruction(discriminator = [81, 80, 69, 82, 86, 87, 68, 82])]
    pub fn withdraw_agent_vault(
        ctx: Ctx<WithdrawAgentVault>,
        amount: u64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.withdraw_agent_vault(amount)
    }

    /// MagicBlock undelegation callback entrypoint.
    ///
    /// Exact discriminator required by MagicBlock docs:
    /// `[196, 28, 41, 206, 48, 37, 51, 167]`. Phase 1 keeps this as a
    /// no-op compatibility hook; later phases wire validation/settlement.
    #[instruction(discriminator = [196, 28, 41, 206, 48, 37, 51, 167])]
    pub fn undelegate_callback(_ctx: Ctx<UndelegateCallback>) -> Result<(), ProgramError> {
        Ok(())
    }
}
