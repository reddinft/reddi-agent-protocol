//! MagicBlock PER manual CPI codec for the Quasar-native PER escrow path.
//!
//! Phase 2 pins byte layouts from `@magicblock-labs/ephemeral-rollups-sdk` so
//! later phases can build explicit Quasar CPI calls without Anchor macros.

pub mod constants;
pub mod cpi;
pub mod layout;
