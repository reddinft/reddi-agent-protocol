import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://agent-protocol.reddi.tech'
const OUT_DIR = path.join(__dirname, '..', 'public', 'tour')

const SHOTS = [
  { id: '01-landing', url: '/', title: 'Welcome', caption: 'The Reddi Agent Protocol — permissionless AI agent marketplace on Solana', scroll: 0 },
  { id: '02-economics', url: '/', title: 'The Economics', caption: '83.3% to specialists, 16.7% to treasury — only on success. Zero on failure.', scroll: 600 },
  { id: '03-agents', url: '/agents', title: 'Browse Agents', caption: 'Browse registered agents — filter by type, reputation, and per-call rate', scroll: 0 },
  { id: '04-setup', url: '/setup', title: 'Pick Your Template', caption: 'Four specialist templates — click one to pre-fill your system prompt, tools, and skills', scroll: 0 },
  { id: '05-setup-filled', url: '/setup', title: 'Customise Your Agent', caption: 'Every field pre-filled and editable — system prompt, sample tool, skill, seed data', scroll: 350, click: 'Research Specialist' },
  { id: '06-expose', url: '/setup', title: 'Go Live in 60 Seconds', caption: 'ngrok or Cloudflare Tunnel — one command to expose your Ollama to the world', scroll: 700 },
  { id: '07-register', url: '/register', title: 'Register On-Chain', caption: "Connect wallet · Set your rate · Pay 0.01 SOL · You're live", scroll: 0 },
  { id: '08-demo', url: '/demo', title: 'Live Debug Playground', caption: 'Enter any brief — watch the full pipeline fire in real time', scroll: 0 },
  { id: '09-demo-mid', url: '/demo', title: 'Pipeline In Action', caption: 'Planning → discovery → escrow → primary agent → attestation scoring', fill: 'A landing page for a privacy-first AI assistant for developers', wait: 7000 },
  { id: '10-demo-done', url: '/demo', title: 'Pipeline Complete', caption: 'Commit-reveal closed · Escrow settled · Quality score written on-chain', fill: 'A landing page for a web3 productivity tool', wait: 12000 },
  { id: '11-customize', url: '/customize', title: 'Stand Out', caption: 'Prompts, model selection, reputation strategy — everything to differentiate your agent', scroll: 0 },
  { id: '12-dashboard', url: '/dashboard', title: 'Track Your Earnings', caption: 'Earnings, jobs completed, reputation score — all in one place', scroll: 0 },
]

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })

  for (const shot of SHOTS) {
    process.stdout.write(`📸 ${shot.id}...`)
    try {
      await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(600)

      if (shot.click) {
        const el = page.getByText(shot.click).first()
        if (await el.isVisible()) { await el.click(); await page.waitForTimeout(500) }
      }
      if (shot.fill) {
        const ta = page.locator('textarea').first()
        if (await ta.isVisible()) {
          await ta.fill(shot.fill)
          await page.getByRole('button', { name: /generate/i }).click()
          await page.waitForTimeout(shot.wait || 3000)
        }
      }
      if (shot.scroll) {
        await page.evaluate(y => window.scrollTo(0, y), shot.scroll)
        await page.waitForTimeout(300)
      }

      await page.screenshot({ path: path.join(OUT_DIR, `${shot.id}.png`), fullPage: false })
      console.log(' ✅')
    } catch (e) {
      console.log(` ❌ ${e.message}`)
    }
  }

  await browser.close()
  console.log(`\nDone → public/tour/ (${fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).length} screenshots)`)
}

run()
