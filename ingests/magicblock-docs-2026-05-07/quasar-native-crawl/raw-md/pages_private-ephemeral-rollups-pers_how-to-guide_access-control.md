URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/access-control
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/access-control.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/how-to-guide/access-control.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Access Control

> Learn how to manage fine-grained access control and member permissions in Private Ephemeral Rollups.

***

<CardGroup cols={2}>
  <Card title="Permission Program" icon="github" iconType="duotone" disabled>
    On-chain Permission Management (Coming soon)
  </Card>

  <Card title="Ephemeral Rollups SDK" icon="github" href="https://github.com/magicblock-labs/ephemeral-rollups-sdk" iconType="duotone">
    SDK for Private Ephemeral Rollups
  </Card>
</CardGroup>

***

## Overview

Private Ephemeral Rollups are [Ephemeral Rollups](/pages/ephemeral-rollups-ers/introduction/why) that enable fine-grained permission over permissioned accounts in a [Trusted Execution Environment](/pages/private-ephemeral-rollups-pers/introduction/onchain-privacy) with [compliance](/pages/private-ephemeral-rollups-pers/introduction/compliance-framework) at its heart. Each permission account maintains a list of members with specific flags that determine what actions they can perform.

### Key Concepts

* **Permission Account**: A PDA that stores access control rules for a specific account
* **Members**: Addresses granted specific permissions via flags
* **Flags**: Bitmasks that define what a member can do (authority, view logs, view balances, etc.)
* **Public Permissions**: When members are set to `None`, the permissioned account becomes temporarily visible

***

## Member Flags

Member flags define fine-grained permissions for each member. Flags can be combined using bitwise OR to grant multiple permissions.

**Flag Descriptions:**

* **AUTHORITY**: Allows a member to update and delegate permission settings, add/remove other members, and update member flags.
* **TX\_LOGS**: Allows a member to view transaction execution logs.
* **TX\_BALANCES**: Allows a member to view account balance changes.
* **TX\_MESSAGE**: Allows a member to view transaction message data.
* **ACCOUNT\_SIGNATURES**: Allows a member to view account signatures

