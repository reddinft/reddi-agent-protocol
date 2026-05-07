URL: https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/how-to-guide/quickstart
FETCHED_AS: https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/how-to-guide/quickstart.md
FINAL: https://docs.magicblock.gg/pages/verifiable-randomness-functions-vrfs/how-to-guide/quickstart.md
DEPTH: 0

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to request and consume verifiable randomness onchain using the MagicBlock VRF SDK on Solana.

***

### Quick Access

Check out basic randomness example:

<CardGroup cols={2}>
  <Card title="GitHub" icon="github" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/roll-dice" iconType="duotone">
    Repo for roll dice example
  </Card>

  <Card title="VRF dApp" icon="dice" href="https://roll-dice.magicblock.app/" iconType="duotone">
    Roll a dice onchain
  </Card>

  <Card title="Delegated VRF dApp" icon="bolt" href="https://er-roll-dice.magicblock.app/delegated" iconType="duotone">
    Roll a dice within 100 ms onchain
  </Card>
</CardGroup>

***

<Note>
  Want to run VRF end to end on your machine? Use the <a href="/pages/get-started/how-integrate-your-program/local-setup">Local Validator Setup</a> guide for the fully local stack, the Surfpool alternative, and the local <code>vrf-oracle</code> flow.
</Note>

***

## Step-By-Step Guide

Any Solana program can request and consume verifiable randomness onchain within seconds using the MagicBlock VRF SDK. By the end of this guide, you'll have a working example that rolls a dice using verifiable randomness.

<Steps>
  <Step title={<a href="#1-write-program">Write your program</a>}>
    Write your Solana program as you normally.
  </Step>

  <Step
    title={
  <a href="#2-request-%26-consume-randomnness">
    Add request and consume randomness instructions.
  </a>
}
  >
    Add CPI hooks that request and consume randomness via callback from a
    verified oracle.
  </Step>

  <Step title={<a href="#3-deploy">Deploy your program on Solana</a>}>
    Deploy your Solana program using Anchor CLI.
  </Step>

  <Step title={<a href="#4-test">Execute transactions for onchain randomness.</a>}>
    Send transactions to generate and consume randomness onchain.
  </Step>
</Steps>

***

## Roll Dice Example

<img
  src="https://mintcdn.com/magicblock-42/iteauKFqxDKE2Vln/images/gifs/vrf-roll-dice-420w.gif?s=9250f6e10d1a713f3c3d02f990f3a1b4"
  alt="Roll Dice GIF"
  style={{
width: "100%",
maxWidth: "420px",
height: "auto",
objectFit: "contain",
borderRadius: "8px",
}}
  width="420"
  height="420"
  data-path="images/gifs/vrf-roll-dice-420w.gif"
/>

The following software packages may be required, other versions may also be compatible:

