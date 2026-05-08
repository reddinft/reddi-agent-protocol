use {
    crate::{
        events::AgentVaultCredited,
        state::{AgentVaultStatus, EscrowStatus},
    },
    quasar_lang::{pda::based_try_find_program_address, prelude::*},
};

const ESCROW_DISCRIMINATOR: u8 = 10;
const AGENT_VAULT_DISCRIMINATOR: u8 = 11;

const ESCROW_PAYER_OFFSET: usize = 1;
const ESCROW_PAYEE_OFFSET: usize = ESCROW_PAYER_OFFSET + 32;
const ESCROW_ID_OFFSET: usize = ESCROW_PAYEE_OFFSET + 32;
const ESCROW_AMOUNT_OFFSET: usize = ESCROW_ID_OFFSET + 8;
const ESCROW_STATUS_OFFSET: usize = ESCROW_AMOUNT_OFFSET + 8;
const MIN_ESCROW_LEN: usize = ESCROW_STATUS_OFFSET + 1;
const ESCROW_RENT_LAMPORTS_FOR_99_BYTES: u64 = 1_579_920;

const INTENT_DISCRIMINATOR: u8 = 12;
const INTENT_PAYER_OFFSET: usize = 1;
const INTENT_ESCROW_OFFSET: usize = INTENT_PAYER_OFFSET + 32;
const INTENT_AUTHORITY_OFFSET: usize = INTENT_ESCROW_OFFSET + 32;
const INTENT_VAULT_OFFSET: usize = INTENT_AUTHORITY_OFFSET + 32;
const INTENT_ESCROW_ID_OFFSET: usize = INTENT_VAULT_OFFSET + 32;
const INTENT_AMOUNT_OFFSET: usize = INTENT_ESCROW_ID_OFFSET + 8;
const MIN_INTENT_LEN: usize = INTENT_AMOUNT_OFFSET + 8;

const VAULT_AUTHORITY_OFFSET: usize = 1;
const VAULT_BALANCE_OFFSET: usize = VAULT_AUTHORITY_OFFSET + 32;
const VAULT_LIFETIME_CREDITED_OFFSET: usize = VAULT_BALANCE_OFFSET + 8;
const VAULT_LIFETIME_WITHDRAWN_OFFSET: usize = VAULT_LIFETIME_CREDITED_OFFSET + 8;
const VAULT_STATUS_OFFSET: usize = VAULT_LIFETIME_WITHDRAWN_OFFSET + 8;
const VAULT_BUMP_OFFSET: usize = VAULT_STATUS_OFFSET + 1;
const MIN_VAULT_LEN: usize = VAULT_BUMP_OFFSET + 1;

/// PER/TEE-safe escrow release into an agent vault.
///
/// MagicBlock delegation zeroes the base-layer mirror before handing execution to
/// the ephemeral runtime. The normal `Account<T>` deserializers are therefore too
/// strict for private execution. This instruction keeps PDA seed checks and then
/// validates/writes account bytes manually, mirroring `release`'s delegated-state
/// fallback while targeting the self-custodied agent vault instead of an arbitrary
/// wallet account.
#[derive(Accounts)]
#[instruction(_escrow_id: u64)]
pub struct PrivateTakeToAgentVault<'info> {
    /// Original payer authorizes the release.
    pub payer: &'info mut Signer,
    /// Agent wallet / vault authority. Used for vault PDA validation.
    /// CHECK: authority may be any wallet; withdraw later requires signer.
    pub authority: &'info UncheckedAccount,
    /// CHECK: delegated PER mirrors may be zeroed, so validate bytes manually.
    pub escrow: &'info mut UncheckedAccount,
    /// CHECK: delegated PER mirrors may be zeroed, so validate/write bytes manually.
    pub vault: &'info mut UncheckedAccount,
    /// Program-owned escrow -> vault binding prepared before delegation.
    /// CHECK: bytes are validated manually.
    pub intent: &'info UncheckedAccount,
}