<Tabs>
  <Tab title="Rust SDK">
    ```rust theme={null}
    use ephemeral_rollups_sdk::access_control::structs::{
        Member,
        AUTHORITY_FLAG,
        TX_LOGS_FLAG,
        TX_BALANCES_FLAG,
        TX_MESSAGE_FLAG,
        ACCOUNT_SIGNATURES_FLAG,
    };

    // Set flags by combining them with bitwise OR
    let flags = AUTHORITY_FLAG | TX_LOGS_FLAG;

    // Create a member with combined flags
    let mut member = Member {
        flags,
        pubkey: user_pubkey,
    };

    // Check if member has a specific flag using bitwise AND
    let is_authority = (member.flags & AUTHORITY_FLAG) != 0;
    let can_see_logs = (member.flags & TX_LOGS_FLAG) != 0;

    // Use helper methods to set/remove flags
    member.set_flags(TX_BALANCES_FLAG); // Add a flag
    member.remove_flags(TX_LOGS_FLAG);  // Remove a flag
    ```
  </Tab>

  <Tab title="Pinocchio">
    ```rust theme={null}
    use ephemeral_rollups_pinocchio::types::{Member, MemberFlags};
    use pinocchio::Address;

    // Create and set flags using individual methods
    let mut flags = MemberFlags::new();
    flags.set(MemberFlags::AUTHORITY);
    flags.set(MemberFlags::TX_LOGS);
    flags.set(MemberFlags::TX_BALANCES);

    // Create a member with flags
    let member = Member {
        flags,
        pubkey: user_address,
    };

    // Remove a flag
    flags.remove(MemberFlags::TX_LOGS);

    // Create flags from individual boolean values
    let flags = MemberFlags::from_acl_flags(
        true,  // authority
        true,  // tx_logs
        false, // tx_balances
        true,  // tx_message
        false, // account_signatures
    );

    // Convert flags to byte value
    let flag_byte = flags.to_acl_flag_byte();

    // Create flags from byte value
    let flags = MemberFlags::from_acl_flag_byte(flag_byte);
    ```
  </Tab>

  <Tab title="Web3.js">
    ```typescript theme={null}
    import { PublicKey } from "@solana/web3.js";
    import {
      AUTHORITY_FLAG,
      TX_LOGS_FLAG,
      TX_BALANCES_FLAG,
      TX_MESSAGE_FLAG,
      ACCOUNT_SIGNATURES_FLAG,
      type Member,
    } from "@magicblock-labs/ephemeral-rollups-sdk";

    // Set flags by combining them with bitwise OR
    const flags = AUTHORITY_FLAG | TX_LOGS_FLAG;

    // Create a member with combined flags
    const member: Member = {
      flags,
      pubkey: new PublicKey(userAddress),
    };

    // Check if a flag is present using bitwise AND
    const isAuthority = (member.flags & AUTHORITY_FLAG) !== 0;
    const canSeeLogs = (member.flags & TX_LOGS_FLAG) !== 0;
    const canSeeBalances = (member.flags & TX_BALANCES_FLAG) !== 0;

    // Add a flag to existing flags
    const updatedFlags = member.flags | TX_BALANCES_FLAG;

    // Remove a flag from existing flags
    const removedFlags = member.flags & ~TX_LOGS_FLAG;
    ```
  </Tab>

  <Tab title="Kit">
    ```typescript theme={null}
    import {
      AUTHORITY_FLAG,
      TX_LOGS_FLAG,
      TX_BALANCES_FLAG,
      TX_MESSAGE_FLAG,
      ACCOUNT_SIGNATURES_FLAG,
      isAuthority,
      canSeeTxLogs,
      canSeeTxBalances,
      canSeeTxMessages,
      canSeeAccountSignatures,
      type Member,
    } from "@magicblock-labs/ephemeral-rollups-sdk";

    // Set flags by combining them with bitwise OR
    const flags = AUTHORITY_FLAG | TX_LOGS_FLAG | TX_BALANCES_FLAG;

    // Create a member with combined flags
    const member: Member = {
      flags,
      pubkey: userAddress,
    };

    // Use helper functions to check specific permissions
    const canModifyPermission = isAuthority(member, userAddress);
    const canViewLogs = canSeeTxLogs(member, userAddress);
    const canViewBalances = canSeeTxBalances(member, userAddress);
    const canViewMessages = canSeeTxMessages(member, userAddress);
    const canViewSignatures = canSeeAccountSignatures(member, userAddress);

    // Add a flag to existing member
    const updatedFlags = member.flags | TX_MESSAGE_FLAG;

    // Remove a flag from existing member
    const removedFlags = member.flags & ~TX_LOGS_FLAG;
    ```
  </Tab>
</Tabs>

***

## Permission Lifecycle

The typical lifecycle of a permissioned account requires interaction with MagicBlock's Permission Program `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1` and Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`:

<Steps>
  <Step title={<a href="#1-create">Create Permission</a>}>
    Initialize a new permission account with initial members and their flags.
  </Step>

  <Step title={<a href="#2-delegate">Delegate Permission</a>}>
    Delegate the permission to Private Ephemeral Rollup to enable enforcement
    and real-time access control.

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

  <Step title={<a href="#3-update">Update Permission</a>}>
    Add, remove, or modify member permissions as needed. Updates can be made in
    real-time on Private Ephemeral Rollup.
  </Step>

  <Step title={<a href="#4-request">Make Request</a>}>
    Before making requests, verify TEE RPC integrity and obtain an authorization
    token. Only members with appropriate flags can access or modify the account
    state.
  </Step>

  <Step title={<a href="#5-commit-%26-undelegate">Commit and Undelegate</a>}>
    Sync the final state back to Solana and return the account to Base Layer
    control.
  </Step>

  <Step title={<a href="#6-close">Close Permission</a>}>
    Close the permission account and reclaim its lamports when no longer needed.
  </Step>
</Steps>

***

## Permission Operations

