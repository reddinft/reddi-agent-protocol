use {
    crate::{magicblock::layout as mb_layout, state::EscrowAccount},
    quasar_lang::prelude::*,
};

/// Accounts required to commit and undelegate MagicBlock PER permission state.
#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct CommitUndelegatePer<'info> {
    pub payer: &'info mut Signer,
    /// CHECK: Escrow PDA is delegated by this point, so its owner is MagicBlock's
    /// Delegation Program on base layer/TEE. Keep PDA seed validation but do not
    /// require this program to own/deserialise the account.
    #[account(mut, seeds = EscrowAccount::seeds(payer, escrow_id), bump)]
    pub escrow: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock permission PDA for the escrow/permissioned account.
    pub permission: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock Permission Program.
    pub permission_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock program used by commit+undelegate.
    pub magic_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock context account used by commit+undelegate.
    pub magic_context: &'info mut UncheckedAccount,
}

impl<'info> CommitUndelegatePer<'info> {
    #[inline(always)]
    pub fn commit_undelegate_per(
        &mut self,
        escrow_id: u64,
        bumps: &CommitUndelegatePerBumps,
    ) -> Result<(), ProgramError> {
        let escrow_id_bytes = escrow_id.to_le_bytes();
        let bump = [bumps.escrow];
        let seeds = [
            Seed::from(&b"escrow"[..]),
            Seed::from(self.payer.address().as_ref()),
            Seed::from(&escrow_id_bytes),
            Seed::from(&bump),
        ];

        let mut commit = DynCpiCall::<5, 8>::new(self.permission_program.address());
        commit.push_account(self.payer.to_account_view(), true, true)?;
        commit.push_account(self.escrow.to_account_view(), true, true)?;
        commit.push_account(self.permission.to_account_view(), false, true)?;
        commit.push_account(self.magic_program.to_account_view(), false, false)?;
        commit.push_account(self.magic_context.to_account_view(), false, true)?;
        commit.set_data(&mb_layout::commit_and_undelegate_permission_data())?;
        commit.invoke_signed(&seeds)
    }
}
