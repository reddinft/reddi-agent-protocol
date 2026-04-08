use anchor_lang::prelude::{pubkey, Pubkey};

pub const ESCROW_SEED: &[u8] = b"escrow";
pub const AGENT_SEED: &[u8] = b"agent";
pub const ESCROW_DISCRIMINATOR_SIZE: usize = 8;
/// Minimum slots before a payer can cancel (~7 days at 400ms/slot)
pub const CANCEL_WINDOW_SLOTS: u64 = 50_400;

pub const AGENT_REGISTRATION_FEE: u64 = 10_000_000; // 0.01 SOL in lamports
pub const AGENT_MODEL_MAX_LEN: usize = 64;
pub const AGENT_FEE_BURN_ADDRESS: Pubkey = pubkey!("1nc1nerator11111111111111111111111111111111");
