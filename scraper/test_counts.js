import fs from 'fs';
import path from 'path';
import { getEgpSessionToken } from './src/capsolver.js';

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

async function testCounts() {
  loadEnvIfAvailable();
  const session = await getEgpSessionToken(process.env.CAPSOLVER_API_KEY);

  const keywords = ['ดับเพลิง', 'ระบบดับเพลิง', 'Fire Alarm', 'เครื่องสูบน้ำดับเพลิง', 'สปริงเกอร์', 'ถังดับเพลิง', 'แจ้งเหตุเพลิงไหม้'];
  const years = ['2569', '2568', ''];

  for (const kw of keywords) {
    console.log(`\n=== Keyword: "${kw}" ===`);
    for (const yr of years) {
      const yrParam = yr ? `&budgetYear=${yr}` : '';
      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement/sumProjectMoneyAndCount?announcementTodayFlag=false${yrParam}&keywordSearch=${encodeURIComponent(kw)}`;
      const res = await fetch(url, {
        headers: {
          'x-announcement-token': session.token,
          'cookie': session.cookies,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'accept': 'application/json, text/plain, */*'
        }
      });
      if (res.ok) {
        const json = await res.json();
        console.log(`  Year [${yr || 'ALL'}]: totalPages=${json.data?.totalPages}, recordsTotal=${json.data?.recordsTotal}`);
      } else {
        console.log(`  Year [${yr || 'ALL'}]: HTTP ${res.status}`);
      }
    }
  }
}

testCounts().catch(console.error);
