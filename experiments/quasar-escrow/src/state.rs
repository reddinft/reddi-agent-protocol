use quasar_lang::prelude::*;

/// Seven-day payer cancellation window, matching the Anchor implementation.
pub const CANCEL_WINDOW_SLOTS: u64 = 7 * 24 * 60 * 60 * 2;

/// Escrow status — mirrors Anchor EscrowStatus enum.
#[repr(u8)]
#[derive(Copy, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Locked = 0,
    Released = 1,
    Cancelled = 2,
}

/// Tracks the next escrow id for a payer.
/// PDA seeds: [b"counter", payer]
#[account(discriminator = 9, set_inner)]
#[seeds(b"counter", payer: Address)]
pub struct UserEscrowCounter {
    pub payer: Address,
    pub next_id: u64,
    pub bump: u8,
}

/// On-chain escrow state.
///
/// PDA seeds: [b"escrow", payer, escrow_id]
///
/// Quasar notes vs Anchor:
/// - `#[account(discriminator = N)]` — explicit discriminator instead of auto-generated 8-byte hash
/// - `#[seeds(...)]` — generates `EscrowAccount::seeds(payer, escrow_id)` helper + bump tracking
/// - `set_inner` attribute required: caller must use `escrow.set_inner(EscrowAccountInner { ... })`
#[account(discriminator = 10, set_inner)]
#[seeds(b"escrow", payer: Address, escrow_id: u64)]
pub struct EscrowAccount {
    pub payer: Address,
    pub payee: Address,
    pub escrow_id: u64,
    pub amount: u64,
    pub status: u8,        // EscrowStatus as u8 — POC keeps it simple
    pub created_at: i64,
    pub created_slot: u64,
    pub bump: u8,
}

impl EscrowAccount {
    /// Used in tests to check status without unsafe casting
    pub fn is_locked(&self) -> bool {
        self.status == EscrowStatus::Locked as u8
    }
    pub fn is_released(&self) -> bool {
        self.status == EscrowStatus::Released as u8
    }
    pub fn is_cancelled(&self) -> bool {
        self.status == EscrowStatus::Cancelled as u8
    }
}
