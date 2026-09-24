import { Hono } from 'hono';

const router = new Hono();

const BASE_EXCLUSIONS = [
  'announce_type IN ("P0", "B0", "B1", "B2", "B3", "15", "D0", "D1", "IM", "BOQ")',
  '(winner_name IS NULL OR winner_name = "")',
  'project_name NOT LIKE "%ยกเลิก%"',
  'project_id IS NOT NULL',
  '(project_id LIKE "69%" OR project_id LIKE "68%")',
  'budget IS NOT NULL AND budget > 0',
  'id NOT IN (SELECT announcement_id FROM project_feedback WHERE is_match = 0 GROUP BY announcement_id HAVING COUNT(DISTINCT user_id) >= 5)',
  // Strict Exclusion: Any project_id where ANY stage has been contracted, bidded, or won
  'project_id NOT IN (SELECT project_id FROM announcements WHERE winner_name IS NOT NULL AND winner_name != "")',
  // Deduplication: If tender announcement (D0/D1/IM) exists, suppress obsolete earlier stages (15/BOQ/B0)
  'NOT (announce_type IN ("15", "BOQ", "B0", "B1", "B2", "B3") AND project_id IN (SELECT project_id FROM announcements WHERE announce_type IN ("D0", "D1", "IM")))'
];

// Post-query exclusion keywords (applied in JS to avoid D1 LIKE pattern complexity limit)
export const POST_EXCLUSIONS = [
  'ทางหลวง', 'ผิวทาง', 'ป้ายจราจร', 'ป้ายแขวนสูง', 'ป้ายประชาสัมพันธ์', 'สะพานลอย', 'การ์ดเรล',
  'ปรับระดับผิวทาง', 'ปรับปรุงถนน', 'ถนนสาย', 'ถนนลาดยาง', 'แอสฟัลท์', 'ลาดยาง', 'ตีเส้นจราจร',
  'ถมดิน', 'กำแพงกันดิน', 'คูระบายน้ำ',
  'จ้างเหมาบริการ', 'จ้างดูแลรักษาความสะอาด', 'ทำความสะอาดทั่วไป', 'รักษาความปลอดภัย', 'รปภ', 'แม่บ้าน', 'จัดเก็บขยะ', 'จัดซื้อที่ดิน',
  'ปรับปรุงห้องน้ำ', 'อาหาร', 'อาหารกลางวัน', 'น้ำดื่ม', 'ยาเวชภัณฑ์', 'ถุงมือตรวจโรค', 'ถุงมือแพทย์', 'เตียงผู้ป่วย',
  'เทศกาล', 'การแข่งขันกีฬา', 'จัดงาน', 'มหกรรม', 'จัดกิจกรรม', 'นำเที่ยว', 'ส่งเสริมการท่องเที่ยว',
  'festival', 'organizer', 'สัมมนา', 'อบรมทั่วไป', 'ฝึกหลักสูตร',
  'เสื้อกีฬา', 'ชุดกีฬา', 'ถ้วยรางวัล', 'เหรียญรางวัล', 'อุปกรณ์กีฬา',
  'จ้างออกแบบ', 'จ้างควบคุมงานก่อสร้างทั่วไป'
];

