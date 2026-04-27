import { chromium } from '@playwright/test';

const outDir = '/Users/loki/.openclaw/workspace/projects/colosseum-frontier/pitch/quasar/video/build/hackathon-bounty-v1/assets-v3';
const txs = [
  {
    id: 'tx-per-explorer',
    url: 'https://explorer.solana.com/tx/3BHVmx66RMPHN3iPGrjz2KAm6UTc6o5bNWxajN3TDSaHPeVQisXd2JMBmVF2y8ph9staS4Nm4EE5cdKSK3jAPtzm?cluster=devnet',
  },
  {
    id: 'tx-lock-explorer',
    url: 'https://explorer.solana.com/tx/5ouQcLskGxAbie7QtPodWxVF7hAD5eMJhsbofqKD4etVDL2ADoTXXvc7thZkEDAuSezW1hwQqkLSbeVLHiqANSBa?cluster=devnet',
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

for (const tx of txs) {
  console.log(`Capturing ${tx.id}...`);
  await page.goto(tx.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  try {
    await page.waitForFunction(() => {
      const t = document.body?.innerText || '';
      return t.includes('Signature') && !/\bLoading\b/.test(t);
    }, { timeout: 45000 });
  } catch {
    // fallback: reload once and give more time
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
  }

  await page.screenshot({ path: `${outDir}/${tx.id}.png`, fullPage: false });
}

await browser.close();
console.log('done');
