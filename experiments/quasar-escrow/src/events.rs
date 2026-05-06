use quasar_lang::prelude::*;

/// Emitted on successful lock_escrow.
#[event(discriminator = 0)]
pub struct EscrowLocked {
    pub escrow: Address,
    pub payer: Address,
    pub payee: Address,
    pub amount: u64,
}

/// Emitted on successful release_escrow.
#[event(discriminator = 1)]
pub struct EscrowReleased {
    pub escrow: Address,
    pub payee: Address,
    pub amount: u64,
}

/// Emitted on successful cancel_escrow.
#[event(discriminator = 2)]
pub struct EscrowCancelled {
    pub escrow: Address,
    pub payer: Address,
    pub amount: u64,
}
