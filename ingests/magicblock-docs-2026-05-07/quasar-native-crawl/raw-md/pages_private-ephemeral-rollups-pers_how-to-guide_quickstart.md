URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart.md
DEPTH: 0

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Enable privacy in any Solana program state account through MagicBlock's ER and Trusted Execution Environment on Intel TDX.

***

### Quick Access

Check out example:

<CardGroup cols={2}>
  <Card title="GitHub" icon="github" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/anchor-counter" iconType="duotone">
    Private Counter Anchor Implementation
  </Card>

  <Card title="Live Example App" icon="shield-check" href="https://counter-example.magicblock.app/?mode=private" iconType="duotone">
    Try the Private Counter
  </Card>
</CardGroup>

<Note>
  MagicBlock's Private Ephemeral Rollup enforces compliance based on node-level
  IP geofencing, OFAC-sanction list and restricted jurisdictions at ingress,
  before any transaction is accepted or executed. [Find out
  more](/pages/private-ephemeral-rollups-pers/introduction/compliance-framework)
</Note>

***

## Step-By-Step Guide

Build your program and upgrade it with permission and delegation hooks that utilize MagicBlock's Permission Program `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` and Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`:

<Steps>
  <Step title={<a href="#1-write-program">Write your program</a>}>
    Write your Solana program as you normally.
  </Step>

  <Step
    title={
  <a href="#2-delegate-with-restriction">
    Add delegation with restriction hooks in your program
  </a>
}
  >
    A single `delegate` instruction creates the permission account, delegates
    it, and then delegates the permissioned account to the TEE validator. A
    symmetric `undelegate` instruction releases both accounts atomically on the
    way back to the base layer. [See access control
    details](/pages/private-ephemeral-rollups-pers/how-to-guide/access-control).

    <Note>
      <p>
        These public validators are supported for development. Make sure to add the
        specific ER validator in your delegation instruction:
      </p>

      **Mainnet**

      <ul>
        <li>
          Asia (as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (mainnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Devnet**

      <ul>
        <li>
          Asia (devnet-as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (devnet-eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (devnet-us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (devnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Localnet**

      <ul>
        <li>
          Local ER (localhost:7799):{" "}
          <code>mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev</code>
        </li>
      </ul>
    </Note>
  </Step>

  <Step title={<a href="#3-deploy">Deploy your program on Solana</a>}>
    Deploy your Solana program using Anchor CLI.
  </Step>

  <Step title={<a href="#4-authorize">Implement authorization in your client</a>}>
    Sign user message to retrieve authorization token from TEE endpoint.
  </Step>

  <Step title={<a href="#5-test">Execute transactions and test privacy</a>}>
    Request for authorization token and send confidential transactions.
  </Step>
</Steps>

***

## Private Counter Example

The following software packages may be required, other versions may also be compatible:

| Software   | Version | Installation Guide                                              |
| ---------- | ------- | --------------------------------------------------------------- |
| **Solana** | 2.3.13  | [Install Solana](https://docs.anza.xyz/cli/install)             |
| **Rust**   | 1.85.0  | [Install Rust](https://www.rust-lang.org/tools/install)         |
| **Anchor** | 0.32.1  | [Install Anchor](https://www.anchor-lang.com/docs/installation) |
| **Node**   | 24.10.0 | [Install Node](https://nodejs.org/en/download/current)          |

<Note>
  The latest Permission Program requires SDK version
  [>=0.8.0](https://github.com/magicblock-labs/ephemeral-rollups-sdk). See
  [migration
  guide](https://github.com/magicblock-labs/ephemeral-rollups-sdk/pull/103) for
  details.
</Note>

### Code Snippets

<Tabs>
  <Tab title="1. Write program">
    A simple counter program with `initialize` and `increment` instructions, identical in shape to the public counter — privacy is added in the next steps:

    ```rust theme={null}
    #[ephemeral]
    #[program]
    pub mod private_counter {
        use super::*;

        /// Initialize the counter.
        pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
            let counter = &mut ctx.accounts.counter;
            counter.count = 0;
            Ok(())
        }

        /// Increment the counter.
        pub fn increment(ctx: Context<Increment>) -> Result<()> {
            let counter = &mut ctx.accounts.counter;
            counter.count += 1;
            Ok(())
        }

        /// ... Other instructions for delegation, permission, and privacy
    }

    pub const COUNTER_SEED: &[u8] = b"counter";

    /// Context for initializing counter
    #[derive(Accounts)]
    pub struct Initialize<'info> {
        #[account(init_if_needed, payer = user, space = 8 + 8, seeds = [COUNTER_SEED], bump)]
        pub counter: Account<'info, Counter>,
        #[account(mut)]
        pub user: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    /// Context for incrementing counter
    #[derive(Accounts)]
    pub struct Increment<'info> {
        #[account(mut, seeds = [COUNTER_SEED], bump)]
        pub counter: Account<'info, Counter>,
    }

    /// Counter struct
    #[account]
    pub struct Counter {
        pub count: u64,
    }

    /// Other context and accounts for delegation and privacy ...
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="2. Delegate with Restriction">
    Two symmetric instructions handle the full privacy lifecycle through MagicBlock's Permission Program `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` and Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`. `delegate` creates the permission account, delegates it, and then delegates the counter to the TEE validator — all in one CPI flow. `undelegate` mirrors the reverse: it commits and undelegates both the permission account and the counter atomically in a single ER transaction. See [access control](/pages/private-ephemeral-rollups-pers/how-to-guide/access-control) for the full lifecycle.

    <Note>
      <p>
        These public validators are supported for development. Make sure to add the
        specific ER validator in your delegation instruction:
      </p>

      **Mainnet**

      <ul>
        <li>
          Asia (as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (mainnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Devnet**

      <ul>
        <li>
          Asia (devnet-as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (devnet-eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (devnet-us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (devnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Localnet**

      <ul>
        <li>
          Local ER (localhost:7799):{" "}
          <code>mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev</code>
        </li>
      </ul>
    </Note>

    ```rust theme={null}
    use ephemeral_rollups_sdk::access_control::instructions::{
        CommitAndUndelegatePermissionCpiBuilder, CreatePermissionCpiBuilder,
        DelegatePermissionCpiBuilder,
    };
    use ephemeral_rollups_sdk::access_control::structs::{Member, MembersArgs, PERMISSION_SEED};
    use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
    use ephemeral_rollups_sdk::consts::PERMISSION_PROGRAM_ID;
    use ephemeral_rollups_sdk::cpi::DelegateConfig;
    use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;

    #[ephemeral] // Adds undelegation instruction for the ER validator
    #[program]
    pub mod private_counter {
        use super::*;

        /// Delegate the counter privately:
        /// 1. Create the permission account
        /// 2. Delegate the permission account
        /// 3. Delegate the counter itself
        pub fn delegate(
            ctx: Context<DelegateCounterPrivately>,
            members: Option<Vec<Member>>,
        ) -> Result<()> {
            let validator = ctx.accounts.validator.as_ref();

            // 1. Create the permission account (skip if it already exists).
            if ctx.accounts.permission.data_is_empty() {
                CreatePermissionCpiBuilder::new(&ctx.accounts.permission_program)
                    .permissioned_account(&ctx.accounts.counter.to_account_info())
                    .permission(&ctx.accounts.permission.to_account_info())
                    .payer(&ctx.accounts.payer.to_account_info())
                    .system_program(&ctx.accounts.system_program.to_account_info())
                    .args(MembersArgs { members })
                    .invoke_signed(&[&[COUNTER_SEED, &[ctx.bumps.counter]]])?;
            }

            // 2. Delegate the permission account (skip if already delegated).
            if ctx.accounts.permission.owner != &ephemeral_rollups_sdk::id() {
                DelegatePermissionCpiBuilder::new(&ctx.accounts.permission_program.to_account_info())
                    .permissioned_account(&ctx.accounts.counter.to_account_info(), true)
                    .permission(&ctx.accounts.permission.to_account_info())
                    .payer(&ctx.accounts.payer.to_account_info())
                    .authority(&ctx.accounts.counter.to_account_info(), false)
                    .system_program(&ctx.accounts.system_program.to_account_info())
                    .owner_program(&ctx.accounts.permission_program.to_account_info())
                    .delegation_buffer(&ctx.accounts.buffer_permission.to_account_info())
                    .delegation_metadata(&ctx.accounts.delegation_metadata_permission.to_account_info())
                    .delegation_record(&ctx.accounts.delegation_record_permission.to_account_info())
                    .delegation_program(&ctx.accounts.delegation_program.to_account_info())
                    .validator(validator)
                    .invoke_signed(&[&[COUNTER_SEED, &[ctx.bumps.counter]]])?;
            }

            // 3. Delegate the counter (skip if already delegated).
            if ctx.accounts.counter.owner != &ephemeral_rollups_sdk::id() {
                ctx.accounts.delegate_counter(
                    &ctx.accounts.payer,
                    &[COUNTER_SEED],
                    DelegateConfig {
                        validator: validator.map(|v| v.key()),
                        ..Default::default()
                    },
                )?;
            }
            Ok(())
        }

        /// Undelegate the counter privately:
        /// 1. Commit and undelegate the permission account via the Permission Program
        /// 2. Commit and undelegate the counter via the ephemeral rollups SDK
        ///
        /// Both intents are scheduled on `magic_context` in the same ER transaction
        /// and applied together when the transaction is sealed back to the base layer.
        pub fn undelegate(ctx: Context<UndelegateCounter>) -> Result<()> {
            // 1. Commit and undelegate the permission account
            CommitAndUndelegatePermissionCpiBuilder::new(
                &ctx.accounts.permission_program.to_account_info(),
            )
            .authority(&ctx.accounts.payer.to_account_info(), true)
            .permissioned_account(&ctx.accounts.counter.to_account_info(), true)
            .permission(&ctx.accounts.permission.to_account_info())
            .magic_context(&ctx.accounts.magic_context.to_account_info())
            .magic_program(&ctx.accounts.magic_program.to_account_info())
            .invoke_signed(&[&[COUNTER_SEED, &[ctx.bumps.counter]]])?;

            // 2. Commit and undelegate the counter
            MagicIntentBundleBuilder::new(
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.magic_context.to_account_info(),
                ctx.accounts.magic_program.to_account_info(),
            )
            .commit_and_undelegate(&[ctx.accounts.counter.to_account_info()])
            .build_and_invoke()?;
            Ok(())
        }
    }

    /// Delegate context for the counter and its permission account.
    #[delegate] // Enable delegation
    #[derive(Accounts)]
    pub struct DelegateCounterPrivately<'info> {
        pub payer: Signer<'info>,
        /// CHECK: The PDA to delegate
        #[account(mut, del, seeds = [COUNTER_SEED], bump)]
        pub counter: AccountInfo<'info>,
        /// CHECK: Permission account for the counter PDA
        #[account(
            mut,
            seeds = [PERMISSION_SEED, counter.key().as_ref()],
            bump,
            seeds::program = permission_program.key()
        )]
        pub permission: AccountInfo<'info>,
        /// CHECK: Buffer for permission delegation
        #[account(
            mut,
            seeds = [ephemeral_rollups_sdk::pda::DELEGATE_BUFFER_TAG, permission.key().as_ref()],
            bump,
            seeds::program = PERMISSION_PROGRAM_ID
        )]
        pub buffer_permission: AccountInfo<'info>,
        /// CHECK: Delegation record for permission
        #[account(
            mut,
            seeds = [ephemeral_rollups_sdk::pda::DELEGATION_RECORD_TAG, permission.key().as_ref()],
            bump,
            seeds::program = ephemeral_rollups_sdk::id()
        )]
        pub delegation_record_permission: AccountInfo<'info>,
        /// CHECK: Delegation metadata for permission
        #[account(
            mut,
            seeds = [ephemeral_rollups_sdk::pda::DELEGATION_METADATA_TAG, permission.key().as_ref()],
            bump,
            seeds::program = ephemeral_rollups_sdk::id()
        )]
        pub delegation_metadata_permission: AccountInfo<'info>,
        /// CHECK: Permission Program
        #[account(address = PERMISSION_PROGRAM_ID)]
        pub permission_program: AccountInfo<'info>,
        pub system_program: Program<'info, System>,
        /// CHECK: Checked by the delegate program
        pub validator: Option<AccountInfo<'info>>,
    }

    /// Undelegate context for the counter and its permission account.
    /// `#[commit]` injects `magic_context` and `magic_program`.
    #[commit]
    #[derive(Accounts)]
    pub struct UndelegateCounter<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        #[account(mut, seeds = [COUNTER_SEED], bump)]
        pub counter: Account<'info, Counter>,
        /// CHECK: Checked by the permission program
        #[account(
            mut,
            seeds = [PERMISSION_SEED, counter.key().as_ref()],
            bump,
            seeds::program = permission_program.key()
        )]
        pub permission: AccountInfo<'info>,
        /// CHECK: Permission Program
        #[account(address = PERMISSION_PROGRAM_ID)]
        pub permission_program: UncheckedAccount<'info>,
    }
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="3. Deploy">
    Now you’re program is upgraded and ready! Build and deploy to the desired cluster:

    ```bash theme={null}
      anchor build && anchor deploy
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="4. Authorize">
    Set up interaction with ER RPC in TEE:

    1. Verify integrity of TEE RPC via `https://pccs.phala.network/tdx/certification/v4`
    2. Request an authorization token for user to interact with TEE endpoint

    ```typescript Web3.js theme={null}
    import {
      verifyTeeRpcIntegrity,
      getAuthToken,
    } from "@magicblock-labs/ephemeral-rollups-sdk";

    // Verify the integrity of the TEE RPC
    const isVerified = await verifyTeeRpcIntegrity(EPHEMERAL_RPC_URL);

    // Get an auth token before making requests to the TEE
    const token = await getAuthToken(
      EPHEMERAL_RPC_URL,
      wallet.publicKey,
      (message: Uint8Array) =>
        Promise.resolve(nacl.sign.detached(message, wallet.secretKey)),
    );
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="5. Test">
    Test your program with the Private Ephemeral Rollup connection:

    `https://devnet-tee.magicblock.app?token=${token}`

    <Note>
      <p>
        These public validators are supported for development. Make sure to add the
        specific ER validator in your delegation instruction:
      </p>

      **Mainnet**

      <ul>
        <li>
          Asia (as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (mainnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Devnet**

      <ul>
        <li>
          Asia (devnet-as.magicblock.app):{" "}
          <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
        </li>

        <li>
          EU (devnet-eu.magicblock.app):{" "}
          <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
        </li>

        <li>
          US (devnet-us.magicblock.app):{" "}
          <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
        </li>

        <li>
          TEE (devnet-tee.magicblock.app):{" "}
          <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
        </li>
      </ul>

      **Localnet**

      <ul>
        <li>
          Local ER (localhost:7799):{" "}
          <code>mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev</code>
        </li>
      </ul>
    </Note>

    ### Quick Access

    Check out example:

    <CardGroup cols={2}>
      <Card title="GitHub" icon="github" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/anchor-counter" iconType="duotone">
        Private Counter Anchor Implementation
      </Card>

      <Card title="Live Example App" icon="shield-check" href="https://counter-example.magicblock.app/?mode=private" iconType="duotone">
        Try the Private Counter
      </Card>
    </CardGroup>

    [⬆️ Back to Top](#code-snippets)
  </Tab>
</Tabs>

***

<CardGroup cols={2}>
  <Card title="Access Control" icon="lock" href="/pages/private-ephemeral-rollups-pers/how-to-guide/access-control" iconType="duotone">
    Fine-grained Access Control
  </Card>

  <Card title="On-chain Privacy" icon="shield" href="/pages/private-ephemeral-rollups-pers/introduction/onchain-privacy" iconType="duotone">
    Privacy Mechanisms and Concepts
  </Card>

  <Card title="Authorization" icon="key" href="/pages/private-ephemeral-rollups-pers/introduction/authorization" iconType="duotone">
    Authorization Framework
  </Card>

  <Card title="Compliance Framework" icon="certificate" href="/pages/private-ephemeral-rollups-pers/introduction/compliance-framework" iconType="duotone">
    Compliance Standards and Guidelines
  </Card>
</CardGroup>

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

## Server Status

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
