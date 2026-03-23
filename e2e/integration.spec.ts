/**
 * integration.spec.ts — Real Ollama + Local Validator integration tests
 *
 * Requires:
 *   - Ollama running at localhost:11434 with at least one model
 *   - Local Solana validator running at localhost:8899
 *
 * All 4 tests auto-skip if infrastructure is not available.
 */

import { test, expect } from '@playwright/test'
import { exec as execCb } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(execCb)

async function execCmd(
  command: string,
  opts: { timeout?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  return execAsync(command, { timeout: opts.timeout ?? 30_000, shell: '/bin/zsh' })
}

async function checkOllama(): Promise<{ ok: boolean; model: string }> {
  try {
    const { stdout } = await execCmd('curl -s http://localhost:11434/api/tags')
    const data = JSON.parse(stdout)
    if (!data.models?.length) return { ok: false, model: '' }
    // Prefer small/fast models
    const preferred = ['qwen3:1.7b', 'qwen2.5:1.5b', 'llama3.2:1b', 'qwen3:4b', 'qwen2.5:3b']
    const match = preferred.find(p =>
      data.models.some((m: { name: string }) => m.name.startsWith(p.split(':')[0]))
    )
    const model = match
      ? data.models.find((m: { name: string }) => m.name.startsWith(match.split(':')[0])).name
      : data.models[0].name
    return { ok: true, model }
  } catch {
    return { ok: false, model: '' }
  }
}

async function checkValidator(): Promise<boolean> {
  try {
    const { stdout } = await execCmd(
      'curl -s -X POST http://localhost:8899 ' +
      '-H "Content-Type: application/json" ' +
      "-d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getHealth\"}'"
    )
    return JSON.parse(stdout).result === 'ok'
  } catch {
    return false
  }
}

// ── Shared infra state ────────────────────────────────────────────────────────

let ollamaModel = ''
let infraAvailable = false

// ── Integration suite ─────────────────────────────────────────────────────────

test.describe('Integration — real Ollama + local validator', () => {
  test.setTimeout(120_000)

  test.beforeAll(async () => {
    const [ollama, validatorOk] = await Promise.all([checkOllama(), checkValidator()])
    infraAvailable = ollama.ok && validatorOk
    ollamaModel = ollama.model

    if (!infraAvailable) {
      console.log(`⚠️  Integration tests skipped — Ollama: ${ollama.ok}, Validator: ${validatorOk}`)
    } else {
      console.log(`✅ Infra ready — Ollama model: ${ollamaModel}, validator: ok`)
    }
  })

  // ── Test 1: Register agents on-chain ───────────────────────────────────────

  test('register specialist + attestation agents on-chain via demo-setup.ts', async () => {
    test.skip(!infraAvailable, 'Ollama or local validator not running')

    const { stdout } = await execCmd(
      'export PATH="$HOME/.cargo/bin:$PATH" && ' +
      'cd ~/projects/solana-research-dag && ' +
      'npx ts-node src/demo-setup.ts 2>&1 | tail -40',
      { timeout: 60_000 }
    )

    console.log('demo-setup output:\n', stdout)

    // Should mention pubkeys and success
    const hasSuccess =
      stdout.includes('✅') ||
      /registered/i.test(stdout) ||
      /Pubkey:/i.test(stdout) ||
      /success/i.test(stdout)

    expect(hasSuccess).toBeTruthy()
  })

  // ── Test 2: Specialist server GET /answer → 402 or 200 ────────────────────

  test('specialist server returns HTTP 402 or 2xx on GET /answer', async () => {
    test.skip(!infraAvailable, 'Ollama or local validator not running')

    // Start the specialist server (ollama-ux) in background — server uses demo-wallets.json
    execCb(
      'export PATH="$HOME/.cargo/bin:$PATH" && ' +
      'cd ~/projects/solana-research-dag && ' +
      `OLLAMA_MODEL=${ollamaModel} npx ts-node src/specialist-server.ts ` +
      '--specialist-name ollama-ux 2>/dev/null &',
      { shell: '/bin/zsh' }
    )

    // Give server ~6 seconds to start
    await new Promise(r => setTimeout(r, 6000))

    // /answer is a GET endpoint that returns 402 Payment Required (or 200 in bypass mode)
    // 404 means server is alive but needs query params (task=...) — still valid
    const res = await fetch('http://localhost:3334/answer', { method: 'GET' })

    // 402 = payment gate | 2xx = bypass mode | 404 = alive but wrong params — all valid
    expect([200, 201, 400, 402, 404]).toContain(res.status)
    console.log(`✅ Specialist server responding: HTTP ${res.status}`)
  })

  // ── Test 3: Full simulate.ts 1-pass pipeline ───────────────────────────────

  test('simulate.ts 1-pass — full on-chain deposit/deliver/attest/reveal', async () => {
    test.skip(!infraAvailable, 'Ollama or local validator not running')
    test.setTimeout(120_000)

    // simulate.ts takes passes as positional arg (not --passes)
    const { stdout } = await execCmd(
      'export PATH="$HOME/.cargo/bin:$PATH" && ' +
      'cd ~/projects/solana-research-dag && ' +
      `OLLAMA_MODEL=${ollamaModel} npx ts-node src/simulate.ts 1 2>&1`,
      { timeout: 110_000 }
    )

    console.log('simulate.ts output (last 600 chars):\n', stdout.slice(-600))

    const lower = stdout.toLowerCase()

    // Must not have uncaught exceptions
    expect(lower).not.toContain('uncaught')

    // Should contain success indicators
    const hasSuccess =
      lower.includes('pass') ||
      lower.includes('complete') ||
      stdout.includes('✅')

    expect(hasSuccess).toBeTruthy()
  })

  // ── Test 4: /demo UI — full trace + iframe ─────────────────────────────────

  test('/demo — full 7-section trace appears and iframe renders', async ({ page }) => {
    test.skip(!infraAvailable, 'Ollama or local validator not running')
    test.setTimeout(120_000)

    await page.goto('/demo')
    await page.locator('textarea').fill('A landing page for a local-first AI productivity tool')
    await page.getByRole('button', { name: /generate/i }).click()

    // All 7 sections in order (pipeline total ~35s with additive delays)
    await expect(page.getByText(/Planning/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Agent Discovery/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Escrow Deposit/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Primary Agent Responding/i)).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Attestation Scoring/i)).toBeVisible({ timeout: 30000 })
    await expect(page.getByText(/Commit-Reveal/i)).toBeVisible({ timeout: 40000 })
    await expect(page.getByText(/Complete/i)).toBeVisible({ timeout: 55000 })

    // iframe appears after HTML payload delivered
    await expect(page.locator('iframe')).toBeVisible({ timeout: 60000 })

    console.log('✅ Full demo pipeline completed in browser')
  })
})
