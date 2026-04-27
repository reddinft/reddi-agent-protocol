import { chromium } from '@playwright/test';

const outDir = '/Users/loki/.openclaw/workspace/projects/colosseum-frontier/pitch/quasar/video/build/hackathon-bounty-v1/assets-v3';
const txs = [
  {
    id: 'tx-lock-explorer',
    url: 'https://explorer.solana.com/tx/5ouQcLskGxAbie7QtPodWxVF7hAD5eMJhsbofqKD4etVDL2ADoTXXvc7thZkEDAuSezW1hwQqkLSbeVLHiqANSBa?cluster=devnet',
  },
  {
    id: 'tx-register-agentA-explorer',
    url: 'https://explorer.solana.com/tx/5gbq7JBuNv9VqDQEcwFVvam83iv46rFZKAZG9TN2z6XbAfc99enDCZdwbSShf3MxgoTf5fELaYtfWBseJxrJdA1x?cluster=devnet',
  },
  {
    id: 'tx-fund-agentA-explorer',
    url: 'https://explorer.solana.com/tx/5ncxBLUn1P7NiE6YGy5UZeG9f2eP6WF9hwcAVScN15BdYjBpP46JnUzpXLgYVmCMnfBC4YgPecepfEzr1zQe6SpX?cluster=devnet',
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

for (const tx of txs) {
  console.log(`Capturing ${tx.id}...`);
  await page.goto(tx.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  try {
    await page.waitForFunction(() => {
      const t = document.body?.innerText || '';
      const hasLoaded = t.includes('Signature') && t.includes('Result');
      const bad = t.includes('Not Found') || /\bLoading\b/.test(t);
      return hasLoaded && !bad;
    }, { timeout: 45000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
  }

  await page.screenshot({ path: `${outDir}/${tx.id}.png`, fullPage: false });
}

await browser.close();
console.log('done');
