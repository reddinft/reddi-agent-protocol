use quasar_lang::prelude::*;

/// Emitted on successful register_agent.
/// All fields are Address (32 bytes, align 1) — no padding.
#[event(discriminator = 10)]
pub struct AgentRegistered {
    pub agent: Address,
    pub owner: Address,
}

/// Emitted on successful update_agent.
/// rate_lamports: u64, padded to 8 bytes cleanly after two Addresses.
#[event(discriminator = 11)]
pub struct AgentUpdated {
    pub agent: Address,
    pub owner: Address,
    pub rate_lamports: u64,
}

/// Emitted on successful deregister_agent.
#[event(discriminator = 12)]
pub struct AgentDeregistered {
    pub agent: Address,
    pub owner: Address,
}
