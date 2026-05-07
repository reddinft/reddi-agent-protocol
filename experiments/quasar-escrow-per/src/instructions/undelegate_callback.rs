use quasar_lang::prelude::*;

/// MagicBlock undelegation callback account context.
///
/// Phase 1 intentionally keeps this context minimal so the PER-specific Quasar
/// program can prove ABI compatibility with MagicBlock's exact callback
/// discriminator before we add Permission/Delegation CPI semantics.
#[derive(Accounts)]
pub struct UndelegateCallback<'info> {
    /// CHECK: Later phases validate this as the delegated escrow PDA and wire
    /// MagicBlock commit/undelegation semantics. Phase 1 only needs a concrete
    /// account context so Quasar can compile the exact callback discriminator.
    pub escrow: &'info mut UncheckedAccount,
}