impl<'info> PrivateTakeToAgentVault<'info> {
    #[inline(always)]
    pub fn private_take_to_agent_vault(
        &mut self,
        escrow_id: u64,
        _bumps: &PrivateTakeToAgentVaultBumps,
    ) -> Result<(), ProgramError> {
        let mut escrow_view = self.escrow.to_account_view().clone();
        let mut vault_view = self.vault.to_account_view().clone();
        let authority = self.authority.address();
        let vault_bump = self.validate_pdas(escrow_id, authority)?;

        let intended_amount = self.validate_intent(escrow_id, authority)?;

        let (amount, write_escrow_status) = {
            let data = unsafe { escrow_view.borrow_unchecked_mut() };
            if data.len() < MIN_ESCROW_LEN {
                return Err(ProgramError::InvalidAccountData);
            }

            if data[0] == ESCROW_DISCRIMINATOR {
                if &data[ESCROW_PAYER_OFFSET..ESCROW_PAYEE_OFFSET] != self.payer.address().as_ref()
                    || &data[ESCROW_PAYEE_OFFSET..ESCROW_ID_OFFSET] != authority.as_ref()
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                let stored_escrow_id = u64::from_le_bytes(
                    data[ESCROW_ID_OFFSET..ESCROW_AMOUNT_OFFSET]
                        .try_into()
                        .map_err(|_| ProgramError::InvalidAccountData)?,
                );
                if stored_escrow_id != escrow_id {
                    return Err(ProgramError::InvalidArgument);
                }
                if data[ESCROW_STATUS_OFFSET] != EscrowStatus::Locked as u8 {
                    return Err(ProgramError::InvalidAccountData);
                }
                (
                    u64::from_le_bytes(
                        data[ESCROW_AMOUNT_OFFSET..ESCROW_STATUS_OFFSET]
                            .try_into()
                            .map_err(|_| ProgramError::InvalidAccountData)?,
                    ),
                    true,
                )
            } else if data.iter().all(|b| *b == 0) {
                let delegated_amount = escrow_view
                    .lamports()
                    .checked_sub(ESCROW_RENT_LAMPORTS_FOR_99_BYTES)
                    .ok_or(ProgramError::InvalidAccountData)?;
                if delegated_amount != intended_amount {
                    return Err(ProgramError::InvalidAccountData);
                }
                (intended_amount, false)
            } else {
                return Err(ProgramError::InvalidAccountData);
            }
        };
        if amount != intended_amount {
            return Err(ProgramError::InvalidAccountData);
        }

        {
            let data = unsafe { vault_view.borrow_unchecked_mut() };
            if data.len() < MIN_VAULT_LEN {
                return Err(ProgramError::InvalidAccountData);
            }

            if data[0] == AGENT_VAULT_DISCRIMINATOR {
                if &data[VAULT_AUTHORITY_OFFSET..VAULT_BALANCE_OFFSET] != authority.as_ref()
                    || data[VAULT_STATUS_OFFSET] != AgentVaultStatus::Active as u8
                {
                    return Err(ProgramError::InvalidAccountData);
                }
                add_u64(data, VAULT_BALANCE_OFFSET, amount)?;
                add_u64(data, VAULT_LIFETIME_CREDITED_OFFSET, amount)?;
            } else if data.iter().all(|b| *b == 0) {
                data[0] = AGENT_VAULT_DISCRIMINATOR;
                data[VAULT_AUTHORITY_OFFSET..VAULT_BALANCE_OFFSET]
                    .copy_from_slice(authority.as_ref());
                data[VAULT_BALANCE_OFFSET..VAULT_LIFETIME_CREDITED_OFFSET]
                    .copy_from_slice(&amount.to_le_bytes());
                data[VAULT_LIFETIME_CREDITED_OFFSET..VAULT_LIFETIME_WITHDRAWN_OFFSET]
                    .copy_from_slice(&amount.to_le_bytes());
                data[VAULT_LIFETIME_WITHDRAWN_OFFSET..VAULT_STATUS_OFFSET]
                    .copy_from_slice(&0u64.to_le_bytes());
                data[VAULT_STATUS_OFFSET] = AgentVaultStatus::Active as u8;
                data[VAULT_BUMP_OFFSET] = vault_bump;
            } else {
                return Err(ProgramError::InvalidAccountData);
            }
        }

        let new_escrow_lamports = escrow_view
            .lamports()
            .checked_sub(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        let new_vault_lamports = vault_view
            .lamports()
            .checked_add(amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        set_lamports(&escrow_view, new_escrow_lamports);
        set_lamports(&vault_view, new_vault_lamports);

        if write_escrow_status {
            let data = unsafe { escrow_view.borrow_unchecked_mut() };
            data[ESCROW_STATUS_OFFSET] = EscrowStatus::Released as u8;
        }

        emit!(AgentVaultCredited {
            escrow: *self.escrow.address(),
            vault: *self.vault.address(),
            authority: *authority,
            amount,
        });

        Ok(())
    }

    #[inline(always)]
    fn validate_pdas(&self, escrow_id: u64, authority: &Address) -> Result<u8, ProgramError> {
        let escrow_id_bytes = escrow_id.to_le_bytes();
        let (expected_escrow, _) = based_try_find_program_address(
            &[b"escrow", self.payer.address().as_ref(), &escrow_id_bytes],
            &crate::ID,
        )?;
        let (expected_vault, vault_bump) =
            based_try_find_program_address(&[b"agent_vault", authority.as_ref()], &crate::ID)?;
        if expected_escrow != *self.escrow.address() || expected_vault != *self.vault.address() {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(vault_bump)
    }

    #[inline(always)]
    fn validate_intent(&self, escrow_id: u64, authority: &Address) -> Result<u64, ProgramError> {
        if *self.intent.to_account_view().owner() != crate::ID {
            return Err(ProgramError::InvalidAccountData);
        }
        let mut intent_view = self.intent.to_account_view().clone();
        let data = unsafe { intent_view.borrow_unchecked_mut() };
        if data.len() < MIN_INTENT_LEN
            || data[0] != INTENT_DISCRIMINATOR
            || &data[INTENT_PAYER_OFFSET..INTENT_ESCROW_OFFSET] != self.payer.address().as_ref()
            || &data[INTENT_ESCROW_OFFSET..INTENT_AUTHORITY_OFFSET]
                != self.escrow.address().as_ref()
            || &data[INTENT_AUTHORITY_OFFSET..INTENT_VAULT_OFFSET] != authority.as_ref()
            || &data[INTENT_VAULT_OFFSET..INTENT_ESCROW_ID_OFFSET] != self.vault.address().as_ref()
            || u64::from_le_bytes(
                data[INTENT_ESCROW_ID_OFFSET..INTENT_AMOUNT_OFFSET]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidAccountData)?,
            ) != escrow_id
        {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(u64::from_le_bytes(
            data[INTENT_AMOUNT_OFFSET..MIN_INTENT_LEN]
                .try_into()
                .map_err(|_| ProgramError::InvalidAccountData)?,
        ))
    }
}

#[inline(always)]
fn add_u64(data: &mut [u8], offset: usize, amount: u64) -> Result<(), ProgramError> {
    let end = offset + 8;
    let current = u64::from_le_bytes(
        data[offset..end]
            .try_into()
            .map_err(|_| ProgramError::InvalidAccountData)?,
    );
    let updated = current
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    data[offset..end].copy_from_slice(&updated.to_le_bytes());
    Ok(())
}
