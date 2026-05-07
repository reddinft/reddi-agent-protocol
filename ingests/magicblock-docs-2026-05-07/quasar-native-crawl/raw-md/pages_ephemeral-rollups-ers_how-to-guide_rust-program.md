URL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/rust-program
FETCHED_AS: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/rust-program.md
FINAL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/how-to-guide/rust-program.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Solana Program

> Learn how to write a simple Rust program that delegates and increments a counter on Solana

***

### Quick Access

Check out basic counter example in other implementations:

<CardGroup cols={2}>
  <Card title="GitHub" icon="rust" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/rust-counter" iconType="duotone">
    Native Rust Implementation
  </Card>

  <Card title="GitHub" icon="face-lying" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/pinocchio-counter" iconType="duotone">
    Pinocchio Implementation
  </Card>

  <Card title="Guide" icon="computer" href="/pages/ephemeral-rollups-ers/how-to-guide/local-development" iconType="duotone">
    Local Development
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
    src="https://www.youtube.com/embed/b77bwSGDHK0?si=Oknc5f8CuC17WBnV&list=PLWR_ZQiGMS8mIe1kPZe8OfHIbhvZqaM8V"
    title="Build a real-time Rust Counter on Solana with MagicBlock's Ephemeral Rollup | Tutorial"
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