<Tabs>
  <Tab title="1. Create">
    Once you've created your program, you can add permission and delegation hooks to control access to your accounts. For example, see [Quickstart](/pages/private-ephemeral-rollups-pers/how-to-guide/quickstart).

    Create a new permission account with initial members and their flags via MagicBlock's Permission Program `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`.

    <Tabs>
      <Tab title="Rust SDK">
        ```rust theme={null}
        use ephemeral_rollups_sdk::access_control::{
            instructions::CreatePermissionCpiBuilder,
            structs::{
                Member,
                MembersArgs,
                AUTHORITY_FLAG,        // Member can directly modify the permission
                TX_LOGS_FLAG,          // Member can view transaction logs
                TX_BALANCES_FLAG       // Member can view account balances
            }
        };

        let members = Some(vec![
            Member {
                // AUTHORITY_FLAG allows this member to modify permission settings
                // TX_LOGS_FLAG allows viewing transaction logs
                flags: AUTHORITY_FLAG | TX_LOGS_FLAG,
                pubkey: *payer.key,
            },
        ]);

        // Note: Either the authority or permissioned_account can sign the transaction
        // The signer depends on who has AUTHORITY_FLAG in the members list
        CreatePermissionCpiBuilder::new(&permission_program)
            .permissioned_account(&permissioned_account)
            .permission(&permission)
            .payer(&payer)
            .system_program(&system_program)
            .args(MembersArgs { members })
            .invoke_signed(&[seed_refs.as_slice()])?;
        ```
      </Tab>

      <Tab title="Pinocchio">
        ```rust theme={null}
        use ephemeral_rollups_pinocchio::instruction::create_permission;
        use ephemeral_rollups_pinocchio::types::{
            Member,
            MemberFlags,
            MembersArgs,
        };
        use pinocchio::AccountView;

        // Create members with specific flags
        // AUTHORITY - Member can directly modify the permission
        // TX_LOGS - Member can view transaction logs
        // TX_BALANCES - Member can view account balances
        // TX_MESSAGE - Member can view transaction messages
        // ACCOUNT_SIGNATURES - Member can view account signatures

        let mut flags = MemberFlags::new();
        flags.set(MemberFlags::AUTHORITY);
        flags.set(MemberFlags::TX_LOGS);

        let member = Member {
            flags,
            pubkey: payer_address,
        };

        let members = vec![member];
        let members_args = MembersArgs {
            members: Some(&members),
        };

        // Prepare accounts: [permissioned_account, permission, payer, system_program]
        let accounts: &[&AccountView] = &[
            &permissioned_account,
            &permission,
            &payer,
            &system_program,
        ];

        // Create the permission
        // Pass signer_seeds if permissioned_account is a PDA owned by your program
        // Pass None if permissioned_account is an on-curve signer
        create_permission(
            accounts,
            &permission_program_id,
            members_args,
            pda_signer_seeds, // Or None if permissioned_account is on-curve
        )?;
        ```
      </Tab>

      <Tab title="Kit">
        ```typescript theme={null}
        import {
          createCreatePermissionInstruction,
          type Member,
          AUTHORITY_FLAG,        // Member can directly modify the permission
          TX_LOGS_FLAG,          // Member can view transaction logs
          TX_BALANCES_FLAG,      // Member can view account balances
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { transaction, sendAndConfirmTransaction } from "@solana/kit";

        const members: Member[] = [
          {
            // AUTHORITY_FLAG allows this member to modify permission settings
            // TX_LOGS_FLAG allows viewing transaction logs
            flags: AUTHORITY_FLAG | TX_LOGS_FLAG,
            pubkey: payer.address,
          },
        ];

        // Either the authority or permissioned_account can sign the transaction
        // The signer depends on who has AUTHORITY_FLAG in the members list
        const createPermissionIx = await createCreatePermissionInstruction(
          {
            permissionedAccount: permissionedAccount.address,
            payer: payer.address,
          },
          {
            members,
          }
        );

        const tx = transaction([createPermissionIx]);
        const signature = await sendAndConfirmTransaction(
          client,
          tx,
          [payer]
        );
        console.log("TX:", signature);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import {
          Member,
          AUTHORITY_FLAG,        // Member can directly modify the permission
          TX_LOGS_FLAG,          // Member can view transaction logs
          TX_BALANCES_FLAG,      // Member can view account balances
          createCreatePermissionInstruction,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

        const members: Member[] = [
          {
            // AUTHORITY_FLAG allows this member to modify permission settings
            // TX_LOGS_FLAG allows viewing transaction logs
            flags: AUTHORITY_FLAG | TX_LOGS_FLAG,
            pubkey: payer.publicKey,
          },
        ];

        // Either the authority or permissioned_account can sign the transaction
        // The signer depends on who has AUTHORITY_FLAG in the members list
        const createPermissionIx = createCreatePermissionInstruction(
          {
            permissionedAccount: permissionedAccount.publicKey,
            payer: payer.publicKey,
          },
          {
            members,
          }
        );

        const tx = new Transaction().add(createPermissionIx);
        const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("TX:", txSig);
        ```
      </Tab>
    </Tabs>

    **Use Cases:**

    * Initialize access control for a new delegated account
    * Set up authority members and their permissions
    * Define who can view transaction details

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>

  <Tab title="2. Delegate">
    Delegate a permissioned account to enable low-latency Private Ephemeral Rollup execution via MagicBlock's Delegation Program `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`.

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

    <Tabs>
      <Tab title="Rust SDK">
        ```rust theme={null}
        use ephemeral_rollups_sdk::access_control::{
            instructions::DelegatePermissionCpiBuilder
        };

        // Delegate the permission to enable low-latency Ephemeral Rollup execution
        // Either authority (with AUTHORITY_FLAG) or permissioned_account can authorize
        DelegatePermissionCpiBuilder::new(&permission_program)
            .payer(&payer)  // Pays for account creation
            .authority(&payer, false)  // Authority signer (has AUTHORITY_FLAG)
            .permissioned_account(&permissioned_account, true)  // or permissioned_account can sign
            .permission(&permission)
            .system_program(&system_program)
            .owner_program(&owner_program)
            .delegation_buffer(&delegation_buffer)
            .delegation_record(&delegation_record)
            .delegation_metadata(&delegation_metadata)
            .delegation_program(&delegation_program)
            .validator(&validator)  // Validator that will execute the delegated state
            .invoke_signed(&[seed_refs.as_slice()])?;
        ```
      </Tab>

      <Tab title="Pinocchio">
        ```rust theme={null}
        use ephemeral_rollups_pinocchio::instruction::delegate_permission;
        use pinocchio::AccountView;

        pub fn process_delegate_permission(
            accounts: &[&AccountView],
            permission_program: &pinocchio::Address,
            authority_is_signer: bool,
            permissioned_account_is_signer: bool,
        ) -> pinocchio::ProgramResult {
            // Accounts: [payer, authority, permissioned_account, permission, system_program,
            //           owner_program, delegation_buffer, delegation_record, 
            //           delegation_metadata, delegation_program, validator (optional)]
            
            // Pass signer_seeds if permissioned_account is a PDA owned by your program
            delegate_permission(
                accounts,
                permission_program,
                authority_is_signer,
                permissioned_account_is_signer,
                signer_seeds, // Or None if permissioned_account is on-curve
            )?;
            
            Ok(())
        }
        ```
      </Tab>

      <Tab title="Kit">
        ```typescript theme={null}
        import {
          createDelegatePermissionInstruction,
          PERMISSION_PROGRAM_ID,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { transaction, sendAndConfirmTransaction } from "@solana/kit";

        // Delegate the permission to enable low-latency Ephemeral Rollup execution
        // Either authority (with AUTHORITY_FLAG) or permissioned_account can authorize
        const delegatePermissionIx = await createDelegatePermissionInstruction(
          {
            payer: payer.address,  // Pays for account creation
            authority: [payer.address, true],  // Authority signer (has AUTHORITY_FLAG)
            permissionedAccount: [permissionedAccount.address, false],  // or permissioned_account can sign
            ownerProgram: PERMISSION_PROGRAM_ID,
            validator,  // Validator that will execute the delegated state
          }
        );

        const tx = transaction([delegatePermissionIx]);
        const signature = await sendAndConfirmTransaction(
          client,
          tx,
          [payer]
        );
        console.log("TX:", signature);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import {
          PERMISSION_PROGRAM_ID,
          createDelegatePermissionInstruction,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

        // Delegate the permission to enable low-latency Ephemeral Rollup execution
        // Either authority (with AUTHORITY_FLAG) or permissioned_account can authorize
        const delegatePermissionIx = createDelegatePermissionInstruction({
          payer: payer.publicKey,  // Pays for account creation
          authority: [payer.publicKey, true],  // Authority signer (has AUTHORITY_FLAG)
          permissionedAccount: [permissionedAccount.publicKey, false],  // or permissioned_account can sign
          ownerProgram: PERMISSION_PROGRAM_ID,
          validator,  // Validator that will execute the delegated state
        });

        const tx = new Transaction().add(delegatePermissionIx);
        const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("TX:", txSig);
        ```
      </Tab>
    </Tabs>

    **Use Cases:**

    * Enable ER execution for a permissioned account
    * Designate a specific validator to execute state changes
    * Set up delegation for real-time transaction processing

    **Important:**

    * Either the authority or permissioned\_account must sign based on AUTHORITY\_FLAG
    * The validator processes transactions at ER speed
    * Commit frequency determines how often state syncs to Solana
    * **Once delegated to Private Ephemeral Rollup, the permission is enforced** - only members with appropriate flags can access or modify the account state

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>

  <Tab title="3. Update">
    Modify existing members or their flags in a permission account via MagicBlock's Permission Program `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`.

    <Tabs>
      <Tab title="Rust SDK">
        ```rust theme={null}
        use ephemeral_rollups_sdk::access_control::{
            instructions::UpdatePermissionCpiBuilder,
            structs::MembersArgs
        };

        // Update permission and modify members
        // Either authority or permissioned_account must sign based on AUTHORITY_FLAG
        UpdatePermissionCpiBuilder::new(&permission_program)
            .authority(&payer, true)  // authority can sign if they have AUTHORITY_FLAG
            .permissioned_account(&permissioned_account, true)  // or permissioned_account can sign
            .permission(&permission)
            // Setting members to None makes the permission public (temporarily visible)
            // This is useful for transitional states during delegation/undeligation
            .args(MembersArgs { members: None })
            .invoke_signed(&[seed_refs.as_slice()])?;
        ```
      </Tab>

      <Tab title="Pinocchio">
        ```rust theme={null}
        use ephemeral_rollups_pinocchio::instruction::update_permission;
        use ephemeral_rollups_pinocchio::types::{
            Member,
            MemberFlags,
            MembersArgs,
        };
        use pinocchio::AccountView;

        // Update permission with new member flags
        // Either authority or permissioned_account must sign based on AUTHORITY_FLAG
        let mut new_flags = MemberFlags::new();
        new_flags.set(MemberFlags::TX_LOGS);
        new_flags.set(MemberFlags::TX_BALANCES);

        let updated_member = Member {
            flags: new_flags,
            pubkey: user_address,
        };

        let members = vec![updated_member];
        let members_args = MembersArgs {
            members: Some(&members),
        };

        // Prepare accounts: [authority, permissioned_account, permission]
        let accounts: &[&AccountView] = &[
            &authority,
            &permissioned_account,
            &permission,
        ];

        // Update the permission
        // Setting members to None makes the permission public (temporarily visible)
        // Pass signer_seeds if permissioned_account is a PDA owned by your program
        update_permission(
            accounts,
            &permission_program_id,
            authority.is_signer(),
            permissioned_account.is_signer(),
            members_args,
            signer_seeds, // Or None if permissioned_account is on-curve
        )?;
        ```
      </Tab>

      <Tab title="Kit">
        ```typescript theme={null}
        import {
          createUpdatePermissionInstruction,
          type Member,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { transaction, sendAndConfirmTransaction } from "@solana/kit";

        // Update permission and modify members
        // Either authority or permissioned_account must sign based on AUTHORITY_FLAG
        const updatePermissionIx = await createUpdatePermissionInstruction(
          {
            authority: [payer.address, true],  // authority can sign if they have AUTHORITY_FLAG
            permissionedAccount: [permissionedAccount.address, false],  // or permissioned_account can sign
          },
          {
            // Setting members to empty array or None makes the permission public (temporarily visible)
            // This is useful for transitional states during delegation/undeligation
            members: [],
          }
        );

        const tx = transaction([updatePermissionIx]);
        const signature = await sendAndConfirmTransaction(
          client,
          tx,
          [payer]
        );
        console.log("TX:", signature);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import { createUpdatePermissionInstruction } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

        // Update permission and modify members
        // Either authority or permissioned_account must sign based on AUTHORITY_FLAG
        const updatePermissionIx = createUpdatePermissionInstruction(
          {
            authority: [payer.publicKey, true],  // authority can sign if they have AUTHORITY_FLAG
            permissionedAccount: [permissionedAccount.publicKey, false],  // or permissioned_account can sign
          },
          {
            // Setting members to empty array or None makes the permission public (temporarily visible)
            // This is useful for transitional states during delegation/undeligation
            members: [],
          }
        );

        const tx = new Transaction().add(updatePermissionIx);
        const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("TX:", txSig);
        ```
      </Tab>
    </Tabs>

    **Use Cases:**

    * Add new members to a permission group
    * Revoke permissions by removing members
    * Change member flags to grant/restrict access
    * Set members to `None` to make account temporarily visible

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>

  <Tab title="4. Request">
    When making requests to Private Ephemeral Rollup, you must first establish authorization:

    <Note>
      Private Ephemeral Rollup (devnet) endpoint:
      `https://devnet-tee.magicblock.app?token=   {authToken}`. Replace `{authToken}` with your authorization token obtained
      from the TEE RPC to send requests.
    </Note>

    **Authorization Steps:**

    1. **Verify TEE RPC Integrity**: Verify the TEE RPC server runs on genuine Intel TDX hardware using its TDX quote and Intel-issued attestation certificates
    2. **Request Authorization Token**: Sign a challenge message to receive an authorization token
    3. **Create Connection**: Pass the authorization token inside header or as query parameter

    <Tabs>
      <Tab title="Kit">
        ```typescript theme={null}
        import {
          verifyTeeRpcIntegrity,
          getAuthToken,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Connection } from "@magicblock-labs/ephemeral-rollups-kit";
        import * as nacl from "tweetnacl";

        const teeUrl = "https://devnet-tee.magicblock.app";
        const teeWsUrl = "wss://tee.magicblock.app";

        // 1. Verify the integrity of TEE RPC
        const isVerified = await verifyTeeRpcIntegrity(teeUrl);

        // 2. Get AuthToken before making request to TEE
        const authToken = await getAuthToken(
          teeUrl,
          userPubkey,
          (message: Uint8Array) =>
            Promise.resolve(nacl.sign.detached(message, userSecretKey)),
        );

        // 3. Create connection with TEE using authorization token
        const teeUserUrl = `${teeUrl}?token=${authToken.token}`;
        const teeUserWsUrl = `${teeWsUrl}?token=${authToken.token}`;

        const ephemeralConnection = await Connection.create(teeUserUrl, teeUserWsUrl);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import {
          verifyTeeRpcIntegrity,
          getAuthToken,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Connection, Keypair } from "@solana/web3.js";
        import * as nacl from "tweetnacl";

        const teeUrl = "https://devnet-tee.magicblock.app";
        const teeWsUrl = "wss://tee.magicblock.app";

        // 1. Verify the integrity of TEE RPC
        const isVerified = await verifyTeeRpcIntegrity(teeUrl);

        // 2. Get AuthToken before making request to TEE
        const authToken = await getAuthToken(
          teeUrl,
          userKeypair.publicKey,
          (message: Uint8Array) =>
            Promise.resolve(nacl.sign.detached(message, userKeypair.secretKey)),
        );

        // 3. Create connection with TEE
        const teeUserUrl = `${teeUrl}?token=${authToken.token}`;
        const teeUserWsUrl = `${teeWsUrl}?token=${authToken.token}`;

        const connection = new Connection(teeUserUrl, {
          wsEndpoint: teeUserWsUrl,
        });
        ```
      </Tab>
    </Tabs>

    **Account Visibility:**

    * **By default**: All accounts are transparent and accessible to any authorized user
    * **With permissions**: Once an account is permissioned through the permission system, access control rules are enforced during every request
    * Only members with appropriate flags can access or modify permissioned accounts and transactions

    **Key Points:**

    * Requests are executed in real-time on the validator
    * Member flags determine what each user can do
    * Permissions can be updated dynamically during execution
    * Updates take effect immediately on the Private Ephemeral Rollup

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>

  <Tab title="5. Commit & Undelegate">
    The latest permission state on Private Ephemeral Rollup enforces access control. For closing permission account, update permission members before undelegating permission to Solana.

    <Tabs>
      <Tab title="Rust SDK">
        ```rust theme={null}
        use ephemeral_rollups_sdk::access_control::{
            instructions::CommitAndUndelegatePermissionCpiBuilder
        };

        CommitAndUndelegatePermissionCpiBuilder::new(&permission_program)
            .authority(&payer, false)
            .permissioned_account(&permissioned_account, true)
            .permission(&permission)
            .magic_program(&magic_program)
            .magic_context(&magic_context)
            .invoke_signed(&[seed_refs.as_slice()])?;
        ```
      </Tab>

      <Tab title="Pinocchio">
        ```rust theme={null}
        use ephemeral_rollups_pinocchio::instruction::commit_and_undelegate_permission;
        use pinocchio::AccountView;

        pub fn process_commit_and_undelegate_permission(
            accounts: &[&AccountView],
            permission_program: &pinocchio::Address,
            authority_is_signer: bool,
            permissioned_account_is_signer: bool,
        ) -> pinocchio::ProgramResult {
            // Accounts: [authority, permissioned_account, permission, magic_program, magic_context]
            
            // Pass signer_seeds if permissioned_account is a PDA owned by your program
            commit_and_undelegate_permission(
                accounts,
                permission_program,
                authority_is_signer,
                permissioned_account_is_signer,
                signer_seeds, // Or None if permissioned_account is on-curve
            )?;

            Ok(())
        }
        ```
      </Tab>

      <Tab title="Kit">
        ```typescript theme={null}
        import {
          createCommitAndUndelegatePermissionInstruction,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { transaction, sendAndConfirmTransaction } from "@solana/kit";

        const commitAndUndelegatePermissionIx =
          await createCommitAndUndelegatePermissionInstruction({
            authority: [payer.address, true],
            permissionedAccount: [permissionedAccount.address, false],
          });

        const tx = transaction([commitAndUndelegatePermissionIx]);
        const signature = await sendAndConfirmTransaction(
          client,
          tx,
          [payer]
        );
        console.log("TX:", signature);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import { createCommitAndUndelegatePermissionInstruction } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

        const commitAndUndelegatePermissionIx = 
          createCommitAndUndelegatePermissionInstruction({
            authority: [payer.publicKey, true],
            permissionedAccount: [permissionedAccount.publicKey, false],
          });

        const tx = new Transaction().add(commitAndUndelegatePermissionIx);
        const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("TX:", txSig);
        ```
      </Tab>
    </Tabs>

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>

  <Tab title="6. Close">
    Close a permissioned account and reclaim its lamports on Solana.

    <Tabs>
      <Tab title="Rust SDK">
        ```rust theme={null}
        use ephemeral_rollups_sdk::access_control::{
            instructions::ClosePermissionCpiBuilder
        };

        // Close the permission account and reclaim lamports
        // IMPORTANT: The permission must be undelegated to Solana first
        // If delegated, call commit_and_undelegate before closing
        ClosePermissionCpiBuilder::new(&permission_program)
            .payer(&payer)  // Receives reclaimed lamports
            .authority(&payer, false)  // Authority signer (has AUTHORITY_FLAG)
            .permissioned_account(&permissioned_account, true)  // or permissioned_account can sign
            .permission(&permission)  // The permission account to close
            .invoke_signed(&[seed_refs.as_slice()])?;
        ```
      </Tab>

      <Tab title="Pinocchio">
        ```rust theme={null}
        use ephemeral_rollups_pinocchio::instruction::close_permission;
        use pinocchio::AccountView;

        pub fn process_close_permission(
            accounts: &[&AccountView],
            permission_program: &pinocchio::Address,
            authority_is_signer: bool,
            permissioned_account_is_signer: bool,
        ) -> pinocchio::ProgramResult {
            // Accounts: [payer, authority, permissioned_account, permission]
            // IMPORTANT: The permission must be undelegated to Solana first
            // If the permission is still delegated, this operation will fail
            
            // Pass signer_seeds if permissioned_account is a PDA owned by your program
            close_permission(
                accounts,
                permission_program,
                authority_is_signer,
                permissioned_account_is_signer,
                signer_seeds, // Or None if permissioned_account is on-curve
            )?;

            // The permission account lamports are transferred to the payer
            Ok(())
        }
        ```
      </Tab>

      <Tab title="Kit">
        ```typescript theme={null}
        import {
          createClosePermissionInstruction,
        } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { transaction, sendAndConfirmTransaction } from "@solana/kit";

        // Close the permission account and reclaim lamports
        // IMPORTANT: The permission must be undelegated to Solana first
        // If delegated, call commit_and_undelegate before closing
        const closePermissionIx = await createClosePermissionInstruction({
          payer: payer.address,  // Receives reclaimed lamports
          authority: [payer.address, true],  // Authority signer (has AUTHORITY_FLAG)
          permissionedAccount: [permissionedAccount.address, false],  // or permissioned_account can sign
        });

        const tx = transaction([closePermissionIx]);
        const signature = await sendAndConfirmTransaction(
          client,
          tx,
          [payer]
        );
        console.log("TX:", signature);
        ```
      </Tab>

      <Tab title="Web3.js">
        ```typescript theme={null}
        import { createClosePermissionInstruction } from "@magicblock-labs/ephemeral-rollups-sdk";
        import { Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

        // Close the permission account and reclaim lamports
        // IMPORTANT: The permission must be undelegated to Solana first
        // If delegated, call commit_and_undelegate before closing
        const closePermissionIx = createClosePermissionInstruction({
          payer: payer.publicKey,  // Receives reclaimed lamports
          authority: [payer.publicKey, true],  // Authority signer (has AUTHORITY_FLAG)
          permissionedAccount: [permissionedAccount.publicKey, false],  // or permissioned_account can sign
        });

        const tx = new Transaction().add(closePermissionIx);
        const txSig = await sendAndConfirmTransaction(connection, tx, [payer]);
        console.log("TX:", txSig);
        ```
      </Tab>
    </Tabs>

    **Use Cases:**

    * Clean up unused permission accounts
    * Reclaim SOL from closed accounts

    **Important:**

    * The permission must be undelegated to Solana first
    * If delegated, call `commit_and_undelegate` before closing
    * Lamports are returned to the payer

    [⬆️ Back to Top](#permission-lifecycle)
  </Tab>
</Tabs>

***

## Best Practices

1. **Authority Management**: Always assign AUTHORITY\_FLAG to at least one trusted member
2. **Least Privilege**: Grant only necessary flags to each member
3. **Real-time Updates**: Permissions can be updated in real-time on Private Ephemeral Rollup without undelegating, allowing dynamic access control adjustments
4. **Cleanup**: Undelegate and close unused permission accounts to free SOL

***

## Security Considerations

* **Signer Validation**: Only members with AUTHORITY\_FLAG or program with permissioned account can authorize changes
* **Public Accounts**: Setting members to `None` makes the account publicly visible
* **Default Authority**: By default, the owner of the permissioned account is added as permission authority to members of permission account.
* **Empty Member List**: If members field is set to empty list, the permissioned account is fully restricted and private. Only the owner of permissioned account can modify the permission.
* **Access Auditing**: Use member flags to audit and control access

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
