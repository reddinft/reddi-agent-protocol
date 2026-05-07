URL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart
FETCHED_AS: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart.md
FINAL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/quickstart.md
DEPTH: 0

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Any Solana program can be upgraded with Ephemeral Rollups by adding delegation capabilities.

***

### Quick Access

Check out basic counter example:

<CardGroup cols={2}>
  <Card title="GitHub" icon="anchor" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/anchor-counter" iconType="duotone">
    Anchor Implementation
  </Card>

  <Card title="GitHub" icon="react" href="https://github.com/GabrielePicco/ephemeral-counter-ui" iconType="duotone">
    React Implementation
  </Card>
</CardGroup>

***

<div
  style={{
position: "relative",
paddingBottom: "56.25%",
height: 0,
overflow: "hidden",
}}
>
  <iframe
    src="https://www.youtube.com/embed/qwu2RBKyFiw?si=PMg-3UbRfvvbrs7C&list=PLWR_ZQiGMS8mIe1kPZe8OfHIbhvZqaM8V"
    title="Build a real-time Anchor Counter on Solana with MagicBlock's Ephemeral Rollup | Tutorial"
    style={{
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
}}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
  />
</div>

***

## Step-By-Step Guide

Build your program and upgrade it with delegation hooks with MagicBlock's Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`:

<Steps>
  <Step title={<a href="#1-write-program">Write your program</a>}>
    Write your Solana program as you normally would.
  </Step>

  <Step
    title={
  <a href="#2-delegate">
    Add delegation and undelegation hooks in your program
  </a>
}
  >
    Add CPI hooks to delegate, commit and undelegate state accounts through
    Ephemeral Rollup sessions.

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

  <Step title={<a href="#3-deploy">Deploy your program on Solana.</a>}>
    Deploy your program directly on Solana using Anchor or Solana CLI.
  </Step>

  <Step
    title={
  <a href="#4-test">
    Ready to execute transactions for delegation and real-time speed
  </a>
}
  >
    Send transactions without modifications on-chain and off-chain that also
    comply with the SVM RPC specification.
  </Step>
</Steps>

***

## Counter Example

