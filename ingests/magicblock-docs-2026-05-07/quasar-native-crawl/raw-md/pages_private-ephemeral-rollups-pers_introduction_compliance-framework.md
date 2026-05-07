URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/compliance-framework
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/compliance-framework.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/compliance-framework.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Compliance Framework

> MagicBlock enables confidential execution without compromising performance, compliance, or control.

### Overview

MagicBlock Private Ephemeral Rollups (PERs) enable confidential execution while enforcing account-level state access and regulatory-compliant controls. We believe in a form of privacy that is respectful of users' rights and lawful. Private ERs are not open anonymity rails, but rather private environments with enforced boundaries that can be customized for specific use cases.

### Built for Institutional Requirements: Performance, Compliance, and Control

Businesses and institutions do not choose between performance, compliance, and control; they require all three. Systems that sacrifice performance for compliance are unusable at scale, while systems that optimize solely for speed or privacy without enforceable controls are incompatible with institutional mandates or the day-to-day operations of lawful businesses.

MagicBlock's Trusted Execution Environment (TEE) architecture is explicitly designed to satisfy these requirements simultaneously.

* **Performance**: Private ERs deliver low-latency, high-throughput execution suitable for real-time applications, market-sensitive workflows, and on-chain systems that cannot tolerate delayed or probabilistic settlement.

* **Compliance**: Jurisdictional enforcement, real-time AML and sanctions screening, and clear, upfront licensing ensure private execution operates within clearly defined legal and regulatory boundaries.

* **Control**: Access to private execution is conditional, configurable, and enforceable at the on-chain program level. Institutions retain control over who can connect and under what constraints assets may enter or exit.

This approach allows institutions to unlock the benefits of confidential execution while preserving the guarantees they require to operate responsibly at scale.

### Compliance Safeguards

<img
  src="https://mintcdn.com/magicblock-42/0xRNL71sjc7kfNNk/images/per-compliance-flow.png?fit=max&auto=format&n=0xRNL71sjc7kfNNk&q=85&s=0ebbe718967518ae287c026d586fd214"
  alt="MagicBlock Private Ephemeral Rollup Compliance Flow"
  style={{
width: "100%",
height: "auto",
objectFit: "contain",
borderRadius: "8px",
}}
  width="1624"
  height="846"
  data-path="images/per-compliance-flow.png"
/>

* **Jurisdiction & Network Access Controls**\
  Private ER access is enforced at the infrastructure layer through node-level IP geofencing. Connections originating from OFAC-sanctioned or otherwise restricted jurisdictions are blocked at ingress, before any transaction is accepted or executed. These controls ensure jurisdictional restrictions are enforced deterministically and upstream of execution.

* **Real-Time AML & Sanctions Screening**\
  All relevant interaction points with Private ERs are subject to continuous, real-time AML and sanctions screening via Range. This includes sanctions list verification, exposure and counterparty risk assessment, and behavioral risk signals. Transactions that fail screening are rejected or halted prior to execution or settlement, preventing tainted flows from entering or exiting the private environment.

* **EULA & Licensed Deployments**\
  Private ER instances are operated under explicit licensing and policy constraints defined by MagicBlock Labs and, where applicable, its partners. Different licenses can be applied to different instances to ensure the open-source software we provide explicitly forbids illicit use cases or misuse of the technology for unwarranted transactions.

MagicBlock Private ERs deliver confidential execution within clearly enforced legal and regulatory boundaries.

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
