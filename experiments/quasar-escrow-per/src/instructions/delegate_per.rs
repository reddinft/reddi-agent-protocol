use {
    crate::{magicblock::layout as mb_layout, state::EscrowAccount},
    quasar_lang::{cpi::system as quasar_system, prelude::*},
};

/// Accounts required to run the docs-conformant MagicBlock PER delegation CPIs.
#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct DelegatePer<'info> {
    pub payer: &'info mut Signer,
    #[account(mut, seeds = EscrowAccount::seeds(payer, escrow_id), bump)]
    pub escrow: &'info mut Account<EscrowAccount>,
    /// CHECK: MagicBlock permission PDA for the escrow/permissioned account.
    pub permission: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock Permission Program.
    pub permission_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock Delegation Program.
    pub delegation_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock delegation owner program for the delegated escrow account.
    pub owner_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock delegate buffer for the permission PDA.
    pub permission_delegate_buffer: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation record for the permission PDA.
    pub permission_delegation_record: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation metadata for the permission PDA.
    pub permission_delegation_metadata: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegate buffer for the escrow PDA.
    pub escrow_delegate_buffer: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation record for the escrow PDA.
    pub escrow_delegation_record: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock delegation metadata for the escrow PDA.
    pub escrow_delegation_metadata: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock TEE validator identity.
    pub validator: &'info UncheckedAccount,
    pub system_program: &'info Program<System>,
}

impl<'info> DelegatePer<'info> {
    #[inline(always)]
    pub fn delegate_per(
        &mut self,
        escrow_id: u64,
        bumps: &DelegatePerBumps,
    ) -> Result<(), ProgramError> {
        if u64::from(self.escrow.escrow_id) != escrow_id {
            return Err(ProgramError::InvalidArgument);
        }

        let escrow_id_bytes = escrow_id.to_le_bytes();
        let bump = [bumps.escrow];
        let seeds = [
            Seed::from(&b"escrow"[..]),
            Seed::from(self.payer.address().as_ref()),
            Seed::from(&escrow_id_bytes),
            Seed::from(&bump),
        ];

        let mut create = DynCpiCall::<4, 9>::new(self.permission_program.address());
        create.push_account(self.escrow.to_account_view(), true, false)?;
        create.push_account(self.permission.to_account_view(), false, true)?;
        create.push_account(self.payer.to_account_view(), true, true)?;
        create.push_account(self.system_program.to_account_view(), false, false)?;
        create.set_data(&mb_layout::create_permission_data_members_none())?;
        create.invoke_signed(&seeds)?;

        let mut delegate_permission = DynCpiCall::<11, 8>::new(self.permission_program.address());
        delegate_permission.push_account(self.payer.to_account_view(), true, true)?;
        delegate_permission.push_account(self.payer.to_account_view(), true, true)?;
        delegate_permission.push_account(self.escrow.to_account_view(), true, true)?;
        delegate_permission.push_account(self.permission.to_account_view(), false, true)?;
        delegate_permission.push_account(self.system_program.to_account_view(), false, false)?;
        delegate_permission.push_account(
            self.permission_program.to_account_view(),
            false,
            false,
        )?;
        delegate_permission.push_account(
            self.permission_delegate_buffer.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.permission_delegation_record.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.permission_delegation_metadata.to_account_view(),
            false,
            true,
        )?;
        delegate_permission.push_account(
            self.delegation_program.to_account_view(),
            false,
            false,
        )?;
        delegate_permission.push_account(self.validator.to_account_view(), false, false)?;
        delegate_permission.set_data(&mb_layout::delegate_permission_data())?;
        delegate_permission.invoke_signed(&seeds)?;

        // MagicBlock's PDA delegation helper first copies state to the delegate
        // buffer (inside the Delegation CPI), then clears the delegated PDA before
        // ownership transfer. Solana only permits a program-owned account to leave
        // the current program when its data is zeroed.
        let mut escrow_view = self.escrow.to_account_view().clone();
        unsafe { escrow_view.borrow_unchecked_mut().fill(0) };
        unsafe { escrow_view.assign(self.system_program.address()) };
        quasar_system::assign(&escrow_view, self.delegation_program.address())
            .invoke_signed(&seeds)?;

        let validator = self.validator.address().to_bytes();
        let payer = self.payer.address().to_bytes();
        let mut delegate_escrow = DynCpiCall::<7, 107>::new(self.delegation_program.address());
        delegate_escrow.push_account(self.payer.to_account_view(), true, true)?;
        delegate_escrow.push_account(self.escrow.to_account_view(), true, true)?;
        delegate_escrow.push_account(self.owner_program.to_account_view(), false, false)?;
        delegate_escrow.push_account(self.escrow_delegate_buffer.to_account_view(), false, true)?;
        delegate_escrow.push_account(
            self.escrow_delegation_record.to_account_view(),
            false,
            true,
        )?;
        delegate_escrow.push_account(
            self.escrow_delegation_metadata.to_account_view(),
            false,
            true,
        )?;
        delegate_escrow.push_account(self.system_program.to_account_view(), false, false)?;
        delegate_escrow.set_data(&mb_layout::delegate_escrow_data(
            validator, payer, escrow_id,
        ))?;
        delegate_escrow.invoke_signed(&seeds)
    }
}
