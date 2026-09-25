import fs from 'fs';
import path from 'path';
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
  if (!projectId) return 'https://process5.gprocurement.go.th/egp-agpc01-web/announcement';
  const cleanId = String(projectId).replace(/-[A-Za-z0-9]+$/, '');
  return `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${encodeURIComponent(cleanId)}`;
}

async function main() {
  loadEnvIfAvailable();
  const D1_API_URL = process.env.D1_API_URL || 'https://gprocurement-fte.natt-charoen.workers.dev';
  const D1_API_KEY = process.env.D1_API_KEY || 'fte-scraper-secure-key-2026';
  const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;

  console.log('===========================================================');
  console.log('🔥 FTE FULL HARVESTER: Active (ถึงวันที่ 25) + Archive (W0)');
  console.log('Worker Target:', D1_API_URL);
  console.log('===========================================================');

  let session = await getEgpSessionToken(CAPSOLVER_API_KEY);
  let sessionTime = Date.now();

  const lookbackDateStr = '2026-08-25'; // 30 days back to today (2026-09-25)
  console.log(`Scanning announcements between ${lookbackDateStr} and 2026-09-25...`);

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
    { kw: 'ป้ายทางออกฉุกเฉิน', group: 'safety_ppe_emergency' }
  ];

  const activeCandidates = new Map();
  const archiveCandidates = new Map();

  for (const item of keywords) {
    let kwCount = 0;
    for (let page = 1; page <= 6; page++) {
      if (Date.now() - sessionTime > 180000) {
        console.log('[e-GP] Renewing session token...');
        session = await getEgpSessionToken(CAPSOLVER_API_KEY);
        sessionTime = Date.now();
      }

      const url = `https://process5.gprocurement.go.th/egp-oann10-service/pb/a-egp-allt-project/announcement?announcementTodayFlag=false&keywordSearch=${encodeURIComponent(item.kw)}&page=${page}`;
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

        for (const r of rows) {
          if (!r.projectId) continue;
          let annDate = r.announceDate;
          if (annDate && annDate.includes('T')) annDate = annDate.split('T')[0];

          if (annDate && annDate < lookbackDateStr) {
            continue;
          }

          const aType = r.announceType || 'D0';
          const title = r.projectName || '';

          // Drop cancellations and hard noise
          if (title.includes('ยกเลิก')) continue;
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

          const budgetVal = r.projectMoney || r.priceBuild || 0;
          const directUrl = getDirectProcurementUrl(r.projectId);
          const provinceName = extractProvince(r.deptName, title, r.rdbProvinceMoiName);

          const isWinner = ['W0', 'W1', 'W2', 'W3'].includes(aType) || 
                          (r.flowName && (r.flowName.includes('ผู้ชนะ') || r.flowName.includes('จัดทำสัญญา')));

          if (isWinner) {
            // Archive / Winner announcement
            const winnerPrice = r.priceBuild || r.projectMoney || 0;
            let discount = 0;
            if (budgetVal > 0 && winnerPrice > 0 && budgetVal > winnerPrice) {
              discount = Math.round(((budgetVal - winnerPrice) / budgetVal) * 10000) / 100;
            }

            const winnerRecord = {
              id: `${r.projectId}-W0`,
              project_id: r.projectId,
              project_name: title,
              title: title,
              announce_type: 'W0',
              announceDate: annDate,
              announce_date: annDate,
              budget: budgetVal,
              department: r.deptName || 'หน่วยงานภาครัฐ',
              province: provinceName,
              product_group: item.group,
              url: directUrl,
              winner_name: r.winnerName || 'ประกาศผู้ชนะการเสนอราคา',
              winner_price: winnerPrice,
              discount_percent: discount,
              doc_start_date: annDate,
              doc_verified: 1,
              boq_summary: `ผลการเคาะราคาผู้ชนะ หมวด ${item.kw}`
            };

            archiveCandidates.set(r.projectId, winnerRecord);
            kwCount++;
          } else {
            // Active opportunity
            if (!activeCandidates.has(r.projectId)) {
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
        }
      } catch (err) {
        console.log(`  Err on ${item.kw} p.${page}:`, err.message);
      }
    }
    console.log(`  - "${item.kw}": found total items so far (Active: ${activeCandidates.size}, Archive: ${archiveCandidates.size})`);
  }

  console.log('\n=== HARVEST COMPLETE ===');
  console.log(`Total Active Candidates (Opportunities): ${activeCandidates.size}`);
  console.log(`Total Archive Candidates (Winners W0):   ${archiveCandidates.size}`);

  const allToUpload = [
    ...Array.from(activeCandidates.values()),
    ...Array.from(archiveCandidates.values())
  ];

  console.log(`\nUploading ${allToUpload.length} items to D1...`);
  const uploadResult = await uploadToD1(allToUpload, D1_API_URL, D1_API_KEY);
  console.log('Upload Result:', uploadResult);

  // Check September 25 items
  const sep25Active = Array.from(activeCandidates.values()).filter(x => x.announce_date >= '2026-09-25');
  const sep25Archive = Array.from(archiveCandidates.values()).filter(x => x.announce_date >= '2026-09-25');
  console.log(`\n📅 โครงการวันที่ 25 ก.ย. 2569:`);
  console.log(`   - โอกาสงานใหม่ (Active): ${sep25Active.length} โครงการ`);
  console.log(`   - คลังเคาะแล้ว (Archive): ${sep25Archive.length} โครงการ`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