Build your program and upgrade it with delegation hooks with MagicBlock’s Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`:

<Steps>
  <Step
    title={
  <a href="#1-write-program">
    Write program and add delegation instructions
  </a>
}
  >
    Write your Solana program as you normally would.
  </Step>

  <Step title={<a href="#2-delegate">Delegate PDA on Base Layer</a>}>
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

  <Step title={<a href="#3-commit">Commit PDA on ER</a>}>
    Deploy your program directly on Solana using Solana CLI.
  </Step>

  <Step title={<a href="#4-undelegate">Undelegate PDA on ER</a>}>
    Send transactions without modifications on-chain and off-chain that also
    comply with the SVM RPC specification.
  </Step>
</Steps>

***

## Counter Example

The following software packages may be required, other versions may also be compatible:

| Software   | Version | Installation Guide                                      |
| ---------- | ------- | ------------------------------------------------------- |
| **Solana** | 2.3.13  | [Install Solana](https://docs.anza.xyz/cli/install)     |
| **Rust**   | 1.85.0  | [Install Rust](https://www.rust-lang.org/tools/install) |
| **Node**   | 24.10.0 | [Install Node](https://nodejs.org/en/download/current)  |

### Code Snippets

<Tabs>
  <Tab title="1. Write Program">
    The program implements two main instructions:

    1. `InitializeCounter`: Initialize and sets the counter to 0 (called on Base Layer)
    2. `IncreaseCounter`: Increments the initialized counter by X amount (called on Base Layer or ER)

    The program implements specific instructions for delegating and undelegating the counter:

    1. `Delegate`: Delegates counter from Base Layer to ER (called on Base Layer)
    2. `CommitAndUndelegate`: Schedules sync of counter from ER to Base Layer, and undelegates counter on ER (called on ER)
    3. `Commit`: Schedules sync of counter from ER to Base Layer (called on ER)
    4. `Undelegate`: Undelegates counter on the Base Layer (called on Base Layer through validator CPI)

    <Note>
      The undelegation callback discriminator `[196, 28, 41, 206, 48, 37, 51, 167]`
      and its instruction processor must be specified in your program. This
      instruction triggered by Delegation Program reverts account ownership on the
      Base Layer after calling undelegation on ER.

      With [`[#ephemeral]`](/pages/ephemeral-rollups-ers/how-to-guide/quickstart#1-write-program) Anchor macro from MagicBlock's Ephemeral Rollup SDK, the undelegation callback discriminator and processor are injected into your program.
    </Note>

    Here's the core structure of our program:

    {" "}

    ```rust theme={null}
    pub enum ProgramInstruction {
        InitializeCounter,
        IncreaseCounter {
            increase_by: u64
        },
        Delegate,
        CommitAndUndelegate,
        Commit,
        Undelegate {
            pda_seeds: Vec<Vec<u8>>
        }
    }

    #[derive(BorshDeserialize)]
    struct IncreaseCounterPayload {
        increase_by: u64,
    }

    impl ProgramInstruction {
        pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
            // Ensure the input has at least 8 bytes for the variant
            if input.len() < 8 {
                return Err(ProgramError::InvalidInstructionData);
            }

            // Extract the first 8 bytes as variant
            let (variant_bytes, rest) = input.split_at(8);
            let mut variant = [0u8; 8];
            variant.copy_from_slice(variant_bytes);

            Ok(match variant {
                [0, 0, 0, 0, 0, 0, 0, 0] => Self::InitializeCounter,
                [1, 0, 0, 0, 0, 0, 0, 0] => {
                    let payload = IncreaseCounterPayload::try_from_slice(rest)?;
                    Self::IncreaseCounter {
                        increase_by: payload.increase_by,
                    }
                },
                [2, 0, 0, 0, 0, 0, 0, 0] => Self::Delegate,
                [3, 0, 0, 0, 0, 0, 0, 0] => Self::CommitAndUndelegate,
                [4, 0, 0, 0, 0, 0, 0, 0] => Self::Commit,
                [196, 28, 41, 206, 48, 37, 51, 167] => {
                    let pda_seeds: Vec<Vec<u8>> = Vec::<Vec<u8>>::try_from_slice(rest)?;
                    Self::Undelegate {
                        pda_seeds
                    }
                }
                _ => return Err(ProgramError::InvalidInstructionData),
            })
        }
    }
    ```

    <Note>
      Your "Undelegate" instruction must have the exact discriminator. It is never
      called by you, instead the validator on the Base Layer will callback with a
      CPI into your program after undelegating your account on ER.
    </Note>

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="2. Delegate">
    ### Delegating the Counter PDA

    In order to delegate the counter PDA, and make it writable in an Ephemeral Rollup session, we need to add an instruction which
    internally calls the `delegate_account` function. `delegate_account` will CPI to the delegation program, which upon validation will gain ownership of the account.
    After this step, an ephemeral validator can start processing transactions on the counter PDA and propose state diff trough the delegation program.

    <Card title="Transaction (Base Layer): Delegate" icon="magnifying-glass" href="https://solscan.io/tx/5jUdf5rsfQsbLYAahS9axrnLnEjdbUqtXUmGfgGuS7QqbYJ4FZHgXTNoT1bxPXp7XQu78r8Ebpp1RT2u9V6qsc1r?cluster=devnet" iconType="duotone">
      Inspect transactions details on Solana Explorer
    </Card>

    ```rust theme={null}
    use solana_program::{
        account_info::{next_account_info, AccountInfo},
        pubkey::Pubkey,
        entrypoint::ProgramResult,
        program_error::ProgramError,
    };
    use ephemeral_rollups_sdk::cpi::{delegate_account, DelegateAccounts, DelegateConfig};

    // For Base Layer only
    // Set specific validator based on ER, see https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup
    pub fn process_delegate(
    \_program_id: &Pubkey,
    accounts: &[AccountInfo],
    ) -> ProgramResult {

        // Get accounts
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;
        let pda_to_delegate = next_account_info(account_info_iter)?;
        let owner_program = next_account_info(account_info_iter)?;
        let delegation_buffer = next_account_info(account_info_iter)?;
        let delegation_record = next_account_info(account_info_iter)?;
        let delegation_metadata = next_account_info(account_info_iter)?;
        let delegation_program = next_account_info(account_info_iter)?;

        // Optional: client-provided validator or default validator
        let default_validator = pubkey!("mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev"); // Local ER validator
        let validator_pubkey = match validator_account {
            Some(acc_info) => acc_info.key.clone(),
            None => default_validator,
        };

        // Prepare counter pda seeds
        let seed_1 = b"counter_account";
        let seed_2 = initializer.key.as_ref();
        let pda_seeds: &[&[u8]] = &[seed_1, seed_2];

        let delegate_accounts = DelegateAccounts {
            payer: initializer,
            pda: pda_to_delegate,
            owner_program,
            buffer: delegation_buffer,
            delegation_record,
            delegation_metadata,
            delegation_program,
            system_program,
        };

        let delegate_config = DelegateConfig {
            validator: Some(validator_pubkey), // Set delegating ER validator
            ..Default::default()
        };

        delegate_account(delegate_accounts, pda_seeds, delegate_config)?;

        Ok(())

    }
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="3. Commit">
    ### Committing while the PDA is delegated

    The ephemeral runtime allows committing the state of the PDA while it is delegated. This is done by building a `MagicIntentBundleBuilder` with the `commit` intent.

    <CardGroup cols={2}>
      <Card title="Transaction (ER): Commit" icon="magnifying-glass" href="https://solscan.io/tx/5GiFGyrnJPkEQbhE8EHVYczoj2RPGe1YSnoq1DzcUHAxpyzMUKtxG2Tc7TLkxtcCHr72ftnvmkAVMfecTaf6TCK8?cluster=custom&customUrl=https://devnet.magicblock.app" iconType="duotone">
        Inspect transaction details on Solana Explorer
      </Card>

      <Card title="Transaction (Base layer): Commit" icon="magnifying-glass" href="https://solscan.io/tx/5fHBADq99LAEBzGoeDXGtN3ut8RBf2s5UhbDM1N6TMTpvADNeYLz8e8vinNWj1VhLhrR7UxFoW7bo2u6pBR3YRjj?cluster=devnet" iconType="duotone">
        Inspect transaction details on Solana Explorer
      </Card>
    </CardGroup>

    ```rust theme={null}
    use solana_program::{
        account_info::{next_account_info, AccountInfo},
        pubkey::Pubkey,
        entrypoint::ProgramResult,
        program_error::ProgramError,
    };
    use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};

    // For ER only
    pub fn process_commit(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        // Get accounts
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let counter_account = next_account_info(account_info_iter)?;
        let magic_program = next_account_info(account_info_iter)?;
        let magic_context = next_account_info(account_info_iter)?;

        // Signer should be the same as the initializer
        if !initializer.is_signer {
            msg!("Initializer {} should be the signer", initializer.key);
            return Err(ProgramError::MissingRequiredSignature);
        }

        MagicIntentBundleBuilder::new(
            initializer.clone(),
            magic_context.clone(),
            magic_program.clone(),
        )
        .commit(&[counter_account.clone()])
        .build_and_invoke()?;

        Ok(())
    }
    ```

    [⬆️ Back to Top](#code-snippets)
  </Tab>

  <Tab title="4. Undelegate">
    ### Undelegating the PDA

    Undelegating the PDA is done by building a `MagicIntentBundleBuilder` with the `commit_and_undelegate` intent as part of some instruction.
    This commits the latest state and returns ownership of the PDA to the owner program. After undelegating and finalizing the state, the validator will create a callback CPI into `undelegate` on the base layer.

    <Note>
      The undelegation callback discriminator `[196, 28, 41, 206, 48, 37, 51, 167]`
      and its instruction processor must be specified in your program. This
      instruction triggered by Delegation Program reverts account ownership on the
      Base Layer after calling undelegation on ER.

      With [`[#ephemeral]`](/pages/ephemeral-rollups-ers/how-to-guide/quickstart#1-write-program) Anchor macro from MagicBlock's Ephemeral Rollup SDK, the undelegation callback discriminator and processor are injected into your program.
    </Note>

    <CardGroup cols={2}>
      <Card title="Transaction (ER): Undelegate" icon="magnifying-glass" href="https://solscan.io/tx/bMN6AhXrGH93Uc6ALibGgjnE39hcnY57mBhYkZ8TRaKxNRvyFaweaQPBmDxPv81cgR47WTTzzhfziTUEgAT8Y5m?cluster=custom&customUrl=https://devnet.magicblock.app" iconType="duotone">
        Inspect transaction details on Solana Explorer
      </Card>

      <Card title="Transaction (Base layer): Undelegate" icon="magnifying-glass" href="https://solscan.io/tx/8JafYWiXmd4CHc2E97WKYnaNPmChZeg8aGYY7UUWaQ7Z54N5WoMcAVivyv2vdn9wKirMkR3y4UcmFPdXYqBtKAa?cluster=devnet" iconType="duotone">
        Inspect transaction details on Solana Explorer
      </Card>
    </CardGroup>

    ```rust theme={null}
    use solana_program::{
        account_info::{next_account_info, AccountInfo},
        pubkey::Pubkey,
        entrypoint::ProgramResult,
        program_error::ProgramError,
    };
    use ephemeral_rollups_sdk::cpi::undelegate_account;
    use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};

    // For ER only
    pub fn process_commit_and_undelegate(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
    ) -> ProgramResult {
        // Get accounts
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let counter_account = next_account_info(account_info_iter)?;
        let magic_program = next_account_info(account_info_iter)?;
        let magic_context = next_account_info(account_info_iter)?;

        // Signer should be the same as the initializer
        if !initializer.is_signer {
            msg!("Initializer {} should be the signer", initializer.key);
            return Err(ProgramError::MissingRequiredSignature);
        }

        // Commit and undelegate counter_account on ER
        MagicIntentBundleBuilder::new(
            initializer.clone(),
            magic_context.clone(),
            magic_program.clone(),
        )
        .commit_and_undelegate(&[counter_account.clone()])
        .build_and_invoke()?;

        Ok(())
    }

    // For Base Layer CPI callback
    pub fn process_undelegate(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        pda_seeds: Vec<Vec<u8>>,
    ) -> ProgramResult {
        // Get accounts
        let account_info_iter = &mut accounts.iter();
        let delegated_pda = next_account_info(account_info_iter)?;
        let delegation_buffer = next_account_info(account_info_iter)?;
        let initializer = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        // CPI on Solana
        undelegate_account(
            delegated_pda,
            program_id,
            delegation_buffer,
            initializer,
            system_program,
            pda_seeds,
        )?;

        Ok(())
    }
    ```

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
    #[derive(BorshSerialize, BorshDeserialize, Debug)]
    pub struct Counter {
        pub count: u64,
    }

    // Resize counter account
    pub fn resize_counter_account(
        counter_acc: &AccountInfo,
        payer: &AccountInfo,
        program_id: &Pubkey,
        new_size: usize,
        bump: u8,
    ) -> ProgramResult {
        let rent = Rent::get()?;
        let lamports_required = rent.minimum_balance(new_size);

        let current_lamports = counter_acc.lamports();
        if lamports_required > current_lamports {
            let lamports_to_add = lamports_required - current_lamports;
            invoke_signed(
                &system_instruction::transfer(
                    &payer.key,
                    &counter_acc.key,
                    lamports_to_add,
                ),
                &[payer.clone(), counter_acc.clone()],
                &[&[COUNTER_SEED, &[bump]]],
            )?;
        }

        // Allocate new size
        invoke_signed(
            &system_instruction::allocate(&counter_acc.key, new_size as u64),
            &[counter_acc.clone()],
            &[&[COUNTER_SEED, &[bump]]],
        )?;

        // Assign back to program
        invoke_signed(
            &system_instruction::assign(&counter_acc.key, program_id),
            &[counter_acc.clone()],
            &[&[COUNTER_SEED, &[bump]]],
        )?;

        msg!("Counter account resized to {} bytes", new_size);
        Ok(())
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
