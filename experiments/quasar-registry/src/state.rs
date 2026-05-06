use quasar_lang::prelude::*;

// ── Constants ─────────────────────────────────────────────────────────────────

/// PDA seed prefix for AgentAccount — mirrors Anchor `AGENT_SEED = b"agent"`
pub const AGENT_SEED: &[u8] = b"agent";

/// Registration fee in lamports (0.01 SOL) — burned to Solana incinerator.
/// Mirrors Anchor `AGENT_REGISTRATION_FEE`.
pub const AGENT_REGISTRATION_FEE: u64 = 10_000_000;

/// Max model string byte length — mirrors Anchor `AGENT_MODEL_MAX_LEN = 64`.
pub const AGENT_MODEL_MAX_LEN: usize = 64;

/// Solana incinerator address — fee destination matches Anchor canonical.
/// `1nc1nerator11111111111111111111111111111111`
pub const AGENT_FEE_BURN_ADDRESS: Address =
    address!("1nc1nerator11111111111111111111111111111111");

// ── Agent type ────────────────────────────────────────────────────────────────

/// Marketplace role supported by a registered agent.
///
/// Mirrors Anchor `AgentType` enum — byte representation matches.
/// 0 = Primary, 1 = Attestation, 2 = Both.
#[repr(u8)]
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
pub enum AgentType {
    Primary = 0,
    Attestation = 1,
    Both = 2,
}

impl AgentType {
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0 => Some(Self::Primary),
            1 => Some(Self::Attestation),
            2 => Some(Self::Both),
            _ => None,
        }
    }
}

// ── Account ───────────────────────────────────────────────────────────────────

/// On-chain registry record for a discoverable agent.
///
/// PDA seeds: `[b"agent", owner]`
///
/// Quasar notes vs Anchor:
/// - `#[account(discriminator = N)]` — explicit u8 discriminant instead of 8-byte hash
/// - `#[seeds(...)]` — generates `AgentAccount::seeds(owner)` helper + bump tracking
/// - `set_inner` attribute — caller must use `agent.set_inner(AgentAccountInner { ... })`
///
/// Structural delta vs Anchor:
/// - `model` stored as fixed-length `[u8; 64]` + `model_len: u8` instead of `String`.
///   Avoids Quasar dynamic-field realloc machinery (which requires a Rent sysvar in accounts).
///   Behavior parity is maintained: model length is validated, content is preserved.
///   This delta is documented in the parity report.
#[account(discriminator = 20, set_inner)]
#[seeds(b"agent", owner: Address)]
pub struct AgentAccount {
    /// Wallet that registered this agent
    pub owner: Address,
    /// Marketplace role (0=Primary, 1=Attestation, 2=Both)
    pub agent_type: u8,
    /// Byte length of the `model` string (0..=64)
    pub model_len: u8,
    /// Padding to next u64 boundary
    pub _pad: [u8; 6],
    /// Per-call price in lamports
    pub rate_lamports: u64,
    /// Minimum caller reputation required (0 = open access)
    pub min_reputation: u8,
    /// Padding
    pub _pad2: u8,
    /// Running reputation score, 0..10000 == 0.00..100.00
    pub reputation_score: u16,
    /// Padding to u64 boundary
    pub _pad3: [u8; 4],
    /// Successful jobs fulfilled
    pub jobs_completed: u64,
    /// Failed jobs
    pub jobs_failed: u64,
    /// Unix timestamp when registered (0 if Clock sysvar omitted)
    pub created_at: i64,
    /// Whether this agent can currently accept jobs
    pub active: u8,
    /// PDA bump seed
    pub bump: u8,
    /// Padding to end of struct
    pub _pad4: [u8; 6],
    /// Human-readable model identifier (max 64 chars, UTF-8 encoded, zero-padded)
    pub model: [u8; 64],
}

impl AgentAccount {
    /// Return agent_type as enum. Returns None for unknown discriminants.
    pub fn agent_type_enum(&self) -> Option<AgentType> {
        AgentType::from_u8(self.agent_type)
    }

    /// Return model as a str slice (valid UTF-8 guaranteed by register guard).
    pub fn model_str(&self) -> &str {
        let len = self.model_len as usize;
        core::str::from_utf8(&self.model[..len]).unwrap_or("")
    }

    /// Return whether agent is active (active == 1).
    pub fn is_active(&self) -> bool {
        self.active != 0
    }
}
