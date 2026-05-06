/// register_agent — Quasar parity port of Anchor `register_agent_handler`
///
/// Parity with Anchor version:
/// - Creates agent PDA via seeds `[b"agent", owner]`
/// - Validates model string length ≤ AGENT_MODEL_MAX_LEN (64)
/// - Burns AGENT_REGISTRATION_FEE (0.01 SOL) to Solana incinerator
/// - Writes all AgentAccount fields; reputation/job counters zero-init
/// - Fee collector address is validated in instruction logic
///
/// Quasar deltas (documented in parity report):
/// - `Context<RegisterAgent>` → `Ctx<Register>`
/// - `Result<()>` → `Result<(), ProgramError>`
/// - `Clock::get()?.unix_timestamp` → `created_at = 0`
///   (Clock sysvar not included in accounts for benchmark purity)
/// - `model: String` → `model: [u8; 64]` + `model_len: u8`
///   (Quasar dynamic String requires Rent sysvar in accounts; fixed array avoids that overhead)
use {
    crate::{
        events::AgentRegistered,
        state::{
            AgentAccount, AgentAccountInner, AGENT_FEE_BURN_ADDRESS, AGENT_MODEL_MAX_LEN,
            AGENT_REGISTRATION_FEE,
        },
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Register<'info> {
    /// Agent PDA — created here, seeded by [b"agent", owner]
    #[account(
        init,
        payer = owner,
        seeds = AgentAccount::seeds(owner),
        bump,
    )]
    pub agent: &'info mut Account<AgentAccount>,

    /// Owner / signer — pays rent and registration fee
    pub owner: &'info mut Signer,

    /// Fee destination — hard-coded Solana incinerator.
    /// CHECK: address validated in instruction body before transfer.
    pub fee_collector: &'info mut UncheckedAccount,

    pub system_program: &'info Program<System>,
}

impl<'info> Register<'info> {
    #[inline(always)]
    pub fn register(
        &mut self,
        agent_type: u8,
        model_bytes: &[u8],
        rate_lamports: u64,
        min_reputation: u8,
        bumps: &RegisterBumps,
    ) -> Result<(), ProgramError> {
        // Guard: model length
        if model_bytes.len() > AGENT_MODEL_MAX_LEN {
            return Err(ProgramError::InvalidArgument);
        }

        // Guard: model must be valid UTF-8
        if core::str::from_utf8(model_bytes).is_err() {
            return Err(ProgramError::InvalidArgument);
        }

        // Guard: fee_collector must be the Solana incinerator address
        if self.fee_collector.address() != &AGENT_FEE_BURN_ADDRESS {
            return Err(ProgramError::InvalidArgument);
        }

        // Guard: agent_type must be a valid discriminant (0, 1, 2)
        if agent_type > 2 {
            return Err(ProgramError::InvalidArgument);
        }

        // Burn registration fee: owner → incinerator (system program CPI)
        self.system_program
            .transfer(self.owner, self.fee_collector, AGENT_REGISTRATION_FEE)
            .invoke()?;

        // Pack model into fixed array
        let mut model_arr = [0u8; 64];
        model_arr[..model_bytes.len()].copy_from_slice(model_bytes);

        // Write agent account state (Quasar set_inner pattern)
        self.agent.set_inner(AgentAccountInner {
            owner: *self.owner.address(),
            agent_type,
            model_len: model_bytes.len() as u8,
            _pad: [0u8; 6],
            rate_lamports,
            min_reputation,
            _pad2: 0,
            reputation_score: 0,
            _pad3: [0u8; 4],
            jobs_completed: 0,
            jobs_failed: 0,
            created_at: 0, // Clock sysvar omitted — delta noted in parity report
            active: 1,     // true
            bump: bumps.agent,
            _pad4: [0u8; 6],
            model: model_arr,
        });

        emit!(AgentRegistered {
            agent: *self.agent.address(),
            owner: *self.owner.address(),
        });

        Ok(())
    }
}
