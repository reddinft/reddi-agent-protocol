export function estimateSyllables(word: string): number {
  const cleaned = word
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");

  if (!cleaned) return 0;
  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches?.length ?? 1);
}

export function countLineSyllables(line: string): number {
  return line
    .split(/\s+/)
    .map((w) => estimateSyllables(w))
    .reduce((a, b) => a + b, 0);
}

export function isHaiku(lines: string[]) {
  if (!Array.isArray(lines) || lines.length !== 3) {
    return { ok: false, syllables: [] as number[], reason: "Haiku must be exactly 3 lines." };
  }

  const normalized = lines.map((l) => l.trim()).filter(Boolean);
  if (normalized.length !== 3) {
    return { ok: false, syllables: [] as number[], reason: "Haiku lines cannot be empty." };
  }

  const syllables = normalized.map(countLineSyllables);
  const ok = syllables[0] === 5 && syllables[1] === 7 && syllables[2] === 5;

  return {
    ok,
    syllables,
    reason: ok ? undefined : `Expected 5/7/5, got ${syllables.join("/")}.`,
  };
}