| Software   | Version | Installation Guide                                              |
| ---------- | ------- | --------------------------------------------------------------- |
| **Solana** | 2.3.13  | [Install Solana](https://docs.anza.xyz/cli/install)             |
| **Rust**   | 1.85.0  | [Install Rust](https://www.rust-lang.org/tools/install)         |
| **Anchor** | 0.32.1  | [Install Anchor](https://www.anchor-lang.com/docs/installation) |
| **Node**   | 24.10.0 | [Install Node](https://nodejs.org/en/download/current)          |

### Code Snippets

<Tabs>
  <Tab title="1. Write program">
    A simple roll dice program where player initialize state account to store, request and consume randomness:

    ```rust theme={null}
    pub const PLAYER: &[u8] = b"playerd";

    #[program]
    pub mod random_dice {
        use super::*;

        pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
            msg!(
                "Initializing player account: {:?}",
                ctx.accounts.player.key()
            );
            Ok(())
        }

        // ... Additional instructions will be added here
    }

    /// Context for initializing player
    #[derive(Accounts)]
    pub struct Initialize<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        #[account(init_if_needed, payer = payer, space = 8 + 1, seeds = [PLAYER, payer.key().to_bytes().as_slice()], bump)]
        pub player: Account<'info, Player>,
        pub system_program: Program<'info, System>,
    }

    /// Player struct
    #[account]
    pub struct Player {
        pub last_result: u8,
    }
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="2. Request & Consume Randomnness">
    1. Add `ephemeral_vrf_sdk` with Anchor features to your program

    ```bash theme={null}
    cargo add ephemeral_vrf_sdk --features anchor
    ```

    Import `vrf` , `create_request_randomness_ix`, `RequestRandomnessParams`, and `SerializableAccountMeta`:

    ```rust theme={null}
    use ephemeral_vrf_sdk::anchor::vrf;
    use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
    use ephemeral_vrf_sdk::types::SerializableAccountMeta;
    ```

    2. Add instructions `roll_dice` to request randomness and `callback_roll_dice` to consume randomness, along with its context:

    ```rust theme={null}
    #[program]
    pub mod random_dice {
        use super::*;

        // ... `initialize` instruction

        // Request Randomness
        pub fn roll_dice(ctx: Context<DoRollDiceCtx>, client_seed: u8) -> Result<()> {
            msg!("Requesting randomness...");
            let ix = create_request_randomness_ix(RequestRandomnessParams {
                payer: ctx.accounts.payer.key(),
                oracle_queue: ctx.accounts.oracle_queue.key(),
                callback_program_id: ID,
                callback_discriminator: instruction::CallbackRollDice::DISCRIMINATOR.to_vec(),
                caller_seed: [client_seed; 32],
                // Specify any account that is required by the callback
                accounts_metas: Some(vec![SerializableAccountMeta {
                    pubkey: ctx.accounts.player.key(),
                    is_signer: false,
                    is_writable: true,
                }]),
                ..Default::default()
            });
            ctx.accounts
                .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
            Ok(())
        }

        // Consume Randomness
        pub fn callback_roll_dice(
            ctx: Context<CallbackRollDiceCtx>,
            randomness: [u8; 32],
        ) -> Result<()> {
            let rnd_u8 = ephemeral_vrf_sdk::rnd::random_u8_with_range(&randomness, 1, 6);
            msg!("Consuming random number: {:?}", rnd_u8);
            let player = &mut ctx.accounts.player;
            player.last_result = rnd_u8; // Update the player's last result
            Ok(())
        }
    }

    #[vrf]
    #[derive(Accounts)]
    pub struct DoRollDiceCtx<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        #[account(seeds = [PLAYER, payer.key().to_bytes().as_slice()], bump)]
        pub player: Account<'info, Player>,
        /// CHECK: The oracle queue
        #[account(mut, address = ephemeral_vrf_sdk::consts::DEFAULT_QUEUE)]
        pub oracle_queue: AccountInfo<'info>,
    }

    #[derive(Accounts)]
    pub struct CallbackRollDiceCtx<'info> {
        /// This check ensure that the vrf_program_identity (which is a PDA) is a singer
        /// enforcing the callback is executed by the VRF program trough CPI
        #[account(address = ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY)]
        pub vrf_program_identity: Signer<'info>,
        #[account(mut)]
        pub player: Account<'info, Player>,
    }

    // ... Other context and account struct.
    ```

    > `Request Randomness` is the process of generating a random `hashId` with the relevant callback instruction for the verified oracles to be triggered.

    > `Consume Randomness` is the process of using the verifiable randomness by your program which is provided and triggered through verified oracle.

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="3. Deploy">
    Now you’re program is upgraded and ready! Build and deploy to the desired
    cluster:

    ```bash theme={null}
    anchor build && anchor deploy
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="4. Test">
    Ready to execute transactions for onchain randomness!

    ```bash theme={null}
    anchor test --skip-build --skip-deploy --skip-local-validator
    ```

    Run the following test:

    ```typescript theme={null}
    import * as anchor from "@coral-xyz/anchor";
    import { Program, web3 } from "@coral-xyz/anchor";
    import { RandomDice } from "../target/types/random_dice";

    describe("roll-dice", () => {
      // Configure the client to use the local cluster.
      anchor.setProvider(anchor.AnchorProvider.env());

      const program = anchor.workspace.RandomDice as Program<RandomDice>;

      it("Initialized player!", async () => {
        const tx = await program.methods.initialize().rpc();
        console.log("Your transaction signature", tx);
      });

      it("Do Roll Dice!", async () => {
        const tx = await program.methods.rollDice(0).rpc();
        console.log("Your transaction signature", tx);
        const playerPk = web3.PublicKey.findProgramAddressSync(
          [Buffer.from("playerd"), anchor.getProvider().publicKey.toBytes()],
          program.programId
        )[0];
        let player = await program.account.player.fetch(playerPk, "processed");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log("Player PDA: ", playerPk.toBase58());
        console.log("player: ", player);
      });
    });
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>
</Tabs>

***

## Solana Explorer

Get insights about your transactions and accounts on Solana:

<CardGroup cols={2}>
  <Card title="Solana Explorer" icon="search" href="https://explorer.solana.com/" iconType="duotone">
    Official Solana Explorer
  </Card>

  <Card title="Solscan" icon="searchengin" href="https://solscan.io/" iconType="duotone">
    Explore Solana Blockchain
  </Card>
</CardGroup>

## Solana RPC Providers

Send transactions and requests through existing RPC providers:

<CardGroup cols={2}>
  <Card title="Solana" icon="star" href="https://solana.com/docs/references/clusters#on-a-high-level" iconType="duotone">
    Free Public Nodes
  </Card>

  <Card title="Helius" icon="sun" href="https://www.helius.dev/solana-rpc-nodes" iconType="duotone">
    Free Shared Nodes
  </Card>

  <Card title="Triton" icon="crystal-ball" href="https://triton.one/solana" iconType="duotone">
    Dedicated High-Performance Nodes
  </Card>
</CardGroup>

## Solana Validator Dashboard

Find real-time updates on Solana's validator infrastructure:

<CardGroup cols={2}>
  <Card title="Solana Beach" icon="wave" href="https://solanabeach.io/" iconType="duotone">
    Get Validator Insights
  </Card>

  <Card title="Validators App" icon="cloud-binary" href="https://www.validators.app/" iconType="duotone">
    Discover Validator Metrics
  </Card>
</CardGroup>

## Server Status Subscriptions

Subscribe to Solana's and MagicBlock's server status:

<CardGroup cols={2}>
  <Card title="Solana Status" icon="server" href="https://status.solana.com/" iconType="duotone">
    Subscribe to Solana Server Updates
  </Card>

  <Card title="MagicBlock Status" icon="heart-pulse" href="/pages/overview/additional-information/system-status" iconType="duotone">
    Subscribe to MagicBlock Server Status
  </Card>
</CardGroup>

***

## MagicBlock Products

<CardGroup cols={2}>
  <Card title="Ephemeral Rollup (ER)" icon="bolt" href="/pages/ephemeral-rollups-ers/how-to-guide/quickstart" iconType="duotone">
    Execute real-time, zero-fee transactions securely on Solana.
  </Card>

  <Card title="Private Ephemeral Rollup (PER)" icon="shield-check" href="/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart" iconType="duotone">
    Protect sensitive data with compliance — built on top of Ephemeral Rollups.
  </Card>

  <Card title="Private Payment API" icon="bag-shopping-plus" href="/pages/private-ephemeral-rollups-pers/api-reference/per/introduction" iconType="duotone">
    Add private onchain transfers to your app in seconds — compliant by default.
  </Card>

  <Card title="Verifiable Randomness Function (VRF)" icon="dice" href="/pages/verifiable-randomness-functions-vrfs/how-to-guide/quickstart" iconType="duotone">
    Add provably fair onchain randomness within a second — for free.
  </Card>

  <Card title="Pricing Oracle" icon="waveform" href="/pages/tools/oracle/introduction" iconType="duotone">
    Access low-latency onchain price feeds for trading and DeFi.
  </Card>
</CardGroup>

***
