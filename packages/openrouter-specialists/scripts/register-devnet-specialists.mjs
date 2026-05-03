import crypto from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js';
import { loadSignerKeypairsFromEnv, profileEnvSlug } from '../dist/src/wallet-provenance.js';
import { specialistProfiles } from '../dist/src/profiles/index.js';

const DEFAULT_PROGRAM_ID = '794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD';
const AGENT_SEED = Buffer.from('agent');
const INCINERATOR = new PublicKey('1nc1nerator11111111111111111111111111111111');
const AgentType = { Primary: 0, Attestation: 1, Both: 2 };

const endpoint = process.env.SOLANA_DEVNET_RPC_URL ?? clusterApiUrl('devnet');
const programId = new PublicKey(process.env.OPENROUTER_SPECIALIST_ESCROW_PROGRAM_ID ?? process.env.DEMO_ESCROW_PROGRAM_ID ?? DEFAULT_PROGRAM_ID);
const outPath = process.env.REGISTRATION_ARTIFACT_OUT ?? join(process.cwd(), 'artifacts/devnet-registration-report.json');
const minBalanceLamports = Number(process.env.MIN_DEVNET_BALANCE_LAMPORTS ?? 500_000);

if (!endpoint.includes('devnet')) throw new Error('registration script is devnet-only; SOLANA_DEVNET_RPC_URL must point at devnet');
if (!Number.isFinite(minBalanceLamports) || minBalanceLamports < 0) throw new Error('MIN_DEVNET_BALANCE_LAMPORTS must be non-negative');

const signerLoad = loadSignerKeypairsFromEnv({ profiles: specialistProfiles.slice(0, 5), requireAll: true });
const connection = new Connection(endpoint, 'confirmed');
const report = [];

for (const { profile, keypair, sourceEnv } of signerLoad.loaded) {
  const owner = keypair.publicKey;
  const agentPda = PublicKey.findProgramAddressSync([AGENT_SEED, owner.toBytes()], programId)[0];
  const existing = await connection.getAccountInfo(agentPda, 'confirmed');
  const balanceLamports = await connection.getBalance(owner, 'confirmed');
  const entry = {
    profileId: profile.id,
    displayName: profile.displayName,
    ownerPublicKey: owner.toBase58(),
    profileWalletAddress: profile.walletAddress,
    signerSourceEnv: sourceEnv,
    agentPda: agentPda.toBase58(),
    programId: programId.toBase58(),
    balanceLamports,
    status: 'pending',
    txSignature: null,
    errors: [],
  };

  if (existing) {
    entry.status = 'already_registered';
    report.push(entry);
    continue;
  }
  if (balanceLamports < minBalanceLamports) {
    entry.status = 'insufficient_balance';
    entry.errors.push(`balance ${balanceLamports} below threshold ${minBalanceLamports}`);
    report.push(entry);
    continue;
  }

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: agentPda, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: INCINERATOR, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeRegisterAgent(agentTypeFor(profile), profile.model, rateLamportsFor(profile), 0),
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: owner, blockhash, lastValidBlockHeight }).add(instruction);
  tx.sign(keypair);

  try {
    const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    entry.status = 'registered';
    entry.txSignature = signature;
  } catch (error) {
    const message = String(error?.message ?? error);
    if (/already in use|AlreadyInUse|0x0/i.test(message)) entry.status = 'already_registered';
    else {
      entry.status = 'registration_failed';
      entry.errors.push(message);
    }
  }
  report.push(entry);
}

const artifact = {
  schemaVersion: '1.0.0',
  network: 'solana-devnet',
  endpoint,
  programId: programId.toBase58(),
  generatedAt: new Date().toISOString(),
  report,
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o644 });
console.log(JSON.stringify(artifact, null, 2));
if (report.some((entry) => entry.status === 'registration_failed' || entry.status === 'insufficient_balance')) process.exitCode = 1;

function disc(ixName) {
  return crypto.createHash('sha256').update(`global:${ixName}`).digest().subarray(0, 8);
}

function encodeRegisterAgent(agentType, model, rateLamports, minReputation) {
  const modelBytes = Buffer.from(model, 'utf8');
  const buf = Buffer.alloc(8 + 1 + 4 + modelBytes.length + 8 + 1);
  let offset = 0;
  disc('register_agent').copy(buf, offset); offset += 8;
  buf.writeUInt8(agentType, offset); offset += 1;
  buf.writeUInt32LE(modelBytes.length, offset); offset += 4;
  modelBytes.copy(buf, offset); offset += modelBytes.length;
  buf.writeBigUInt64LE(rateLamports, offset); offset += 8;
  buf.writeUInt8(minReputation, offset);
  return buf;
}

function agentTypeFor(profile) {
  const primary = profile.roles.includes('specialist');
  const attestor = profile.roles.includes('attestor');
  if (primary && attestor) return AgentType.Both;
  if (attestor) return AgentType.Attestation;
  return AgentType.Primary;
}

function rateLamportsFor(profile) {
  const envName = `OPENROUTER_SPECIALIST_${profileEnvSlug(profile.id)}_RATE_LAMPORTS`;
  const raw = process.env[envName] ?? process.env.OPENROUTER_SPECIALIST_DEFAULT_RATE_LAMPORTS;
  if (raw !== undefined) {
    const parsed = BigInt(raw);
    if (parsed < 0n) throw new Error(`${envName} must be non-negative`);
    return parsed;
  }
  return profile.roles.includes('attestor') ? 500_000n : 1_000_000n;
}