export function isExcludedRow(row) {
  const name = (row.project_name || '').toLowerCase();
  
  // 1. If explicitly cancelled, exclude
  if (name.includes('ยกเลิก')) return true;

  // 1.1 If verified by AI In-Memory BOQ Scanner, KEEP IT!
  if (row.doc_verified === 1 || row.boq_summary) return false;

  // 2. High-value FTE Fire Protection & Safety keywords:
  const isCoreBusiness = [
    'แจ้งเหตุเพลิงไหม้', 'fire alarm', 'เตือนอัคคีภัย', 'facp', 'ตรวจจับควัน', 'ตรวจจับความร้อน',
    'สปริงเกอร์', 'สปริงเกลอร์', 'sprinkler', 'หัวกระจายน้ำดับเพลิง', 'ปั๊มดับเพลิง', 'เครื่องสูบน้ำดับเพลิง',
    'fire pump', 'jockey pump', 'สารสะอาดดับเพลิง', 'สารสะอาด', 'clean agent', 'fm-200', 'novec',
    'inergen', 'ก๊าซดับเพลิง', 'co2 ดับเพลิง', 'ดับเพลิงห้องครัว', 'kitchen hood', 'water mist',
    'ระบบโฟมดับเพลิง', 'ถังดับเพลิง', 'เครื่องดับเพลิง', 'ตู้สายฉีดน้ำดับเพลิง', 'ตู้ดับเพลิง',
    'fire hose', 'หัวรับน้ำดับเพลิง', 'หัวดับเพลิง', 'siamese', 'วาล์วดับเพลิง', 'nibco', 'ท่อดับเพลิง',
    'ไฟฉุกเฉิน', 'emergency light', 'ป้ายทางหนีไฟ', 'ป้ายทางออกฉุกเฉิน', 'exit sign', 'max bright',
    'ตู้เก็บสารเคมี', 'flammable cabinet', 'อ่างล้างตาฉุกเฉิน', 'ชุดดับเพลิง', 'ชุดผจญเพลิง', 'scba',
    'ปรับปรุงระบบดับเพลิง', 'ติดตั้งระบบดับเพลิง', 'บำรุงรักษาระบบดับเพลิง', 'ระบบดับเพลิง', 'ป้องกันอัคคีภัย'
  ].some(k => name.includes(k));

  if (isCoreBusiness) {
    const hardExcludes = ['ถนนลาดยาง', 'ปรับปรุงถนน', 'สะพานลอย', 'จัดเก็บขยะ', 'อาหารกลางวัน', 'เทศกาล', 'จ้างออกแบบอาคาร'];
    return hardExcludes.some(kw => name.includes(kw));
  }

  return POST_EXCLUSIONS.some(kw => name.includes(kw.toLowerCase()));
}

