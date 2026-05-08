use {
    crate::{
        magicblock::{constants as mb_constants, layout as mb_layout},
        state::AgentVault,
    },
    quasar_lang::prelude::*,
};

/// Accounts required to schedule Magic Program commit+undelegate with a post-undelegate callback.
#[derive(Accounts)]
pub struct CommitAgentVaultMagicIntentPer<'info> {
    /// Agent wallet that owns the vault authority and pays Magic Program scheduling costs.
    pub authority: &'info mut Signer,
    /// CHECK: AgentVault PDA is delegated by this point; PDA seed validation lets it sign the
    /// Magic Program schedule intent while avoiding program-owner deserialization.
    #[account(mut, seeds = AgentVault::seeds(authority), bump)]
    pub agent_vault: &'info mut UncheckedAccount,
    /// CHECK: MagicBlock program used by ScheduleIntentBundle.
    pub magic_program: &'info UncheckedAccount,
    /// CHECK: MagicBlock context account used by ScheduleIntentBundle.
    pub magic_context: &'info mut UncheckedAccount,
    pub system_program: &'info Program<System>,
}

impl<'info> CommitAgentVaultMagicIntentPer<'info> {
    #[inline(always)]
    pub fn commit_agent_vault_magic_intent_per(
        &mut self,
        bumps: &CommitAgentVaultMagicIntentPerBumps,
    ) -> Result<(), ProgramError> {
        if *self.magic_program.address() != mb_constants::MAGIC_PROGRAM_ID
            || *self.magic_context.address() != mb_constants::MAGIC_CONTEXT_ID
        {
            return Err(ProgramError::InvalidArgument);
        }

        let (undelegate_buffer, _) = Address::find_program_address(
            &[b"undelegate-buffer", self.agent_vault.address().as_ref()],
            &mb_constants::DELEGATION_PROGRAM_ID,
        );

        let data = mb_layout::schedule_agent_vault_commit_and_undelegate_with_callback_data(
            crate::ID.to_bytes(),
            self.agent_vault.address().to_bytes(),
            undelegate_buffer.to_bytes(),
            self.authority.address().to_bytes(),
            self.system_program.address().to_bytes(),
        );

        let bump = [bumps.agent_vault];
        let seeds = [
            Seed::from(&b"agent_vault"[..]),
            Seed::from(self.authority.address().as_ref()),
            Seed::from(&bump),
        ];

        let mut schedule = DynCpiCall::<3, 235>::new(self.magic_program.address());
        schedule.push_account(self.authority.to_account_view(), true, true)?;
        schedule.push_account(self.magic_context.to_account_view(), false, true)?;
        schedule.push_account(self.agent_vault.to_account_view(), true, true)?;
        schedule.set_data(&data)?;
        schedule.invoke_signed(&seeds)
    }
}
