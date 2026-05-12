#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const INCLUDE_EXTENSIONS = new Set([".md", ".mdx", ".ts", ".tsx", ".mjs", ".js", ".json", ".feature", ".sh"]);
const EXCLUDED_DIRS = new Set([".git", ".next", "node_modules", "artifacts", "coverage", "dist", "build"]);

const bannedPatterns = [
  /\bReddi is\b/g,
  /\bReddi as\b/g,
  /\bReddi turns\b/g,
  /\bReddi gives\b/g,
  /\bReddi lets\b/g,
  /\bReddi can\b/g,
  /\bReddi handles\b/g,
  /\bReddi provides\b/g,
  /\bReddi converts\b/g,
  /\bReddi exposes\b/g,
  /\bReddi remains\b/g,
  /\bReddi marketplace\b/g,
  /\bReddi protocol\b/g,
  /\bReddi product\b/g,
  /\bReddi app\b/g,
  /\bReddi web\b/g,
  /\bReddi API\b/g,
  /\bReddi endpoint\b/g,
  /\bReddi gateway\b/g,
  /\bReddi provider\b/g,
  /\bReddi agent\b/g,
  /\bReddi agents\b/g,
  /\bReddi specialist\b/g,
  /\bReddi specialists\b/g,
  /\bReddi consumer\b/g,
  /\bReddi consumers\b/g,
  /\bReddi attestor\b/g,
  /\bReddi attestors\b/g,
  /\bReddi trust\b/g,
  /\bReddi payment\b/g,
  /\bReddi reputation\b/g,
  /\bReddi evidence\b/g,
  /\bReddi workflow\b/g,
  /\bReddi capability\b/g,
  /\bReddi task\b/g,
  /\bReddi attestation\b/g,
  /\bReddi-attested\b/g,
  /\bReddi x402\b/g,
  /\bReddi’s\b/g,
  /\bReddi's\b/g,
];

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] ?? "";
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
    } else if (INCLUDE_EXTENSIONS.has(extension(path))) {
      files.push(path);
    }
  }
  return files;
}

const findings = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  for (const pattern of bannedPatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(0, match.index);
      const line = before.split("\n").length;
      findings.push(`${rel}:${line}: ${match[0]}`);
    }
  }
}

if (findings.length > 0) {
  console.error("RAP naming guard failed. Use 'Reddi Agent Protocol' or 'RAP', not standalone 'Reddi' as the protocol name.");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("[rap-naming] OK: no banned standalone protocol shorthand found");
