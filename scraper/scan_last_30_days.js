import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';
import { getEgpSessionToken } from './src/capsolver.js';
import { extractProvince } from './src/province-extractor.js';
import { uploadToD1 } from './src/d1-uploader.js';

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

function getDirectProcurementUrl(projectId) {
  if (!projectId) return '';
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify({ projectId: String(projectId) }), 'RDCrypto').toString();
  return `https://process5.gprocurement.go.th/egp-agpc01-web/announcement/procurement/${encodeURIComponent(encrypted)}`;
}

async function scanAndUpload() {
  loadEnvIfAvailable();
  const D1_API_URL = process.env.D1_API_URL || 'https://gprocurement-fte.natt-charoen.workers.dev';
  const D1_API_KEY = process.env.D1_API_KEY;
  const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;

  console.log('=== FTE PRECISION 30-DAY HARVESTER & D1 SYNC ===');
  console.log('Worker Target:', D1_API_URL);
  console.log('Resolving e-GP session via CapSolver...');

  let session = await getEgpSessionToken(CAPSOLVER_API_KEY);
  let sessionTime = Date.now();

  const lookbackDateStr = '2026-08-25'; // Strictly last 30 days
  console.log(`Scanning strictly Year 2569, announceDate >= ${lookbackDateStr}...`);

  const keywords = [
    { kw: 'แจ้งเหตุเพลิงไหม้', group: 'fire_alarm' },
    { kw: 'Fire Alarm', group: 'fire_alarm' },
    { kw: 'เตือนอัคคีภัย', group: 'fire_alarm' },
    { kw: 'ตรวจจับควัน', group: 'fire_alarm' },
    { kw: 'ตรวจจับความร้อน', group: 'fire_alarm' },
    { kw: 'smoke detector', group: 'fire_alarm' },
    { kw: 'เครื่องสูบน้ำดับเพลิง', group: 'fire_sprinkler_pump' },
    { kw: 'ปั๊มดับเพลิง', group: 'fire_sprinkler_pump' },
    { kw: 'สปริงเกอร์', group: 'fire_sprinkler_pump' },
    { kw: 'สปริงเกลอร์', group: 'fire_sprinkler_pump' },
    { kw: 'หัวกระจายน้ำดับเพลิง', group: 'fire_sprinkler_pump' },
    { kw: 'ระบบดับเพลิง', group: 'fire_sprinkler_pump' },
    { kw: 'สารสะอาด', group: 'fire_suppression_gas' },
    { kw: 'Clean Agent', group: 'fire_suppression_gas' },
    { kw: 'FM-200', group: 'fire_suppression_gas' },
    { kw: 'Novec', group: 'fire_suppression_gas' },
    { kw: 'ถังดับเพลิง', group: 'fire_suppression_gas' },
    { kw: 'เครื่องดับเพลิง', group: 'fire_suppression_gas' },
    { kw: 'ก๊าซดับเพลิง', group: 'fire_suppression_gas' },
    { kw: 'ตู้สายฉีดน้ำดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'ตู้ดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'สายส่งน้ำดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'หัวรับน้ำดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'ท่อดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'วาล์วดับเพลิง', group: 'fire_hydrant_equipment' },
    { kw: 'ไฟฉุกเฉิน', group: 'safety_ppe_emergency' },
    { kw: 'โคมไฟฉุกเฉิน', group: 'safety_ppe_emergency' },
    { kw: 'ป้ายทางหนีไฟ', group: 'safety_ppe_emergency' },
    { kw: 'ป้ายทางออกฉุกเฉิน', group: 'safety_ppe_emergency' }
  ];

  const activeCandidates = new Map();

  for (const item of keywords) {
    let kwCount = 0;
    for (let page = 1; page <= 6; page++) {
      if (Date.now() - sessionTime > 180000) {
        console.log('[e-GP] Renewing session token...');
        session = await getEgpSessionToken(CAPSOLVER_API_KEY);
        sessionTime = Date.now();
      }

      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&budgetYear=2569&keywordSearch=${encodeURIComponent(item.kw)}&page=${page}`;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'x-announcement-token': session.token,
            'cookie': session.cookies,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'referer': 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement',
            'noDataProfile': 'noDataProfile',
            'accept': 'application/json, text/plain, */*'
          }
        });

        if (!res.ok) {
          console.log(`  [HTTP ${res.status}] on ${item.kw} p.${page}`);
          if (res.status === 429) {
            console.log('  Waiting 15s for rate limit cooldown...');
            await new Promise(r => setTimeout(r, 15000));
            session = await getEgpSessionToken(CAPSOLVER_API_KEY);
            sessionTime = Date.now();
          }
          break;
        }

        const json = await res.json();
        const rows = Array.isArray(json.data) ? json.data : (json.data?.data || []);
        if (rows.length === 0) break;

        let olderCount = 0;
        for (const r of rows) {
          if (!r.projectId) continue;
          let annDate = r.announceDate;
          if (annDate && annDate.includes('T')) annDate = annDate.split('T')[0];

          if (annDate && annDate < lookbackDateStr) {
            olderCount++;
            continue;
          }

          const aType = r.announceType || 'D0';
          const title = r.projectName || '';

          // Drop winners and cancellations
          if (['W0', 'W1', 'W2', 'W3'].includes(aType) || title.includes('ยกเลิก')) {
            continue;
          }

          // Drop non-target noise
          const lower = title.toLowerCase();
          if (
            lower.includes('อาหารกลางวัน') || 
            lower.includes('จัดเก็บขยะ') || 
            lower.includes('รถบรรทุก') || 
            lower.includes('แม่บ้าน') || 
            lower.includes('รปภ') ||
            lower.includes('ยางมะตอย') ||
            lower.includes('ถนนลาดยาง')
          ) {
            continue;
          }

          if (!activeCandidates.has(r.projectId)) {
            const budgetVal = r.projectMoney || r.priceBuild || 0;
            const directUrl = getDirectProcurementUrl(r.projectId);
            const provinceName = extractProvince(r.deptName, title, r.rdbProvinceMoiName);

            activeCandidates.set(r.projectId, {
              id: `${r.projectId}-${aType}`,
              project_id: r.projectId,
              project_name: title,
              title: title,
              announce_type: aType,
              announceDate: annDate,
              announce_date: annDate,
              budget: budgetVal,
              department: r.deptName || 'หน่วยงานภาครัฐ',
              province: provinceName,
              product_group: item.group,
              url: directUrl,
              doc_start_date: annDate,
              doc_verified: 1,
              boq_summary: `ตรวจพบงานระบบดับเพลิงและกู้ภัย FTE (${item.kw})`,
              boq_matches: JSON.stringify([{ keyword: item.kw, page: 1, snippet: title.slice(0, 100) }])
            });
            kwCount++;
          }
        }

        // If entire page was older than lookback window, stop this keyword
        if (olderCount === rows.length) break;

      } catch (err) {
        console.warn(`  Fetch error: ${err.message}`);
        break;
      }

      await new Promise(r => setTimeout(r, 650));
    }
    console.log(`"${item.kw}": +${kwCount} active projects (Total so far: ${activeCandidates.size})`);
  }

  const projectsToUpload = Array.from(activeCandidates.values());

  console.log(`\n======================================================`);
  console.log(`🏆 FOUND ${projectsToUpload.length} ACTIVE PROJECTS IN LAST 30 DAYS (YEAR 2569)`);
  console.log(`======================================================`);

  // Breakdown statistics
  const budgetStats = {
    under50M: 0,
    m50to100: 0,
    m100to500: 0,
    m500to1000: 0,
    over1000M: 0
  };

  const groupStats = {};

  for (const p of projectsToUpload) {
    const b = p.budget || 0;
    if (b < 50000000) budgetStats.under50M++;
    else if (b < 100000000) budgetStats.m50to100++;
    else if (b < 500000000) budgetStats.m100to500++;
    else if (b < 1000000000) budgetStats.m500to1000++;
    else budgetStats.over1000M++;

    groupStats[p.product_group] = (groupStats[p.product_group] || 0) + 1;
  }

  console.log('Budget Breakdown:');
  console.log('  < 50M:', budgetStats.under50M);
  console.log('  50 - 100M:', budgetStats.m50to100);
  console.log('  100 - 500M:', budgetStats.m100to500);
  console.log('  500 - 1000M:', budgetStats.m500to1000);
  console.log('  > 1000M:', budgetStats.over1000M);

  console.log('\nProduct Groups Breakdown:', groupStats);

  console.log(`\n🚀 Uploading all ${projectsToUpload.length} projects to D1 (${D1_API_URL})...`);
  const uploadResult = await uploadToD1(projectsToUpload, D1_API_URL, D1_API_KEY);
  console.log(`\n✅ UPLOAD COMPLETED: ${uploadResult.inserted} inserted, ${uploadResult.errors} errors.`);
}

scanAndUpload().catch(console.error);
