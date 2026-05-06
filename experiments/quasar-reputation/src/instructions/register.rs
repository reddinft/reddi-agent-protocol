/// register_agent — Quasar parity port for test setup.
///
/// Included so QuasarSVM tests can register agents before rating them,
/// matching Anchor test patterns.
use {
    crate::state::{
        AgentAccount, AgentAccountInner, AGENT_FEE_BURN_ADDRESS, AGENT_MODEL_MAX_LEN,
        AGENT_REGISTRATION_FEE,
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(
        init,
        payer = owner,
        seeds = AgentAccount::seeds(owner),
        bump,
    )]
    pub agent: &'info mut Account<AgentAccount>,

    pub owner: &'info mut Signer,

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
        if model_bytes.len() > AGENT_MODEL_MAX_LEN {
            return Err(ProgramError::InvalidArgument);
        }
        if core::str::from_utf8(model_bytes).is_err() {
            return Err(ProgramError::InvalidArgument);
        }
        if self.fee_collector.address() != &AGENT_FEE_BURN_ADDRESS {
            return Err(ProgramError::InvalidArgument);
        }
        if agent_type > 2 {
            return Err(ProgramError::InvalidArgument);
        }

        self.system_program
            .transfer(self.owner, self.fee_collector, AGENT_REGISTRATION_FEE)
            .invoke()?;

        let mut model_arr = [0u8; 64];
        model_arr[..model_bytes.len()].copy_from_slice(model_bytes);

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
            created_at: 0,
            active: 1,
            bump: bumps.agent,
            _pad4: [0u8; 6],
            model: model_arr,
        });

        Ok(())
    }
}
