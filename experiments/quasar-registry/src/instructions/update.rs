/// update_agent — Quasar parity port of Anchor `update_agent_handler`
///
/// Parity with Anchor version:
/// - `has_one = owner` enforced — only owner can mutate
/// - Updates rate_lamports, min_reputation, active
/// - PDA seeds `[b"agent", owner]` verified by Quasar constraint
///
/// Quasar notes:
/// - `has_one = owner` in `#[account(...)]` generates the same ownership check as Anchor
use {
    crate::{events::AgentUpdated, state::AgentAccount},
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Update<'info> {
    /// Agent PDA — must have `owner == owner.address()`
    #[account(
        mut,
        has_one = owner,
        seeds = AgentAccount::seeds(owner),
        bump = agent.bump,
    )]
    pub agent: &'info mut Account<AgentAccount>,

    /// Only the registered owner may update
    pub owner: &'info Signer,
}

impl<'info> Update<'info> {
    #[inline(always)]
    pub fn update(
        &mut self,
        rate_lamports: u64,
        min_reputation: u8,
        active: bool,
    ) -> Result<(), ProgramError> {
        self.agent.rate_lamports = rate_lamports.into();
        self.agent.min_reputation = min_reputation;
        self.agent.active = active as u8;

        emit!(AgentUpdated {
            agent: *self.agent.address(),
            owner: *self.owner.address(),
            rate_lamports,
        });

        Ok(())
    }
}
