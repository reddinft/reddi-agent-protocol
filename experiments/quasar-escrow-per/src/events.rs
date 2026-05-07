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

/// Emitted when an agent vault is prepared.
#[event(discriminator = 3)]
pub struct AgentVaultPrepared {
    pub vault: Address,
    pub authority: Address,
}

/// Emitted when escrow value is credited into a self-custodied agent vault.
#[event(discriminator = 4)]
pub struct AgentVaultCredited {
    pub escrow: Address,
    pub vault: Address,
    pub authority: Address,
    pub amount: u64,
}

/// Emitted when the agent wallet withdraws from its vault.
#[event(discriminator = 5)]
pub struct AgentVaultWithdrawn {
    pub vault: Address,
    pub authority: Address,
    pub amount: u64,
}
