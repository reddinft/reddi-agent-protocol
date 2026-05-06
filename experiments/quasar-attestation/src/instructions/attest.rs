/// attest_quality — Quasar parity port of Anchor `attest_quality_handler`.
///
/// Parity with Anchor version:
/// - Creates `AttestationAccount` PDA seeded by `[b"attestation", job_id]`
/// - `init` constraint enforces one-per-job deduplication (duplicate → rejected)
/// - Validates judge agent type is `Attestation` or `Both` (NotAttestationAgent parity)
/// - Validates all scores in range 1-10 (AttestationScoreOutOfRange parity)
/// - Records judge, consumer, scores, created_at
/// - `confirmed` initialised to 0 (Pending / `None` in Anchor)
///
/// Quasar deltas vs Anchor:
/// - `job_id: [u8; 16]` encoded as `u128` (LE) for PDA seed compatibility.
/// - `confirmed: u8` (sentinel) instead of `Option<bool>`.
/// - `judge_agent` derived from judge signer in seeds; read-only.
use {
    crate::state::{AgentAccount, AttestationAccount, AttestationAccountInner, AttestationStatus},
    quasar_lang::{
        prelude::*,
        sysvars::{clock::Clock, Sysvar as _},
    },
};

#[derive(Accounts)]
#[instruction(job_id: u128)]
pub struct Attest<'info> {
    /// Attestation PDA — `init` enforces one-per-job dedup.
    #[account(
        init,
        payer = judge,
        seeds = AttestationAccount::seeds(job_id),
        bump,
    )]
    pub attestation: &'info mut Account<AttestationAccount>,

    /// Judge's AgentAccount — must be Attestation or Both.
    /// Read-only; no mutation during attest.
    #[account(
        seeds = AgentAccount::seeds(judge),
        bump,
    )]
    pub judge_agent: &'info Account<AgentAccount>,

    pub judge: &'info mut Signer,

    pub system_program: &'info Program<System>,
}

impl<'info> Attest<'info> {
    #[inline(always)]
    pub fn attest(
        &mut self,
        job_id: u128,
        scores: [u8; 5],
        consumer: Address,
        bumps: &AttestBumps,
    ) -> Result<(), ProgramError> {
        // Guard: judge must be Attestation or Both
        if !self.judge_agent.is_attestation_eligible() {
            return Err(ProgramError::InvalidArgument); // NotAttestationAgent parity
        }

        // Guard: all scores must be in range 1-10
        for &s in scores.iter() {
            if !(1..=10).contains(&s) {
                return Err(ProgramError::InvalidArgument); // AttestationScoreOutOfRange parity
            }
        }

        let clock = Clock::get()?;
        let job_id_bytes = job_id.to_le_bytes();

        self.attestation.set_inner(AttestationAccountInner {
            job_id: job_id_bytes,
            judge: *self.judge.address(),
            consumer,
            scores,
            confirmed: AttestationStatus::Pending as u8,
            created_at: clock.unix_timestamp.get(),
            bump: bumps.attestation,
            _pad: [0u8; 7],
        });

        Ok(())
    }
}
