import fs from 'fs';
import path from 'path';
import { harvestEGP5 } from './src/harvest-egp5.js';

function loadEnvIfAvailable() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env')
  ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
      break;
    }
  }
}

async function run() {
  loadEnvIfAvailable();
  const D1_API_URL = process.env.D1_API_URL || 'https://gprocurement-fte.natt-charoen.workers.dev';
  const D1_API_KEY = process.env.D1_API_KEY;
  const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;

  console.log('=== FTE REAL PROCUREMENT HARVESTER ===');
  console.log('Target Worker:', D1_API_URL);
  console.log('CapSolver API Key configured:', !!CAPSOLVER_API_KEY);

  // Run harvest with 30 days lookback to capture all current active tenders
  const results = await harvestEGP5(D1_API_URL, D1_API_KEY, {
    maxPages: 5,
    lookbackDays: 30,
    capsolverApiKey: CAPSOLVER_API_KEY
  });

  console.log(`\n🎉 DONE! Successfully harvested and uploaded ${results.length} real e-GP projects!`);
}

run().catch(console.error);