export const REGION_MAP = {
  'bkk': ['กรุงเทพมหานคร'],
  'central': ['นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'สระบุรี', 'นครนายก', 'ลพบุรี', 'สิงห์บุรี', 'อ่างทอง', 'ชัยนาท', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'นครปฐม', 'สุพรรณบุรี'],
  'east': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว'],
  'north': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
  'northeast': ['นครราชสีมา', 'ขอนแก่น', 'อุดรธานี', 'อุบลราชธานี', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ชัยภูมิ', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'ยโสธร', 'อำนาจเจริญ', 'หนองคาย', 'เลย', 'หนองบัวลำภู', 'บึงกาฬ'],
  'west': ['กาญจนบุรี', 'ตาก', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'],
  'south': ['ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'กระบี่', 'พังงา', 'ภูเก็ต', 'ตรัง', 'พัทลุง', 'สงขลา', 'สตูล', 'ปัตตานี', 'ยะลา', 'นราธิวาส']
};

REGION_MAP['กทม'] = REGION_MAP['bkk'];
REGION_MAP['ภาคกลาง'] = REGION_MAP['central'];
REGION_MAP['ภาคตะวันออก'] = REGION_MAP['east'];
REGION_MAP['ภาคเหนือ'] = REGION_MAP['north'];
REGION_MAP['ภาคอีสาน'] = REGION_MAP['northeast'];
REGION_MAP['ภาคตะวันตก'] = REGION_MAP['west'];
REGION_MAP['ภาคใต้'] = REGION_MAP['south'];

router.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const type = c.req.query('type');
    const group = c.req.query('group');
    const search = c.req.query('search');
    const budget_min = c.req.query('budget_min');
    const budget_max = c.req.query('budget_max');
    const region = c.req.query('region');
    
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const status = c.req.query('status');
    let conditions = [];
    if (status === 'archive') {
      conditions = [
        '(winner_name IS NOT NULL AND winner_name != "")',
        'project_id IS NOT NULL',
        '(project_id LIKE "69%" OR project_id LIKE "68%")',
        'budget IS NOT NULL AND budget > 0'
      ];
    } else {
      conditions = [...BASE_EXCLUSIONS];
    }
    let params = [];

    if (type) {
      const rawTypes = type.split(',');
      const expandedTypes = new Set(rawTypes);
      if (rawTypes.includes('D0')) {
        expandedTypes.add('D1');
        expandedTypes.add('IM');
      }
      if (rawTypes.includes('B0')) {
        expandedTypes.add('B1');
        expandedTypes.add('B2');
        expandedTypes.add('B3');
      }
      if (rawTypes.includes('15')) {
        expandedTypes.add('BOQ');
      }
      const types = Array.from(expandedTypes);
      conditions.push(`announce_type IN (${types.map(() => '?').join(',')})`);
      params.push(...types);
    }
    if (group) {
      const groups = group.split(',');
      conditions.push(`product_group IN (${groups.map(() => '?').join(',')})`);
      params.push(...groups);
    }
    const province = c.req.query('province');
    if (province) {
      conditions.push(`province = ?`);
      params.push(province);
    }
    const boq_only = c.req.query('boq_only') || c.req.query('doc_verified');
    if (boq_only === '1' || boq_only === 'true') {
      conditions.push(`(doc_verified = 1 OR (boq_summary IS NOT NULL AND boq_summary != ''))`);
    }
    if (region) {
      const rKey = region.toLowerCase();
      const provs = REGION_MAP[rKey];
      if (provs && provs.length > 0) {
        const expandedProvs = provs.flatMap(p => [p, `จังหวัด${p}`, `จ.${p}`, `จ. ${p}`]);
        conditions.push(`province IN (${expandedProvs.map(() => '?').join(',')})`);
        params.push(...expandedProvs);
      }
    }
    if (search) {
      conditions.push(`(project_name LIKE ? OR department LIKE ? OR province LIKE ? OR project_id LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (budget_min) {
      conditions.push(`budget >= ?`);
      params.push(Number(budget_min));
    }
    if (budget_max) {
      conditions.push(`budget <= ?`);
      params.push(Number(budget_max));
    }
    // If neither budget_min nor budget_max specified, cap at 50,000,000 (User requirement: เกินกว่านี้ไม่ต้องหา)
    if (!budget_max) {
      conditions.push(`(budget <= 50000000 OR budget IS NULL)`);
    }
    const date = c.req.query('date');
    const date_start = c.req.query('date_start');
    const date_end = c.req.query('date_end');

    if (date) {
      conditions.push(`date(announce_date) = date(?)`);
      params.push(date);
    } else {
      if (date_start) {
        conditions.push(`date(announce_date) >= date(?)`);
        params.push(date_start);
      }
      if (date_end) {
        conditions.push(`date(announce_date) <= date(?)`);
        params.push(date_end);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get data sorted by announce_date
    const dataQuery = `SELECT * FROM announcements ${whereClause} ORDER BY announce_date DESC`;
    const { results: rawResults } = await db.prepare(dataQuery).bind(...params).all();

    // Post-query filter: exclude records matching POST_EXCLUSIONS
    const filtered = (rawResults || []).filter(row => !isExcludedRow(row));

    // Exact total
    const total = filtered.length;

    // Apply pagination limit after filtering
    const results = filtered.slice(offset, offset + limit);

    return c.json({
      data: results,
      pagination: { page, limit, total }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

router.get('/stats', async (c) => {
  try {
    const db = c.env.DB;
    const date = c.req.query('date');
    const date_start = c.req.query('date_start');
    const date_end = c.req.query('date_end');
    const budget_min = c.req.query('budget_min');
    const budget_max = c.req.query('budget_max');

    let conditions = [...BASE_EXCLUSIONS];
    let params = [];

    if (budget_min) {
      conditions.push(`budget >= ?`);
      params.push(Number(budget_min));
    }
    if (budget_max) {
      conditions.push(`budget <= ?`);
      params.push(Number(budget_max));
    }
    if (!budget_max) {
      conditions.push(`(budget <= 50000000 OR budget IS NULL)`);
    }

    if (date) {
      conditions.push(`date(announce_date) = date(?)`);
      params.push(date);
    } else {
      if (date_start) {
        conditions.push(`date(announce_date) >= date(?)`);
        params.push(date_start);
      }
      if (date_end) {
        conditions.push(`date(announce_date) <= date(?)`);
        params.push(date_end);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch all candidate records to compute exact filtered stats
    const { results: allRows } = await db.prepare(`
      SELECT announce_type, product_group, province, project_name, boq_summary, doc_verified
      FROM announcements 
      ${whereClause}
    `).bind(...params).all();

    // Filter out non-relevant jobs using the EXACT same logic as /api/announcements
    const validRows = (allRows || []).filter(row => !isExcludedRow(row));

    // Compute exact byType
    const typeCounts = { 'D0': 0, 'B0': 0, '15': 0, 'P0': 0 };
    validRows.forEach(r => {
      let t = r.announce_type;
      if (t === 'D1' || t === 'IM') t = 'D0';
      else if (t === 'B1' || t === 'B2' || t === 'B3') t = 'B0';
      else if (t === 'BOQ') t = '15';
      if (typeCounts[t] !== undefined) {
        typeCounts[t]++;
      }
    });
    const byType = Object.entries(typeCounts).map(([announce_type, count]) => ({ announce_type, count }));

    // Compute exact boqVerifiedCount
    const boqVerifiedCount = validRows.filter(r => (r.doc_verified === 1 || (r.boq_summary && r.boq_summary.trim() !== ''))).length;

    // Compute exact byGroup
    const groupCounts = {};
    validRows.forEach(r => {
      const g = r.product_group || 'other';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const byGroup = Object.entries(groupCounts).map(([product_group, count]) => ({ product_group, count }));

    // Compute exact byRegion
    const PROV_TO_REG = {};
    Object.entries(REGION_MAP).forEach(([reg, provs]) => {
      if (['bkk', 'central', 'east', 'north', 'northeast', 'west', 'south'].includes(reg)) {
        provs.forEach(p => { PROV_TO_REG[p] = reg; });
      }
    });

    const regionCounts = {
      'bkk': 0, 'central': 0, 'east': 0, 'north': 0, 'northeast': 0, 'west': 0, 'south': 0
    };
    validRows.forEach(r => {
      const p = (r.province || '').replace(/^จ(ังหวัด|\.)\s*/, '').trim();
      const reg = PROV_TO_REG[p] || 'other';
      if (regionCounts[reg] !== undefined) {
        regionCounts[reg]++;
      }
    });
    const byRegion = Object.entries(regionCounts).map(([region, count]) => ({ region, count }));

    // Compute exact archiveCount (projects that have bidded/contracted or won)
    let archiveCount = 0;
    try {
      const { results: archiveRow } = await db.prepare(`
        SELECT COUNT(*) as cnt FROM announcements 
        WHERE (winner_name IS NOT NULL AND winner_name != "")
          AND project_id IS NOT NULL
          AND (project_id LIKE "69%" OR project_id LIKE "68%")
          AND budget IS NOT NULL AND budget > 0
      `).all();
      archiveCount = archiveRow?.[0]?.cnt || 0;
    } catch (e) {
      console.error('Failed to get archiveCount:', e);
    }

    return c.json({
      data: {
        byType,
        byGroup,
        byRegion,
        boqVerifiedCount,
        archiveCount
      }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

router.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
    if (!result) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: result });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default router;
