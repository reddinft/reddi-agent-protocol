/// commit_rating — Quasar parity port of Anchor `commit_rating_handler`.
///
/// Parity with Anchor version:
/// - Creates or reuses `RatingAccount` PDA seeded by `[b"rating", job_id]`
/// - On first commit: records both party pubkeys, initialises metadata, starts clock
/// - Validates signer matches the role (consumer or specialist)
/// - Guards against duplicate commits (AlreadyCommitted)
/// - Guards against commits to finalized ratings (AlreadyFinalised)
/// - Advances state to `BothCommitted` when both commitments are set
///
/// Quasar deltas vs Anchor:
/// - `job_id: [u8; 16]` encoded as `u128` (LE) for PDA seed compatibility.
///   The seed bytes are identical; only the encoding in the instruction arg changes.
/// - `init_if_needed` supported natively in Quasar; first-call detection via `created_slot == 0`.
/// - `RatingRole` passed as `u8` (0=Consumer, 1=Specialist) instead of enum.
/// - `consumer_pk` / `specialist_pk` passed as `Address` instead of `Pubkey`.
use {
    crate::state::{RatingAccount, RatingAccountInner, RatingState},
    quasar_lang::{
        prelude::*,
        sysvars::{clock::Clock, Sysvar as _},
    },
};

#[derive(Accounts)]
#[instruction(job_id: u128)]
pub struct Commit<'info> {
    /// Rating PDA — created on first call, reused on second.
    #[account(
        init_if_needed,
        payer = signer,
        seeds = RatingAccount::seeds(job_id),
        bump,
    )]
    pub rating: &'info mut Account<RatingAccount>,

    pub signer: &'info mut Signer,

    pub system_program: &'info Program<System>,
}

impl<'info> Commit<'info> {
    #[inline(always)]
    pub fn commit(
        &mut self,
        job_id: u128,
        commitment: [u8; 32],
        role: u8,       // 0 = Consumer, 1 = Specialist
        consumer_pk: Address,
        specialist_pk: Address,
        bumps: &CommitBumps,
    ) -> Result<(), ProgramError> {
        let signer_addr = *self.signer.address();
        let clock = Clock::get()?;

        // Guard: reject role values other than 0/1
        if role > 1 {
            return Err(ProgramError::InvalidArgument);
        }

        // Guard: zero commitment is the uncommitted sentinel in RatingAccount.
        // Accepting it lets a user believe they committed while expiry logic
        // still treats them as absent.
        if commitment == [0u8; 32] {
            return Err(ProgramError::InvalidArgument);
        }

        // Guard: reject if already finalised (Revealed or Expired)
        let current_state = self.rating.rating_state();
        if current_state == RatingState::Revealed || current_state == RatingState::Expired {
            return Err(ProgramError::InvalidArgument); // AlreadyFinalised
        }

        // On first commit: initialise metadata and record both party pubkeys.
        // Detection: consumer == Address::default() (all-zero bytes) means account was
        // just allocated by init_if_needed and not yet initialised. Real pubkeys are
        // never all-zeros (that would be the system program zero address).
        // Note: we cannot use created_slot == 0 because the default QuasarSVM clock
        // starts at slot 0, so that sentinel is ambiguous.
        let zero_addr = Address::new_from_array([0u8; 32]);
        if self.rating.consumer == zero_addr {
            let job_id_bytes = job_id.to_le_bytes();
            self.rating.set_inner(RatingAccountInner {
                job_id: job_id_bytes,
                consumer: consumer_pk,
                specialist: specialist_pk,
                consumer_commitment: [0u8; 32],
                specialist_commitment: [0u8; 32],
                consumer_score: 0,
                specialist_score: 0,
                state: RatingState::Pending as u8,
                _pad: 0,
                created_at: clock.unix_timestamp.get(),
                created_slot: clock.slot.get(),
                bump: bumps.rating,
                _pad2: [0u8; 7],
            });
        }

        // Apply the commitment for the given role
        match role {
            // Consumer
            0 => {
                if signer_addr != self.rating.consumer {
                    return Err(ProgramError::InvalidArgument); // UnauthorisedSigner
                }
                if self.rating.consumer_committed() {
                    return Err(ProgramError::InvalidArgument); // AlreadyCommitted
                }
                self.rating.consumer_commitment = commitment; // [u8;32] stays as-is
            }
            // Specialist
            1 => {
                if signer_addr != self.rating.specialist {
                    return Err(ProgramError::InvalidArgument); // UnauthorisedSigner
                }
                if self.rating.specialist_committed() {
                    return Err(ProgramError::InvalidArgument); // AlreadyCommitted
                }
                self.rating.specialist_commitment = commitment; // [u8;32] stays as-is
            }
            _ => unreachable!(),
        }

        // Advance to BothCommitted when both commitments are set
        if self.rating.consumer_committed() && self.rating.specialist_committed() {
            self.rating.state = RatingState::BothCommitted as u8;
        }

        Ok(())
    }
}