<img
  src="https://mintcdn.com/magicblock-42/iteauKFqxDKE2Vln/images/gifs/counter-420w.gif?s=f6feee67754b5b0b90c94ad159d4e630"
  alt="Counter GIF"
  style={{
width: "100%",
maxWidth: "420px",
height: "auto",
objectFit: "contain",
borderRadius: "8px",
}}
  width="420"
  height="420"
  data-path="images/gifs/counter-420w.gif"
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
    The program implements two main instructions:

    1. `initialize`: Sets the counter to 0
    2. `increment`: Increments the counter by 1

    The program implements specific instructions for delegating and undelegating the counter:

    1. `Delegate`: Delegates counter from Base Layer to ER (called on Base Layer)
    2. `CommitAndUndelegate`: Schedules sync of counter from ER to Base Layer, and undelegates counter on ER (called on ER)
    3. `Commit`: Schedules sync of counter from ER to Base Layer (called on ER)
    4. `Undelegate`:
       * Schedules sync and undelegation of counter (called on ER)
       * Undelegation triggered through callback instruction injected through #\[ephemeral] (called on Base Layer through validator CPI)

    <Note>
      The undelegation callback discriminator `[196, 28, 41, 206, 48, 37, 51, 167]`
      and its instruction processor must be specified in your program. This
      instruction triggered by Delegation Program reverts account ownership on the
      Base Layer after calling undelegation on ER.

      With [`[#ephemeral]`](/pages/ephemeral-rollups-ers/how-to-guide/quickstart#1-write-program) Anchor macro from MagicBlock's Ephemeral Rollup SDK, the undelegation callback discriminator and processor are injected into your program.
    </Note>

    ```rust theme={null}
    #[ephemeral]
    #[program]
    pub mod public_counter {
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

        /// Delegate the account to the delegation program
        /// Set specific validator based on ER, see https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup
        pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        // ...
        }

        /// Manually commit the counter state in the Ephemeral Rollup session.
        pub fn commit(ctx: Context<IncrementAndCommit>) -> Result<()> {
        // ...
        }

        /// Increment the counter and commit in the same instruction.
        pub fn increment_and_commit(ctx: Context<IncrementAndCommit>) -> Result<()> {
        // ...
        }

        /// Undelegate the account from the delegation program.
        pub fn undelegate(ctx: Context<IncrementAndCommit>) -> Result<()> {
        // ...
        }
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

    /// Other context for delegation
    ```

    Nothing special here, just a simple Anchor program that increments a counter. The only difference is that we're adding the `ephemeral` macro for undelegation and `delegate` macro to inject some useful logic to interact with the delegation program.

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="2. Delegate">
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

    1. Add `ephemeral-rollups-sdk` with Anchor features to your program

    ```bash theme={null}
    cargo add ephemeral-rollups-sdk --features anchor
    ```

    Import `delegate`, `commit`, `ephemeral`, `DelegateConfig`, and `MagicIntentBundleBuilder` (which replaces the deprecated `commit_accounts` and `commit_and_undelegate_accounts` helpers):

    ```rust theme={null}
    use ephemeral_rollups_sdk::anchor::{
      commit,
      delegate,
      ephemeral
    };
    use ephemeral_rollups_sdk::cpi::DelegateConfig;
    use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;
    ```

    2. Add `delegate` macro and instruction, `ephemeral` macro, and `undelegate` instruction to your program. Specify your preferred delegation config such as auto commits and specific ER validator:

    ```rust theme={null}
    /// Add delegate function to the context
    #[delegate]
    #[derive(Accounts)]
    pub struct DelegateInput<'info> {
        pub payer: Signer<'info>,
        /// CHECK: The pda to delegate
        #[account(mut, del)]
        pub pda: AccountInfo<'info>,
    }
    ```

    ```rust theme={null}
    /// Delegate the account to the delegation program
    /// Set specific validator based on ER, see https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[COUNTER_SEED],
            DelegateConfig {
                // Optionally set a specific validator from the first remaining account
                validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
                ..Default::default()
            },
        )?;
        Ok(())
    }
    ```

    ```rust theme={null}
    use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;

    /// Manually commit the counter state in the Ephemeral Rollup session.
    pub fn commit(ctx: Context<IncrementAndCommit>) -> Result<()> {
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit(&[ctx.accounts.counter.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }

    /// Increment the counter and commit the new state in the same instruction.
    pub fn increment_and_commit(ctx: Context<IncrementAndCommit>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count += 1;
        // Serialize the Anchor account before the CPI sees it
        counter.exit(&crate::ID)?;
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit(&[ctx.accounts.counter.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
    ```

    ```rust theme={null}
    use ephemeral_rollups_sdk::ephem::MagicIntentBundleBuilder;

    /// Undelegate the account from the delegation program.
    /// Commits the latest state and returns ownership of the PDA back to the owner program.
    pub fn undelegate(ctx: Context<IncrementAndCommit>) -> Result<()> {
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit_and_undelegate(&[ctx.accounts.counter.to_account_info()])
        .build_and_invoke()?;
        Ok(())
    }
    ```

    > `Delegation` is the process of transferring ownership of one or more of your program's `PDAs` to the delegation program. Ephemeral Validators will then be able to use the `PDAs` to perform transactions in the SVM runtime.

    > `Commit` is the process of updating the state of the `PDAs` from ER to the base layer. After the finalization process, the `PDAs` remain locked on base layer.

    > `Undelegation` is the process of transferring ownership of the `PDAs` back to your program. On undelegation, the state is committed and it trigger the finalization process. Once state it validated, the `PDAs` are unlocked and can be used as normal on base layer.

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
    Ready to execute transactions for delegation and real-time speed.

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

    ```bash theme={null}
    anchor test --skip-build --skip-deploy --skip-local-validator
    ```

    Run the following test:

    ```typescript theme={null}
    const COUNTER_SEED = "counter";

    // Set Anchor providers
    const provider = new anchor.AnchorProvider(
      new anchor.web3.Connection(
        process.env.PROVIDER_ENDPOINT || "https://api.devnet.solana.com",
        {
          wsEndpoint: process.env.PROVIDER_WS_ENDPOINT || undefined,
          commitment: "confirmed",
        },
      ),
      anchor.Wallet.local(),
    );
    anchor.setProvider(provider);

    const providerEphemeralRollup = new anchor.AnchorProvider(
      new anchor.web3.Connection(
        process.env.EPHEMERAL_PROVIDER_ENDPOINT ||
          "https://devnet-as.magicblock.app/",
        {
          wsEndpoint:
            process.env.EPHEMERAL_WS_ENDPOINT || "wss://devnet-as.magicblock.app/",
          commitment: "confirmed",
        },
      ),
      anchor.Wallet.local(),
    );

    // Set program and PDA
    const program = anchor.workspace.PublicCounter as Program<PublicCounter>;
    const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from(COUNTER_SEED)],
      program.programId,
    );

    // Initialize counter on base layer
    let initTx = await program.methods
      .initialize()
      .accounts({
        user: provider.wallet.publicKey,
      })
      .transaction();
    const initTxHash = await provider.sendAndConfirm(initTx, [
      provider.wallet.payer,
    ]);

    // Increment counter on base layer
    let incBaseTx = await program.methods
      .increment()
      .accounts({
        counter: counterPDA,
      })
      .transaction();
    const incBaseTxHash = await provider.sendAndConfirm(incBaseTx, [
      provider.wallet.payer,
    ]);

    // Delegate counter to ER
    // Pin a specific validator by passing it in remaining_accounts
    const ER_VALIDATOR = new anchor.web3.PublicKey(
      "MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57", // Asia ER validator
    );
    let delTx = await program.methods
      .delegate()
      .accounts({
        payer: provider.wallet.publicKey,
        pda: counterPDA,
      })
      .remainingAccounts([
        { pubkey: ER_VALIDATOR, isSigner: false, isWritable: false },
      ])
      .transaction();
    const delTxHash = await provider.sendAndConfirm(delTx, [
      provider.wallet.payer,
    ]);

    // Increment counter in real time on ER
    let incErTx = await program.methods
      .increment()
      .accounts({
        counter: counterPDA,
      })
      .transaction();
    incErTx.feePayer = providerEphemeralRollup.wallet.publicKey;
    incErTx.recentBlockhash = (
      await providerEphemeralRollup.connection.getLatestBlockhash()
    ).blockhash;
    incErTx = await providerEphemeralRollup.wallet.signTransaction(incErTx);
    const incErTxHash = await providerEphemeralRollup.sendAndConfirm(incErTx);

    // Commit and undelegate counter from ER back to base layer
    let undelTx = await program.methods
      .undelegate()
      .accounts({
        payer: providerEphemeralRollup.wallet.publicKey,
      })
      .transaction();
    undelTx.feePayer = providerEphemeralRollup.wallet.publicKey;
    undelTx.recentBlockhash = (
      await providerEphemeralRollup.connection.getLatestBlockhash()
    ).blockhash;
    undelTx = await providerEphemeralRollup.wallet.signTransaction(undelTx);
    const undelTxHash = await providerEphemeralRollup.sendAndConfirm(undelTx);
    ```

    To make it easier to integrate via the frontend, we created the [Magic Router](/pages/ephemeral-rollups-ers/introduction/magic-router). You send transactions directly to the magic router, and we can determine for you whether it should be routed to the [Ephemeral Rollup](/pages/ephemeral-rollups-ers/introduction/ephemeral-rollup) or base layer.

    <Note>
      These public RPC endpoints are currently free and supported for development:
      <br /> Magic Router Devnet: [https://devnet-router.magicblock.app](https://devnet-router.magicblock.app) <br />
      Solana Devnet: [https://api.devnet.solana.com](https://api.devnet.solana.com) <br />
      ER Devnet: [https://devnet.magicblock.app](https://devnet.magicblock.app) <br />
      TEE Devnet: [https://devnet-tee.magicblock.app/](https://devnet-tee.magicblock.app/) <br />
      Find out more details{" "}
      <a href="/pages/ephemeral-rollups-ers/how-to-guide/local-development">here</a>
      .
    </Note>

    [⬆️ Back to Top](#code-snippets)
  </Tab>
</Tabs>

***

### Advanced Code Snippets

<Tabs>
  <Tab title="Resize PDA">
    When resizing a delegated PDA:

    * PDA must have enough lamports to remain rent-exempt for the new account size.
    * If additional lamports are needed, the **payer account must be delegated** to provide the difference.
    * PDA must be owned by the program, and the transaction must include any signer(s) required for transferring lamports.
    * Use `system_instruction::allocate`

    ```rust theme={null}
    #[account]
    pub struct Counter {
        pub count: u64,
        pub extra_data: Vec<u8>,
    }

    #[derive(Accounts)]
    pub struct ResizeCounter<'info> {
        #[account(mut)]
        pub counter: Account<'info, Counter>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

        // Resize the counter (e.g., to store more extra_data)
        pub fn resize_counter(ctx: Context<ResizeCounter>, new_size: usize) -> Result<()> {
            let account_to_resize = &mut ctx.accounts.counter.to_account_info();
            let payer = &mut ctx.accounts.payer.to_account_info();

            // Calculate rent-exemption for the new size
            let rent = Rent::get()?;
            let min_balance = rent.minimum_balance(new_size);

            // Top up lamports if needed
            let current_lamports = **account_to_resize.lamports.borrow();
            if current_lamports < min_balance {
                let to_transfer = min_balance - current_lamports;
                **payer.try_borrow_mut_lamports()? -= to_transfer;
                **account_to_resize.try_borrow_mut_lamports()? += to_transfer;
            }

            // Resize account
            account_to_resize.resize(new_size)?;

            Ok(())
        }
    ```

    [⬆️ Back to Top](#advanced-code-snippets)
  </Tab>

  <Tab title="Magic Router">
    Initialize connection with Magic Router before you send transactions dynamically.

    <Note>
      These public RPC endpoints are currently free and supported for development:
      <br /> Magic Router Devnet: [https://devnet-router.magicblock.app](https://devnet-router.magicblock.app) <br />
    </Note>

    Choose your preferred SDK to initialize, send and confirm transactions:

    * `ephemeral-rollups-kit` for `@solana/kit`
    * `ephemeral-rollups-sdk` for `@solana/web.js`

    <CodeGroup>
      ```typescript Kit theme={null}
      import { Connection } from "@magicblock-labs/ephemeral-rollups-kit";

      // Initialize connection
      const connection = await Connection.create(
        "https://devnet-router.magicblock.app",
        "wss://devnet-router.magicblock.app"
      );

      // ... create transaction

      // Send and confirm transaction
      const txHash = await connection.sendAndConfirmTransaction(
        transactionMessage,
        [userKeypair],
        { commitment: "confirmed", skipPreflight: true }
      );
      ```

      ```typescript Web3.js theme={null}
      import { sendAndConfirmTransaction } from "@solana/web3.js";
      import { ConnectionMagicRouter } from "@magicblock-labs/ephemeral-rollups-sdk";

      // Initialize connection
      const connection = new ConnectionMagicRouter(
        "https://devnet-router.magicblock.app/",
        { wsEndpoint: "wss://devnet-router.magicblock.app/" }
      );

      // ... create transaction

      // Send and confirm transaction
      const txHash = await sendAndConfirmTransaction(connection, tx, [payer], {
        skipPreflight: true,
        commitment: "confirmed",
      });
      ```
    </CodeGroup>

    [⬆️ Back to Top](#advanced-code-snippets)
  </Tab>

  <Tab title="Magic Action">
    ### Quick Access

    <CardGroup cols={2}>
      <Card title="Magic Actions Example" icon="code" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/magic-actions" iconType="duotone">
        Explore reference implementation on GitHub
      </Card>
    </CardGroup>

    Attach one or more instructions that run automatically on the Solana base layer immediately after an Ephemeral Rollup
    (ER) commit.
    [Learn more about Magic Action](/pages/ephemeral-rollups-ers/magic-actions/overview.mdx)

    ### 1) Create action instruction

    The instruction `update_leaderboard` runs on the base layer immediately after the commit lands. The `#[action]` attribute on its accounts context marks it as callable from a post-commit action.

    ```rust theme={null}
    // program instruction
    pub fn update_leaderboard(ctx: Context<UpdateLeaderboard>) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        let counter_info = &mut ctx.accounts.counter.to_account_info();
        let mut data: &[u8] = &counter_info.try_borrow_data()?;
        let counter = Counter::try_deserialize(&mut data)?;

        if counter.count > leaderboard.high_score {
            leaderboard.high_score = counter.count;
        }

        msg!(
            "Leaderboard updated! High score: {}",
            leaderboard.high_score
        );
        Ok(())
    }

    // instruction context
    #[action]
    #[derive(Accounts)]
    pub struct UpdateLeaderboard<'info> {
        #[account(mut, seeds = [LEADERBOARD_SEED], bump)]
        pub leaderboard: Account<'info, Leaderboard>,
        /// CHECK: PDA owner depends on: 1) Delegated: Delegation Program; 2) Undelegated: Your program ID
        pub counter: UncheckedAccount<'info>,
    }
    ```

    ### 2) Build the commit instruction with the action

    The commit instruction `commit_and_update_leaderboard` runs on the ER. It uses `MagicIntentBundleBuilder` to schedule both the commit and the post-commit action onto `magic_context` — both are applied together when the ER transaction is sealed back to the base layer.

    ```rust theme={null}
    // commit action instruction on ER
    pub fn commit_and_update_leaderboard(ctx: Context<CommitAndUpdateLeaderboard>) -> Result<()> {
        // Build the post-commit action that updates the leaderboard on base layer
        let instruction_data =
            anchor_lang::InstructionData::data(&crate::instruction::UpdateLeaderboard {});
        let action_args = ActionArgs::new(instruction_data);
        let action_accounts = vec![
            ShortAccountMeta {
                pubkey: ctx.accounts.leaderboard.key(),
                is_writable: true,
            },
            ShortAccountMeta {
                pubkey: ctx.accounts.counter.key(),
                is_writable: false,
            },
        ];
        let action = CallHandler {
            destination_program: crate::ID,
            accounts: action_accounts,
            args: action_args,
            // Signer that pays transaction fees for the action from its escrow PDA
            escrow_authority: ctx.accounts.payer.to_account_info(),
            compute_units: 200_000,
        };

        // Schedule commit + post-commit action on magic_context
        MagicIntentBundleBuilder::new(
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.magic_context.to_account_info(),
            ctx.accounts.magic_program.to_account_info(),
        )
        .commit(&[ctx.accounts.counter.to_account_info()])
        .add_post_commit_actions([action])
        .build_and_invoke()?;

        Ok(())
    }

    // commit action context on ER
    #[commit]
    #[derive(Accounts)]
    pub struct CommitAndUpdateLeaderboard<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,

        #[account(mut, seeds = [COUNTER_SEED], bump)]
        pub counter: Account<'info, Counter>,

        /// CHECK: Leaderboard PDA - not mut here, writable set in handler
        #[account(seeds = [LEADERBOARD_SEED], bump)]
        pub leaderboard: UncheckedAccount<'info>,

        /// CHECK: Your program ID
        pub program_id: AccountInfo<'info>,
    }
    ```

    ### Execute multiple actions

    You can commit multiple accounts and chain several actions in one call. Actions execute sequentially in the order they're passed to `add_post_commit_actions`.

    ```rust theme={null}
    // Chain several actions — they execute sequentially on base layer after the commit lands.
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit(&[
        ctx.accounts.counter.to_account_info(),
        // ... additional committed accounts
    ])
    .add_post_commit_actions([action_1, action_2, action_3])
    .build_and_invoke()?;
    ```

    ### Undelegate with actions

    Actions can also be chained onto an undelegation — the counter commits, undelegates, and the actions run, all atomically in one ER transaction.

    ```rust theme={null}
    // Commit, undelegate, AND execute actions — all atomically on base layer after the ER transaction seals.
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit_and_undelegate(&[ctx.accounts.counter.to_account_info()])
    .add_post_commit_actions([action])
    .build_and_invoke()?;
    ```

    [⬆️ Back to Top](#advanced-code-snippets)
  </Tab>

  <Tab title="Top-up delegated account">
    Top up a delegated account's lamports on the ER side. The transaction is submitted on the **base layer** and uses the Ephemeral SPL Token program to shuttle lamports to the destination's delegated balance via a single-use lamports PDA.

    Common use case: keeping a delegated fee payer funded so it can keep paying its own commits past the default 10-commit sponsorship cap.

    Notes:

    * Generate a fresh 32-byte salt per top-up via `crypto.getRandomValues` — re-using a salt collides with an existing PDA.
    * Submit to the base-layer RPC, not the ER.
    * The destination must already be delegated.

    ```typescript theme={null}
    import {
      Connection,
      Keypair,
      PublicKey,
      Transaction,
      sendAndConfirmTransaction,
    } from "@solana/web3.js";
    import {
      lamportsDelegatedTransferIx,
      deriveLamportsPda,
    } from "@magicblock-labs/ephemeral-rollups-sdk";

    /**
     * Top up a delegated account with lamports.
     *
     * The transaction is submitted on the BASE LAYER. The Ephemeral SPL Token
     * program creates a single-use lamports PDA, funds it from the payer, and
     * delegates it so the ER credits the destination's delegated balance.
     */
    async function topUpDelegatedAccount(
      connection: Connection,         // base-layer connection
      payer: Keypair,
      destination: PublicKey,         // delegated account to top up
      amountLamports: bigint,
    ) {
      // Generate a fresh 32-byte salt per top-up.
      // Re-using a salt collides with an existing lamports PDA and the call fails.
      const salt = crypto.getRandomValues(new Uint8Array(32));

      const [lamportsPda] = deriveLamportsPda(payer.publicKey, destination, salt);

      const ix = await lamportsDelegatedTransferIx(
        payer.publicKey,
        destination,
        amountLamports,
        salt,
      );

      const tx = new Transaction().add(ix);
      tx.feePayer = payer.publicKey;

      // CRITICAL: send to the base-layer RPC, not the ER.
      const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
        commitment: "confirmed",
        skipPreflight: true,
      });

      return { sig, lamportsPda };
    }
    ```

    [⬆️ Back to Top](#advanced-code-snippets)
  </Tab>

  <Tab title="On-Curve Delegation">
    ### Quick Access

    <CardGroup cols={2}>
      <Card title="GitHub" icon="wallet" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/oncurve-delegation" iconType="duotone">
        On-Curve Delegation
      </Card>
    </CardGroup>

    Required signers for delegating an on-curve account:

    1. On-curve account to be delegated
    2. Fee payer

    Required instructions for delegating on-curve accounts:

    1. Assign System Account to Delegation Program
    2. Delegate to Delegation Program

    <CodeGroup>
      ```typescript Kit theme={null}
      // Create assign instruction
      // The on-curve account must sign this instruction to change its owner
      const accountSigner = await cryptoKeyPairToTransactionSigner(userKeypair);
      const delegationProgramAddress = address(DELEGATION_PROGRAM_ID.toString());
      const assignInstruction = getAssignInstruction({
        account: accountSigner,
        programAddress: delegationProgramAddress,
      });

      // Create delegate instruction
      const delegateInstruction = await createDelegateInstruction({
        payer: feePayerAddress,
        delegatedAccount: userAddress,
        ownerProgram: ownerProgramAddress,
        validator: validatorAddress,
      });

      // Prepare transaction
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(feePayerAddress, tx),
        (tx) =>
          appendTransactionMessageInstructions(
            [assignInstruction, delegateInstruction],
            tx
          )
      );
      // Send and confirm transaction (fee payer need to sign, on-curve account cannot be signer since delegated)
      const txHash = await connection.sendAndConfirmTransaction(
        transactionMessage,
        [userKeypair, feePayerKeypair],
        { commitment: "confirmed", skipPreflight: true }
      );
      ```

      ```typescript Web3.js theme={null}
      // Create assign instruction
      const assignInstruction = SystemProgram.assign({
        accountPubkey: userPubkey,
        programId: DELEGATION_PROGRAM_ID,
      });

      // Create delegate instruction
      const delegateInstruction = createDelegateInstruction({
        payer: feePayerKeypair.publicKey,
        delegatedAccount: userPubkey,
        ownerProgram: ownerProgram,
        validator: validator,
      });

      // Create and send transaction (fee payer need to sign, on-curve account cannot be signer since delegated)
      const tx = new Transaction().add(assignInstruction, delegateInstruction);
      tx.feePayer = feePayerKeypair.publicKey;
      const txSignature = await sendAndConfirmTransaction(
        connectionBaseLayer,
        tx,
        [userKeypair, feePayerKeypair],
        {
          skipPreflight: true,
        }
      );
      ```
    </CodeGroup>

    Direct commit and undelegate through Magic Program only.

    <CodeGroup>
      ```typescript Kit theme={null}
      // Create commit and undelegate instruction
      const commitAndUndelegateInstruction = createCommitAndUndelegateInstruction(
        userAddress,
        [userAddress]
      );

      // Prepare transaction
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(feePayerAddress, tx),
        (tx) =>
          appendTransactionMessageInstructions([commitAndUndelegateInstruction], tx)
      );

      // Send and confirm transaction on ephemeral connection
      const txHash = await ephemeralConnection.sendAndConfirmTransaction(
        transactionMessage,
        [userKeypair, feePayerKeypair],
        { commitment: "confirmed", skipPreflight: true }
      );
      ```

      ```typescript Web3.js theme={null}
      // Create commit and undelegate instruction
      const commitAndUndelegateInstruction = createCommitAndUndelegateInstruction(
        userPubkey,
        [userPubkey]
      );

      // Send and confirm transaction on ephemeral connection
      const tx = new Transaction().add(commitAndUndelegateInstruction);
      tx.feePayer = feePayerKeypair.publicKey;
      const txSignature = await sendAndConfirmTransaction(
        ephemeralConnection,
        tx,
        [userKeypair, feePayerKeypair],
        {
          skipPreflight: true,
        }
      );
      ```
    </CodeGroup>

    [⬆️ Back to Top](#advanced-code-snippets)
  </Tab>
</Tabs>

***

### Quick Access

Learn more about private ER, Rust Native implementation, and local development:

<CardGroup>
  <Card title="Private Ephemeral Rollups (PER)" icon="anchor" href="/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart" iconType="duotone">
    Quickstart
  </Card>

  <Card title="Rust Native" icon="rust" href="/pages/ephemeral-rollups-ers/how-to-guide/rust-program" iconType="duotone">
    Quickstart
  </Card>

  <Card title="Guide" icon="computer" href="/pages/ephemeral-rollups-ers/how-to-guide/local-development" iconType="duotone">
    Local Development
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
