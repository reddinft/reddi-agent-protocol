URL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/ephemeral-rollup
FETCHED_AS: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/ephemeral-rollup.md
FINAL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/ephemeral-rollup.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Delegation, Commitment & Undelegation

> Execute Transactions, Synchronize States, all in real-time.

<img class="w-full h-auto max-w-5xl" src="https://mintcdn.com/magicblock-42/5iyVpKJBt1PkwHw4/images/architecture_overview.png?fit=max&auto=format&n=5iyVpKJBt1PkwHw4&q=85&s=49ab1e3257a554ea6ce7d2b8cba9b1e8" width="4854" height="3000" data-path="images/architecture_overview.png" />

[Magicblock's Ephemeral Rollup](/pages/overview/additional-information/whitepaper) **leverages the Solana Virtual Machine (SVM)’s account-based structure and parallel execution** to optimize state management. By structuring the state into **clusters**, users can **lock one or multiple accounts** and temporarily shift state execution to a **dedicated auxiliary layer**— "Ephemeral Rollup (ER)". A dynamic fraud-proof mechanism enables fast state finalization through a decentralized Security Committee, see [whitepaper](/public/Ephemeral_Rollups_Fraud_Proof.pdf).

***

## Account Lifecyle for executing transactions in real-time with ER:

<img class="w-full h-auto max-w-5xl" src="https://mintcdn.com/magicblock-42/Thv8LjyS00pp5fQ2/images/magicblock-delegation-lifecycle.png?fit=max&auto=format&n=Thv8LjyS00pp5fQ2&q=85&s=7e3dc70c29cedb2485d4610e446137b4" width="1122" height="844" data-path="images/magicblock-delegation-lifecycle.png" />

<Steps>
  <Step title="Delegate Account">
    State accounts must be delegated to an specific ER validator first by
    changing the account owner to the [Delegation
    Program](https://github.com/magicblock-labs/delegation-program)
    `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` and specifying parameters
    like ER validator, account lifetime and synchronization frequency.

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

  <Step title="Execute Transaction in real-time">
    Delegated state accounts are updated in real-time with transactions on the
    ER directly or via [Magic
    Router](/pages/ephemeral-rollups-ers/introduction/magic-router). The
    **initial transaction on ER clones the delegated account** from base layer
    to the ephemeral rollup.
  </Step>

  <Step title="Commit State">
    The operator commits the ephemeral state to the base layer **periodically or
    on-demand**, including new state and relevant pointers. The account state is
    finalized using a fraud-proof mechanism as detailed in the paper.
  </Step>

  <Step title="Execute Transaction in real-time continuously">
    Delegated account states can continuously be updated in real-time on the ER
    directly or via [Magic
    Router](/pages/ephemeral-rollups-ers/introduction/magic-router).
  </Step>

  <Step title="Undelegate Account">
    Delegated account states are committed through ER validator to the base
    layer and the account owner are reversed from the [Delegation
    Program](https://github.com/magicblock-labs/delegation-program)
    `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh` to the original owner.
  </Step>
</Steps>
