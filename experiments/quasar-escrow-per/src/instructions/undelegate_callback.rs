use {
    crate::magicblock::constants as mb_constants,
    quasar_lang::{cpi::system as quasar_system, prelude::*},
};

const AGENT_VAULT_RENT_EXEMPT_LAMPORTS: u64 = 1_301_520;

/// MagicBlock undelegation callback account context.
///
/// MagicBlock invokes this on the base layer after commit. Account order mirrors
/// their Rust docs for undelegation callbacks:
/// 0. delegated PDA
/// 1. undelegation/delegation buffer containing the restored account bytes
/// 2. MagicBlock-provided initializer/validator
/// 3. system program
///
/// MagicBlock's patched base transaction supplies its own initializer/validator
/// in account slot 2. The agent-vault authority is therefore read from the
/// committed buffer bytes, then used to restore the vault PDA with signer seeds.
#[derive(Accounts)]
pub struct UndelegateCallback<'info> {
    /// CHECK: AgentVault PDA is expected to be System-owned during MagicBlock's
    /// base-layer undelegation callback, so we seed-check but cannot deserialize
    /// it as `Account<AgentVault>` until after owner restoration.
    #[account(mut)]
    pub agent_vault: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock-owned buffer with the committed account bytes. Magic
    /// Program `ShortAccountMeta` cannot request arbitrary signers for base
    /// actions/callbacks, so we verify the deterministic MagicBlock buffer PDA
    /// instead of relying on an external signer bit.
    pub delegation_buffer: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock-provided initializer/validator. Used only as the payer
    /// for the SDK-shaped System Program restore path.
    pub initializer: &'info mut UncheckedAccount,
    /// CHECK: System program is forwarded by MagicBlock's callback account list.
    pub system_program: &'info UncheckedAccount,
}

impl<'info> UndelegateCallback<'info> {
    #[inline(always)]
    pub fn undelegate_callback(
        &mut self,
        _bumps: &UndelegateCallbackBumps,
    ) -> Result<(), ProgramError> {
        if *self.system_program.address() != quasar_system::SYSTEM_PROGRAM_ID {
            return Err(ProgramError::InvalidArgument);
        }

        let buffer_view = self.delegation_buffer.to_account_view();
        if *buffer_view.owner() != mb_constants::DELEGATION_PROGRAM_ID {
            return Err(ProgramError::InvalidAccountOwner);
        }
        let (expected_undelegate_buffer, _) = Address::find_program_address(
            &[b"undelegate-buffer", self.agent_vault.address().as_ref()],
            &mb_constants::DELEGATION_PROGRAM_ID,
        );
        if *self.delegation_buffer.address() != expected_undelegate_buffer {
            return Err(ProgramError::InvalidArgument);
        }

        let mut authority = [0u8; 32];
        let buffer_len;
        {
            let buffer_data = unsafe { buffer_view.borrow_unchecked() };
            if buffer_data.len() < 59 || buffer_data[0] != 11 {
                return Err(ProgramError::InvalidAccountData);
            }
            let mut i = 0usize;
            while i < 32 {
                authority[i] = buffer_data[1 + i];
                i += 1;
            }
            buffer_len = buffer_data.len();
        }

        let (expected_vault, vault_bump) =
            Address::find_program_address(&[b"agent_vault", &authority], &crate::ID);
        if expected_vault != *self.agent_vault.address() {
            return Err(ProgramError::InvalidArgument);
        }

        let bump = [vault_bump];
        let seeds = [
            Seed::from(&b"agent_vault"[..]),
            Seed::from(&authority),
            Seed::from(&bump),
        ];
        let mut vault_view = self.agent_vault.to_account_view().clone();
        if vault_view.lamports() == 0 {
            if buffer_len != 59 {
                return Err(ProgramError::InvalidAccountData);
            }
            quasar_system::transfer(
                &self.initializer.to_account_view(),
                &vault_view,
                AGENT_VAULT_RENT_EXEMPT_LAMPORTS,
            )
            .invoke()?;
            quasar_system::allocate(&vault_view, buffer_len as u64).invoke_signed(&seeds)?;
            quasar_system::assign(&vault_view, &crate::ID).invoke_signed(&seeds)?;
        } else if vault_view.data_len() != buffer_len {
            if vault_view.data_len() != 0 {
                return Err(ProgramError::InvalidAccountData);
            }
            quasar_system::allocate(&vault_view, buffer_len as u64).invoke_signed(&seeds)?;
            quasar_system::assign(&vault_view, &crate::ID).invoke_signed(&seeds)?;
        } else if *vault_view.owner() != crate::ID {
            quasar_system::assign(&vault_view, &crate::ID).invoke_signed(&seeds)?;
        }

        let buffer_data = unsafe { buffer_view.borrow_unchecked() };
        let vault_data = unsafe { vault_view.borrow_unchecked_mut() };
        vault_data.copy_from_slice(buffer_data);
        Ok(())
    }
}
