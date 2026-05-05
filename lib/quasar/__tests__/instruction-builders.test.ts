import {
  buildQuasarAttestQualityData,
  buildQuasarCommitRatingData,
  buildQuasarConfirmAttestationData,
  buildQuasarDeregisterAgentData,
  buildQuasarDisputeAttestationData,
  buildQuasarExpireRatingData,
  buildQuasarRegisterData,
  buildQuasarRevealRatingData,
  buildQuasarUpdateAgentData,
} from "@/lib/quasar/instruction-builders";
import { IX } from "@/lib/program";

describe("Quasar instruction-data builders", () => {
  const jobId = Uint8Array.from(Array.from({ length: 16 }, (_, i) => i + 1));
  const commitment = Uint8Array.from(Array.from({ length: 32 }, (_, i) => 100 + i));
  const consumer = Uint8Array.from(Array.from({ length: 32 }, (_, i) => 10 + i));
  const specialist = Uint8Array.from(Array.from({ length: 32 }, (_, i) => 50 + i));
  const salt = Uint8Array.from(Array.from({ length: 32 }, (_, i) => 200 - i));

  it("builds registry data with one-byte Quasar discriminators, not Anchor discriminators", () => {
    const register = buildQuasarRegisterData(2, "qwen3:8b", 1_000_000n, 3);
    expect(register.length).toBe(76);
    expect(register[0]).toBe(0);
    expect(register.subarray(0, 8).equals(IX.register_agent)).toBe(false);
    expect(register[1]).toBe(2);
    expect(register[2]).toBe("qwen3:8b".length);
    expect(register.subarray(3, 11).toString("utf8")).toBe("qwen3:8b");
    expect(register.readBigUInt64LE(67)).toBe(1_000_000n);
    expect(register[75]).toBe(3);

    const update = buildQuasarUpdateAgentData(2_000_000n, 4, false);
    expect([...update]).toEqual([1, 0x80, 0x84, 0x1e, 0, 0, 0, 0, 0, 4, 0]);
    expect([...buildQuasarDeregisterAgentData()]).toEqual([2]);
  });

  it("builds reputation data using u128 little-endian job ids", () => {
    const commit = buildQuasarCommitRatingData(jobId, commitment, 1, consumer, specialist);
    expect(commit.length).toBe(114);
    expect(commit[0]).toBe(1);
    expect([...commit.subarray(1, 17)]).toEqual([...jobId]);
    expect([...commit.subarray(17, 49)]).toEqual([...commitment]);
    expect(commit[49]).toBe(1);
    expect([...commit.subarray(50, 82)]).toEqual([...consumer]);
    expect([...commit.subarray(82, 114)]).toEqual([...specialist]);

    const reveal = buildQuasarRevealRatingData(jobId, 9, salt);
    expect(reveal.length).toBe(50);
    expect(reveal[0]).toBe(2);
    expect([...reveal.subarray(1, 17)]).toEqual([...jobId]);
    expect(reveal[17]).toBe(9);
    expect([...reveal.subarray(18, 50)]).toEqual([...salt]);

    expect([...buildQuasarExpireRatingData(jobId)]).toEqual([3, ...jobId]);
  });

  it("builds attestation data using Quasar sentinel-compatible scores", () => {
    const scores = Uint8Array.from([8, 9, 10, 7, 6]);
    const attest = buildQuasarAttestQualityData(jobId, scores, consumer);
    expect(attest.length).toBe(54);
    expect(attest[0]).toBe(1);
    expect([...attest.subarray(1, 17)]).toEqual([...jobId]);
    expect([...attest.subarray(17, 22)]).toEqual([...scores]);
    expect([...attest.subarray(22, 54)]).toEqual([...consumer]);

    expect([...buildQuasarConfirmAttestationData(jobId)]).toEqual([2, ...jobId]);
    expect([...buildQuasarDisputeAttestationData(jobId)]).toEqual([3, ...jobId]);
  });

  it("rejects invalid fixed-size Quasar inputs before transaction construction", () => {
    expect(() => buildQuasarRegisterData(0, "x".repeat(65), 1n, 0)).toThrow("model_too_long");
    expect(() => buildQuasarCommitRatingData(jobId.slice(0, 15), commitment, 0, consumer, specialist)).toThrow("job_id_must_be_16_bytes");
    expect(() => buildQuasarRevealRatingData(jobId, 0, salt)).toThrow("invalid_score");
    expect(() => buildQuasarAttestQualityData(jobId, Uint8Array.from([1, 2, 0, 4, 5]), consumer)).toThrow("invalid_attestation_score");
  });
});
