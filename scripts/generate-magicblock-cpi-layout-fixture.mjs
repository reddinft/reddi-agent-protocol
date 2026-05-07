#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const sdk = await import(
  path.join(root, "packages/per-client/node_modules/@magicblock-labs/ephemeral-rollups-sdk/lib/index.js")
);

const {
  createCreatePermissionInstruction,
  createDelegateInstruction,
  createDelegatePermissionInstruction,
  createCommitAndUndelegatePermissionInstruction,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
  permissionPdaFromAccount,
  DELEGATION_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
  PERMISSION_PROGRAM_ID,
} = sdk;

const TEE_DEVNET_VALIDATOR = new PublicKey("MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");
const LEGACY_ESCROW_PROGRAM_ID = new PublicKey("794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD");
const payer = new PublicKey("AjAPTMjZbsJbeXmdBGzMADWkFixRvVw3mKt8sp99mVCe");
const escrow = new PublicKey("2jDihUwocLR87spdk9VUnsJyPtqpEZ1bsVHfpQxYwjce");

function keyToJson(key) {
  return {
    pubkey: key.pubkey.toBase58(),
    isSigner: key.isSigner,
    isWritable: key.isWritable,
  };
}

function ixToJson(name, ix) {
  return {
    name,
    programId: ix.programId.toBase58(),
    dataHex: Buffer.from(ix.data).toString("hex"),
    accounts: ix.keys.map(keyToJson),
  };
}

const permission = permissionPdaFromAccount(escrow);

const createPermission = createCreatePermissionInstruction(
  {
    permissionedAccount: escrow,
    payer,
  },
  { members: null },
);

const delegatePermission = createDelegatePermissionInstruction(
  {
    payer,
    authority: [payer, true],
    permissionedAccount: [escrow, true],
    ownerProgram: PERMISSION_PROGRAM_ID,
    validator: TEE_DEVNET_VALIDATOR,
  },
  { validator: TEE_DEVNET_VALIDATOR },
);

const delegateEscrow = createDelegateInstruction(
  {
    payer,
    delegatedAccount: escrow,
    ownerProgram: LEGACY_ESCROW_PROGRAM_ID,
    validator: TEE_DEVNET_VALIDATOR,
  },
  { validator: TEE_DEVNET_VALIDATOR },
);

const commitAndUndelegatePermission = createCommitAndUndelegatePermissionInstruction({
  authority: [payer, true],
  permissionedAccount: [escrow, true],
});

const out = {
  schema: "reddi.magicblock-cpi-layout-fixture.v1",
  generatedAt: new Date().toISOString(),
  note: "Offline SDK-derived fixture for implementing Rust CPI account metas/data. No network calls, signing, transfer, or mutation.",
  constants: {
    teeDevnetValidator: TEE_DEVNET_VALIDATOR.toBase58(),
    legacyEscrowProgramId: LEGACY_ESCROW_PROGRAM_ID.toBase58(),
    permissionProgramId: PERMISSION_PROGRAM_ID.toBase58(),
    delegationProgramId: DELEGATION_PROGRAM_ID.toBase58(),
    magicProgramId: MAGIC_PROGRAM_ID.toBase58(),
    magicContextId: MAGIC_CONTEXT_ID.toBase58(),
    systemProgramId: SystemProgram.programId.toBase58(),
  },
  sampleAccounts: {
    payer: payer.toBase58(),
    escrow: escrow.toBase58(),
    permission: permission.toBase58(),
    escrowDelegateBuffer: delegateBufferPdaFromDelegatedAccountAndOwnerProgram(escrow, LEGACY_ESCROW_PROGRAM_ID).toBase58(),
    escrowDelegationRecord: delegationRecordPdaFromDelegatedAccount(escrow).toBase58(),
    escrowDelegationMetadata: delegationMetadataPdaFromDelegatedAccount(escrow).toBase58(),
    permissionDelegateBuffer: delegateBufferPdaFromDelegatedAccountAndOwnerProgram(permission, PERMISSION_PROGRAM_ID).toBase58(),
    permissionDelegationRecord: delegationRecordPdaFromDelegatedAccount(permission).toBase58(),
    permissionDelegationMetadata: delegationMetadataPdaFromDelegatedAccount(permission).toBase58(),
  },
  instructions: [
    ixToJson("createPermission", createPermission),
    ixToJson("delegatePermission", delegatePermission),
    ixToJson("delegateEscrow", delegateEscrow),
    ixToJson("commitAndUndelegatePermission", commitAndUndelegatePermission),
  ],
};

const outDir = path.join(root, "artifacts/magicblock-cpi-layout");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "latest.json");
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, outPath, instructionCount: out.instructions.length }, null, 2));
