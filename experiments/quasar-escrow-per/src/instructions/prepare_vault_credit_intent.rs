use {
    crate::state::{AgentVault, EscrowAccount, EscrowStatus},
    quasar_lang::prelude::*,
};

const INTENT_DISCRIMINATOR: u8 = 12;
const INTENT_PAYER_OFFSET: usize = 1;
const INTENT_ESCROW_OFFSET: usize = INTENT_PAYER_OFFSET + 32;
const INTENT_AUTHORITY_OFFSET: usize = INTENT_ESCROW_OFFSET + 32;
const INTENT_VAULT_OFFSET: usize = INTENT_AUTHORITY_OFFSET + 32;
const INTENT_ESCROW_ID_OFFSET: usize = INTENT_VAULT_OFFSET + 32;
const INTENT_AMOUNT_OFFSET: usize = INTENT_ESCROW_ID_OFFSET + 8;
const MIN_INTENT_LEN: usize = INTENT_AMOUNT_OFFSET + 8;

/// Prepare an escrow -> agent-vault binding for PER private credit.
///
/// The intent account is a program-owned scratch account created by the client
/// before this instruction. Because only this program can write program-owned
/// account data, the private TEE instruction can later trust this binding even
/// after MagicBlock zeroes the delegated escrow/vault mirrors.
#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct PrepareVaultCreditIntent<'info> {
    pub payer: &'info mut Signer,
    #[account(seeds = EscrowAccount::seeds(payer, escrow_id), bump)]
    pub escrow: &'info Account<EscrowAccount>,
    /// CHECK: authority may be any wallet; vault PDA below binds it.
    pub authority: &'info UncheckedAccount,
    #[account(seeds = AgentVault::seeds(authority), bump)]
    pub vault: &'info Account<AgentVault>,
    /// CHECK: program-owned scratch account; bytes are validated/written manually.
    pub intent: &'info mut UncheckedAccount,
}

impl<'info> PrepareVaultCreditIntent<'info> {
    #[inline(always)]
    pub fn prepare_vault_credit_intent(&mut self, escrow_id: u64) -> Result<(), ProgramError> {
        if u64::from(self.escrow.escrow_id) != escrow_id
            || self.escrow.payer != *self.payer.address()
            || self.escrow.payee != *self.authority.address()
            || self.escrow.status != EscrowStatus::Locked as u8
            || self.vault.authority != *self.authority.address()
            || !self.vault.is_active()
            || *self.intent.to_account_view().owner() != crate::ID
        {
            return Err(ProgramError::InvalidAccountData);
        }

        let amount = u64::from(self.escrow.amount);
        let mut intent_view = self.intent.to_account_view().clone();
        let data = unsafe { intent_view.borrow_unchecked_mut() };
        if data.len() < MIN_INTENT_LEN {
            return Err(ProgramError::InvalidAccountData);
        }
        if data[0] == 0 && data.iter().all(|b| *b == 0) {
            data[0] = INTENT_DISCRIMINATOR;
            data[INTENT_PAYER_OFFSET..INTENT_ESCROW_OFFSET]
                .copy_from_slice(self.payer.address().as_ref());
            data[INTENT_ESCROW_OFFSET..INTENT_AUTHORITY_OFFSET]
                .copy_from_slice(self.escrow.address().as_ref());
            data[INTENT_AUTHORITY_OFFSET..INTENT_VAULT_OFFSET]
                .copy_from_slice(self.authority.address().as_ref());
            data[INTENT_VAULT_OFFSET..INTENT_ESCROW_ID_OFFSET]
                .copy_from_slice(self.vault.address().as_ref());
            data[INTENT_ESCROW_ID_OFFSET..INTENT_AMOUNT_OFFSET]
                .copy_from_slice(&escrow_id.to_le_bytes());
            data[INTENT_AMOUNT_OFFSET..MIN_INTENT_LEN].copy_from_slice(&amount.to_le_bytes());
        } else if data[0] != INTENT_DISCRIMINATOR
            || &data[INTENT_PAYER_OFFSET..INTENT_ESCROW_OFFSET] != self.payer.address().as_ref()
            || &data[INTENT_ESCROW_OFFSET..INTENT_AUTHORITY_OFFSET]
                != self.escrow.address().as_ref()
            || &data[INTENT_AUTHORITY_OFFSET..INTENT_VAULT_OFFSET]
                != self.authority.address().as_ref()
            || &data[INTENT_VAULT_OFFSET..INTENT_ESCROW_ID_OFFSET] != self.vault.address().as_ref()
            || u64::from_le_bytes(
                data[INTENT_ESCROW_ID_OFFSET..INTENT_AMOUNT_OFFSET]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidAccountData)?,
            ) != escrow_id
            || u64::from_le_bytes(
                data[INTENT_AMOUNT_OFFSET..MIN_INTENT_LEN]
                    .try_into()
                    .map_err(|_| ProgramError::InvalidAccountData)?,
            ) != amount
        {
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(())
    }
}
