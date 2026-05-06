/// deregister_agent — Quasar parity port of Anchor `deregister_agent_handler`
///
/// Parity with Anchor version:
/// - `has_one = owner` — only the registered owner can deregister
/// - `close = owner` — agent PDA is closed, all lamports (rent) returned to owner
/// - Registration fee is NOT returned (it was burned on register — immutable)
///
/// Quasar delta:
/// - Quasar's `close = owner` attribute in `#[account(...)]` directly matches
///   Anchor's `close = owner` — both drain lamports to `owner` after the instruction.
use {
    crate::{events::AgentDeregistered, state::AgentAccount},
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Deregister<'info> {
    /// Agent PDA — closed to owner on success; has_one = owner guards auth
    #[account(
        mut,
        has_one = owner,
        seeds = AgentAccount::seeds(owner),
        bump = agent.bump,
        close = owner,
    )]
    pub agent: &'info mut Account<AgentAccount>,

    /// Owner — must sign; receives rent lamports on close
    pub owner: &'info mut Signer,
}

impl<'info> Deregister<'info> {
    #[inline(always)]
    pub fn deregister(&mut self) -> Result<(), ProgramError> {
        emit!(AgentDeregistered {
            agent: *self.agent.address(),
            owner: *self.owner.address(),
        });

        Ok(())
    }
}
