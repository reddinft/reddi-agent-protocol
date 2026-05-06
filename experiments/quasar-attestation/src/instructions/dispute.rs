/// dispute_attestation — Quasar parity port of Anchor `dispute_attestation_handler`.
///
/// Parity with Anchor version:
/// - Only the job consumer can dispute (UnauthorisedSigner parity)
/// - Cannot resolve twice (AttestationAlreadyResolved parity)
/// - Sets `confirmed = Disputed` (Some(false) in Anchor)
/// - Penalises judge: `reputation_score -= RATING_EXPIRE_PENALTY` (saturating_sub parity)
///
/// Quasar deltas vs Anchor:
/// - `confirmed: u8` sentinel instead of `Option<bool>`.
/// - `reputation_score: u16` accessed via PodU16 `.get()` / `PodU16::from()`.
use {
    crate::state::{AgentAccount, AttestationAccount, AttestationStatus, RATING_EXPIRE_PENALTY},
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(job_id: u128)]
pub struct Dispute<'info> {
    #[account(
        mut,
        seeds = AttestationAccount::seeds(job_id),
        bump,
    )]
    pub attestation: &'info mut Account<AttestationAccount>,

    /// Judge's AgentAccount — receives the reputation penalty.
    #[account(
        mut,
        seeds = AgentAccount::seeds(attestation.judge),
        bump,
    )]
    pub judge_agent: &'info mut Account<AgentAccount>,

    /// The job consumer (must match attestation.consumer)
    pub consumer: &'info Signer,
}

impl<'info> Dispute<'info> {
    #[inline(always)]
    pub fn dispute(&mut self, _job_id: u128) -> Result<(), ProgramError> {
        // Guard: only the registered consumer can dispute
        if *self.consumer.address() != self.attestation.consumer {
            return Err(ProgramError::InvalidArgument); // UnauthorisedSigner parity
        }

        // Guard: cannot resolve twice
        if self.attestation.is_resolved() {
            return Err(ProgramError::InvalidArgument); // AttestationAlreadyResolved parity
        }

        // Mark as disputed
        self.attestation.confirmed = AttestationStatus::Disputed as u8;

        // Penalise judge's reputation (saturating_sub floors at 0)
        let old_rep = self.judge_agent.reputation_score.get();
        let new_rep = old_rep.saturating_sub(RATING_EXPIRE_PENALTY);
        self.judge_agent.reputation_score = PodU16::from(new_rep);

        Ok(())
    }
}
