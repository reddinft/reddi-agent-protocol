/**
 * Quasar instruction-data builders for the hackathon cutover path.
 *
 * These builders intentionally do NOT reuse Anchor's 8-byte SHA256 discriminators.
 * Quasar parity programs use a single-byte discriminator declared via
 * `#[instruction(discriminator = N)]`.
 *
 * Source evidence:
 * - docs/verifiable-agent-protocol/colosseum-frontier-2026-04/QUASAR-REGISTRY-PARITY-REPORT.md
 * - docs/verifiable-agent-protocol/colosseum-frontier-2026-04/QUASAR-REPUTATION-PARITY-REPORT.md
 * - docs/verifiable-agent-protocol/colosseum-frontier-2026-04/QUASAR-ATTESTATION-PARITY-REPORT.md
 */

export const QUASAR_DISC = {
  register: 0,
  update: 1,
  deregister: 2,
  reputationCommit: 1,
  reputationReveal: 2,
  reputationExpire: 3,
  attest: 1,
  confirmAttestation: 2,
  disputeAttestation: 3,
} as const;

export const QUASAR_MODEL_MAX_BYTES = 64;
export const QUASAR_JOB_ID_BYTES = 16;
export const QUASAR_HASH_BYTES = 32;

function writeU64LE(target: Uint8Array, offset: number, value: bigint) {
  let v = value;
  for (let i = 0; i < 8; i += 1) {
    target[offset + i] = Number(v & 0xffn);
    v >>= 8n;
  }
}

function requireFixedBytes(name: string, value: Uint8Array, expected: number) {
  if (value.length !== expected) {
    throw new Error(`${name}_must_be_${expected}_bytes`);
  }
}

function bytesFromUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function quasarJobIdToU128Bytes(jobId: Uint8Array): Uint8Array {
  requireFixedBytes("job_id", jobId, QUASAR_JOB_ID_BYTES);
  return new Uint8Array(jobId);
}

export function buildQuasarRegisterData(
  agentType: number,
  model: string,
  rateLamports: bigint,
  minReputation: number,
): Buffer {
  const modelBytes = bytesFromUtf8(model);
  if (modelBytes.length > QUASAR_MODEL_MAX_BYTES) throw new Error("model_too_long");
  if (agentType < 0 || agentType > 2) throw new Error("invalid_agent_type");

  // disc(1) + agent_type(1) + model_len(1) + model_data(64) + rate_lamports(8) + min_reputation(1)
  const data = new Uint8Array(1 + 1 + 1 + QUASAR_MODEL_MAX_BYTES + 8 + 1);
  let o = 0;
  data[o++] = QUASAR_DISC.register;
  data[o++] = agentType;
  data[o++] = modelBytes.length;
  data.set(modelBytes, o); o += QUASAR_MODEL_MAX_BYTES;
  writeU64LE(data, o, rateLamports); o += 8;
  data[o++] = minReputation;
  return Buffer.from(data);
}

export function buildQuasarUpdateAgentData(rateLamports: bigint, minReputation: number, active: boolean): Buffer {
  const data = new Uint8Array(1 + 8 + 1 + 1);
  let o = 0;
  data[o++] = QUASAR_DISC.update;
  writeU64LE(data, o, rateLamports); o += 8;
  data[o++] = minReputation;
  data[o++] = active ? 1 : 0;
  return Buffer.from(data);
}

export function buildQuasarDeregisterAgentData(): Buffer {
  return Buffer.from([QUASAR_DISC.deregister]);
}

export function buildQuasarCommitRatingData(
  jobId: Uint8Array,
  commitment: Uint8Array,
  role: 0 | 1,
  consumerPk: Uint8Array,
  specialistPk: Uint8Array,
): Buffer {
  requireFixedBytes("commitment", commitment, QUASAR_HASH_BYTES);
  requireFixedBytes("consumer_pk", consumerPk, 32);
  requireFixedBytes("specialist_pk", specialistPk, 32);
  const job = quasarJobIdToU128Bytes(jobId);
  const data = new Uint8Array(1 + 16 + 32 + 1 + 32 + 32);
  let o = 0;
  data[o++] = QUASAR_DISC.reputationCommit;
  data.set(job, o); o += 16;
  data.set(commitment, o); o += 32;
  data[o++] = role;
  data.set(consumerPk, o); o += 32;
  data.set(specialistPk, o); o += 32;
  return Buffer.from(data);
}

export function buildQuasarRevealRatingData(jobId: Uint8Array, score: number, salt: Uint8Array): Buffer {
  if (score < 1 || score > 10) throw new Error("invalid_score");
  requireFixedBytes("salt", salt, QUASAR_HASH_BYTES);
  const job = quasarJobIdToU128Bytes(jobId);
  const data = new Uint8Array(1 + 16 + 1 + 32);
  let o = 0;
  data[o++] = QUASAR_DISC.reputationReveal;
  data.set(job, o); o += 16;
  data[o++] = score;
  data.set(salt, o); o += 32;
  return Buffer.from(data);
}

export function buildQuasarExpireRatingData(jobId: Uint8Array): Buffer {
  const job = quasarJobIdToU128Bytes(jobId);
  return Buffer.from([QUASAR_DISC.reputationExpire, ...job]);
}

export function buildQuasarAttestQualityData(jobId: Uint8Array, scores: Uint8Array, consumerPk: Uint8Array): Buffer {
  requireFixedBytes("scores", scores, 5);
  requireFixedBytes("consumer_pk", consumerPk, 32);
  for (const score of scores) {
    if (score < 1 || score > 10) throw new Error("invalid_attestation_score");
  }
  const job = quasarJobIdToU128Bytes(jobId);
  const data = new Uint8Array(1 + 16 + 5 + 32);
  let o = 0;
  data[o++] = QUASAR_DISC.attest;
  data.set(job, o); o += 16;
  data.set(scores, o); o += 5;
  data.set(consumerPk, o); o += 32;
  return Buffer.from(data);
}

export function buildQuasarConfirmAttestationData(jobId: Uint8Array): Buffer {
  const job = quasarJobIdToU128Bytes(jobId);
  return Buffer.from([QUASAR_DISC.confirmAttestation, ...job]);
}

export function buildQuasarDisputeAttestationData(jobId: Uint8Array): Buffer {
  const job = quasarJobIdToU128Bytes(jobId);
  return Buffer.from([QUASAR_DISC.disputeAttestation, ...job]);
}
