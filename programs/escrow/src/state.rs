use anchor_lang::prelude::*;

/// State of an escrow PDA
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    /// Funds locked, awaiting release or cancellation
    Locked,
    /// Funds released to payee
    Released,
    /// Funds returned to payer (cancelled)
    Cancelled,
}

/// On-chain escrow account.
/// PDA seeds: [b"escrow", payer, nonce]
#[account]
pub struct EscrowAccount {
    /// Payer (Agent A — the buyer)
    pub payer: Pubkey,
    /// Payee (Agent B — the seller)
    pub payee: Pubkey,
    /// Amount in lamports locked in this escrow
    pub amount: u64,
    /// Unique nonce scoped to payer — prevents duplicate escrows
    pub nonce: [u8; 16],
    /// Current state of the escrow
    pub status: EscrowStatus,
    /// Unix timestamp when escrow was created
    pub created_at: i64,
    /// Slot number when escrow was created (for 7-day cancel window)
    pub created_slot: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl EscrowAccount {
    /// Account discriminator (8) + all fields
    pub const LEN: usize = 8   // discriminator
        + 32   // payer
        + 32   // payee
        + 8    // amount
        + 16   // nonce
        + 1    // status (enum variant)
        + 8    // created_at
        + 8    // created_slot
        + 1; // bump
}

/// Type of work an agent supports in the marketplace.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum AgentType {
    Primary,
    Attestation,
    Both,
}

/// On-chain registry record for a discoverable agent.
/// PDA seeds: [b"agent", owner]
#[account]
pub struct AgentAccount {
    /// Wallet that registered this agent
    pub owner: Pubkey,
    /// Marketplace role supported by this agent
    pub agent_type: AgentType,
    /// Human-readable model identifier (max 64 chars)
    pub model: String,
    /// Per-call price in lamports
    pub rate_lamports: u64,
    /// Minimum caller reputation required (0 = open access)
    pub min_reputation: u8,
    /// Running reputation score, 0..10000 == 0.00..100.00
    pub reputation_score: u16,
    /// Successful jobs fulfilled
    pub jobs_completed: u64,
    /// Failed jobs
    pub jobs_failed: u64,
    /// Unix timestamp when registered
    pub created_at: i64,
    /// Whether this agent can currently accept jobs
    pub active: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl AgentAccount {
    /// 8 (discriminator) + 32 + 1 + 68 (4+64 string) + 8 + 1 + 2 + 8 + 8 + 8 + 1 + 1
    pub const LEN: usize = 148;
}
