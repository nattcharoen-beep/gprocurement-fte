/**
 * Daily Digest Email Builder - Firetrade Engineering PCL (FTE) GProcurement Tracker
 * Builds an executive, high-conversion HTML email summarizing daily fire protection procurement opportunities.
 * Features:
 *  - Intelligent Highlight Scoring & Tagging (⭐ งานใหม่ที่น่าสนใจ)
 *  - Executive KPI Summary Bar (Total pipeline value, highlight count, category breakdown)
 *  - High-Priority Featured Cards with direct e-GP & Dashboard CTAs
 *  - Categorized Sections: D0 (เปิดรับซอง), B0 (ร่าง TOR), 15 (ราคากลาง), P0 (แผนจัดซื้อ), W0 (ผู้ชนะ)
 *  - 100% Mobile & Desktop Responsive with FTE corporate branding (#DC2626 & #0F172A)
 */

// Format numbers as Thai Baht
export function formatBaht(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ไม่ระบุ';
  return `฿${Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatBahtShort(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'ไม่ระบุ';
  const num = Number(amount);
  if (num >= 1000000) {
    return `฿${(num / 1000000).toFixed(2)} ล้าน`;
  } else if (num >= 1000) {
    return `฿${(num / 1000).toFixed(0)} พัน`;
  }
  return `฿${num.toLocaleString('th-TH')}`;
}

// Format Date to Thai locale
export function formatThaiDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatThaiDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  });
}

const TYPE_CONFIG = {
  'D0': { icon: '🔴', label: 'ประกาศเชิญชวน (ยื่นซองประมูล)', color: '#dc2626', bg: '#fee2e2', order: 1 },
  'D1': { icon: '🔴', label: 'ประกาศเชิญชวน (ยื่นซองประมูล)', color: '#dc2626', bg: '#fee2e2', order: 1 },
  'B0': { icon: '🟡', label: 'ร่างประกาศ / ร่าง TOR (วิจารณ์สเปก)', color: '#d97706', bg: '#fef3c7', order: 2 },
  '15': { icon: '🟠', label: 'ตารางราคากลาง / BOQ', color: '#ea580c', bg: '#ffedd5', order: 3 },
  'P0': { icon: '🟢', label: 'แผนการจัดซื้อจัดจ้าง (ล่วงหน้า)', color: '#059669', bg: '#d1fae5', order: 4 },
  'W0': { icon: '✅', label: 'ผลการจัดซื้อจัดจ้าง / ผู้ชนะ', color: '#2563eb', bg: '#dbeafe', order: 5 }
};

/**
 * Normalizes an announcement item from either scraper or database format
 */
export function normalizeItem(item) {
  const title = item.title || item.project_name || 'ไม่มีชื่อโครงการ';
  let announceType = item.announceType || item.announce_type || 'D0';
  if (announceType === 'D1' || announceType === 'IM') announceType = 'D0';
  if (announceType === 'BOQ') announceType = '15';
  if (announceType === 'B1' || announceType === 'B2' || announceType === 'B3') announceType = 'B0';

  const budget = Number(item.budget) || 0;
  const date = item.announce_date || item.announceDate || '';
  const dept = item.department || 'หน่วยงานภาครัฐ';
  const prov = (item.province || '').replace(/^จ(ังหวัด|\.)\s*/, '').trim() || 'ไม่ระบุ';
  const url = item.url || (item.project_id ? `https://process5.gprocurement.go.th/egp-agpc01-web/announcement?keywordSearch=${item.project_id}` : 'https://firetrade.co.th');
  const deadline = item.deadline || '';
  const projectId = item.project_id || item.projectId || '';

  return {
    ...item,
    id: item.id || `${projectId}-${announceType}`,
    projectId,
    title,
    announceType,
    budget,
    date,
    dept,
    prov,
    url,
    deadline
  };
}

/**
 * Calculates interest score and generates tags for an FTE project
 */
export function scoreAndTagProject(item) {
  let score = 0;
  const tags = [];
  const lowerTitle = item.title.toLowerCase();

  // 1. Budget Score
  if (item.budget >= 10000000) {
    score += 35;
    tags.push({ label: '💎 เมกะโปรเจกต์ 10M+', color: '#7c3aed', bg: '#ede9fe' });
  } else if (item.budget >= 5000000) {
    score += 28;
    tags.push({ label: '💰 งบสูง 5M+', color: '#047857', bg: '#d1fae5' });
  } else if (item.budget >= 1000000) {
    score += 20;
    tags.push({ label: '✨ โครงการ 1M+', color: '#0369a1', bg: '#e0f2fe' });
  } else if (item.budget >= 500000) {
    score += 10;
    tags.push({ label: '🏷️ งบ 500k+', color: '#4b5563', bg: '#f3f4f6' });
  }

  // 1.1 In-Memory BOQ Verified Super Bonus (+50 pts)
  if (item.boq_summary || item.doc_verified) {
    score += 50;
    tags.unshift({ label: '🎯 ตรวจพบสเปกตรงใน BOQ', color: '#ffffff', bg: '#16a34a' });
  }

  // 2. FTE Core Fire Protection Specialty Tags
  if (lowerTitle.includes('แจ้งเหตุเพลิงไหม้') || lowerTitle.includes('fire alarm') || lowerTitle.includes('facp') || lowerTitle.includes('ตรวจจับควัน') || lowerTitle.includes('ตรวจจับความร้อน')) {
    score += 35;
    tags.push({ label: '🚨 ระบบแจ้งเหตุเพลิงไหม้/ตรวจจับ', color: '#b91c1c', bg: '#fee2e2' });
  }
  if (lowerTitle.includes('สปริงเกอร์') || lowerTitle.includes('สปริงเกลอร์') || lowerTitle.includes('หัวกระจายน้ำดับเพลิง') || lowerTitle.includes('sprinkler')) {
    score += 35;
    tags.push({ label: '💦 หัวกระจายน้ำสปริงเกอร์', color: '#0369a1', bg: '#e0f2fe' });
  }
  if (lowerTitle.includes('เครื่องสูบน้ำดับเพลิง') || lowerTitle.includes('fire pump') || lowerTitle.includes('ปั๊มดับเพลิง') || lowerTitle.includes('jockey pump')) {
    score += 35;
    tags.push({ label: '⚙️ เครื่องสูบน้ำดับเพลิง (Fire Pump)', color: '#b91c1c', bg: '#fee2e2' });
  }
  if (lowerTitle.includes('สารสะอาด') || lowerTitle.includes('clean agent') || lowerTitle.includes('fm-200') || lowerTitle.includes('novec') || lowerTitle.includes('inergen') || lowerTitle.includes('co2')) {
    score += 40;
    tags.push({ label: '🧯 สารสะอาด/ก๊าซดับเพลิง (High Value)', color: '#7c3aed', bg: '#ede9fe' });
  }
  if (lowerTitle.includes('ห้องเซิร์ฟเวอร์') || lowerTitle.includes('server') || lowerTitle.includes('datacenter') || lowerTitle.includes('ห้องควบคุมไฟฟ้า')) {
    score += 30;
    tags.push({ label: '🖥️ ป้องกันอัคคีภัยห้อง Server/ไฟฟ้า', color: '#0284c7', bg: '#e0f2fe' });
  }
  if (lowerTitle.includes('ตู้สายฉีดน้ำดับเพลิง') || lowerTitle.includes('ตู้ดับเพลิง') || lowerTitle.includes('สายส่งน้ำดับเพลิง') || lowerTitle.includes('fire hose')) {
    score += 25;
    tags.push({ label: '🚒 ตู้สายฉีดน้ำ/สายส่งน้ำดับเพลิง', color: '#c2410c', bg: '#ffedd5' });
  }
  if (lowerTitle.includes('หัวรับน้ำดับเพลิง') || lowerTitle.includes('หัวดับเพลิง') || lowerTitle.includes('วาล์วดับเพลิง') || lowerTitle.includes('nibco')) {
    score += 25;
    tags.push({ label: '🚰 วาล์ว/หัวรับน้ำดับเพลิง', color: '#047857', bg: '#d1fae5' });
  }
  if (lowerTitle.includes('ถังดับเพลิง') || lowerTitle.includes('เครื่องดับเพลิงยกหิ้ว')) {
    score += 20;
    tags.push({ label: '🧯 ถังดับเพลิง/เครื่องดับเพลิง', color: '#b91c1c', bg: '#fee2e2' });
  }
  if (lowerTitle.includes('ไฟฉุกเฉิน') || lowerTitle.includes('ป้ายทางออกฉุกเฉิน') || lowerTitle.includes('ป้ายทางหนีไฟ') || lowerTitle.includes('emergency light')) {
    score += 20;
    tags.push({ label: '💡 ไฟฉุกเฉิน/ป้ายหนีไฟ (Max Bright)', color: '#d97706', bg: '#fef3c7' });
  }
  if (lowerTitle.includes('ชุดดับเพลิง') || lowerTitle.includes('ชุดผจญเพลิง') || lowerTitle.includes('scba') || lowerTitle.includes('ตู้เก็บสารเคมี')) {
    score += 25;
    tags.push({ label: '🛡️ อุปกรณ์ความปลอดภัย/ชุดผจญเพลิง', color: '#4338ca', bg: '#e0e7ff' });
  }
  if (lowerTitle.includes('ปรับปรุงระบบดับเพลิง') || lowerTitle.includes('ติดตั้งระบบดับเพลิง')) {
    score += 30;
    tags.push({ label: '🏢 งานระบบดับเพลิงครบวงจร', color: '#b91c1c', bg: '#fee2e2' });
  }
  if (lowerTitle.includes('เฉพาะเจาะจง') || item.methodId === '19') {
    score += 15;
    tags.push({ label: '🎯 เฉพาะเจาะจง (งานตรง/ขายของได้ทันที)', color: '#7e22ce', bg: '#f3e8ff' });
  }

  // 3. Stage Score
  if (item.announceType === 'D0') {
    score += 20;
    tags.push({ label: '🔴 เปิดรับซอง', color: '#dc2626', bg: '#fee2e2' });
  } else if (item.announceType === 'B0') {
    score += 15;
    tags.push({ label: '🟡 ดักสเปก TOR', color: '#d97706', bg: '#fef3c7' });
  } else if (item.announceType === '15') {
    score += 10;
    tags.push({ label: '🟠 ตรวจราคากลาง', color: '#ea580c', bg: '#ffedd5' });
  }

  // 4. Province Tag
  if (item.prov && item.prov !== 'ไม่ระบุ') {
    tags.push({ label: `📍 จ.${item.prov}`, color: '#374151', bg: '#f3f4f6' });
  }

  // Determine if it qualifies as top highlight
  const isHighlight = score >= 45 || (item.budget >= 2000000 && score >= 35);

  return { score, tags, isHighlight };
}

export function buildDigestHTML(announcements, options = {}) {
  const recipientEmail = options.recipient || 'admin@firetrade.co.th';
  const today = formatThaiDate(new Date().toISOString());
  const portalUrl = options.portalUrl || 'https://gprocurement-fte.pages.dev';

  // Normalize and score all items
  const normalized = (announcements || []).map(normalizeItem);
  const scoredItems = normalized.map(item => ({
    ...item,
    meta: scoreAndTagProject(item)
  }));

  // Sort by interest score descending
  scoredItems.sort((a, b) => b.meta.score - a.meta.score);

  // Separate highlights (Top 8 items with high interest score)
  const highlights = scoredItems.filter(x => x.meta.isHighlight).slice(0, 8);

  // Compute Summary KPIs
  const totalCount = scoredItems.length;
  const totalBudget = scoredItems.reduce((sum, x) => sum + (x.budget || 0), 0);
  const d0Count = scoredItems.filter(x => x.announceType === 'D0').length;
  const b0Count = scoredItems.filter(x => x.announceType === 'B0').length;
  const p0Count = scoredItems.filter(x => x.announceType === 'P0').length;
  const boqCount = scoredItems.filter(x => x.announceType === '15').length;

  // Group by type for the full list
  const grouped = {};
  for (const item of scoredItems) {
    const t = item.announceType;
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(item);
  }

  const sortedTypes = ['D0', 'B0', '15', 'P0', 'W0'].filter(t => grouped[t] && grouped[t].length > 0);

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สรุปโอกาสงานจัดซื้อจัดจ้างภาครัฐ — บมจ. ไฟร์เทรดเอ็นจิเนียริ่ง (FTE)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Kanit', 'Anuphan', Tahoma, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      background-color: #0f172a;
      margin: 0;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      border: 1px solid #334155;
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%);
      color: #ffffff;
      padding: 28px 24px 22px;
      text-align: center;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 6px 0 4px 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 14px;
      opacity: 0.95;
      color: #fee2e2;
    }
    /* KPI Bar */
    .kpi-container {
      display: table;
      width: 100%;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      table-layout: fixed;
    }
    .kpi-box {
      display: table-cell;
      padding: 14px 8px;
      text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .kpi-box:last-child {
      border-right: none;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 800;
      color: #b91c1c;
      line-height: 1.2;
    }
    .kpi-val.highlight {
      color: #059669;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin-top: 3px;
    }
    /* Main Content */
    .content {
      padding: 24px 20px;
    }
    /* Section Titles */
    .section-header {
      margin: 28px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #b91c1c;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #b91c1c;
    }
    .section-badge {
      background: #b91c1c;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    /* Highlight Cards */
    .card-highlight {
      background: #fff;
      border: 1.5px solid #fca5a5;
      border-left: 5px solid #dc2626;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }
    .card-title a {
      color: #0f172a;
      text-decoration: none;
    }
    .card-tags {
      margin-bottom: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .card-meta {
      font-size: 13px;
      color: #475569;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .card-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
    }
    .btn-egp {
      background: #dc2626;
      color: #ffffff !important;
    }
    .btn-portal {
      background: #0f172a;
      color: #ffffff !important;
    }
    /* Standard Items */
    .standard-item {
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #94a3b8;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .standard-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 6px 0;
      line-height: 1.4;
    }
    .winner-box {
      margin-top: 8px;
      padding: 6px 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      font-size: 12px;
      color: #1e40af;
    }
    /* Footer */
    .footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 22px 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.6;
    }
    .footer a {
      color: #f87171;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="brand-badge">🔥 FTE B2G INTELLIGENCE</div>
      <h1>สรุปโอกาสงานจัดซื้อจัดจ้างภาครัฐ (e-GP)</h1>
      <div class="subtitle">
        สำหรับ <strong>บริษัท ไฟร์เทรดเอ็นจิเนียริ่ง จำกัด (มหาชน)</strong> &bull; ประจำวันที่ ${today}
      </div>
    </div>

    <!-- Executive KPI Summary Bar -->
    <div class="kpi-container">
      <div class="kpi-box">
        <div class="kpi-val">${totalCount}</div>
        <div class="kpi-label">โครงการทั้งหมด</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val highlight">${formatBahtShort(totalBudget)}</div>
        <div class="kpi-label">มูลค่างบรวม</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #dc2626;">${d0Count}</div>
        <div class="kpi-label">เปิดรับซอง (D0)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #d97706;">${b0Count}</div>
        <div class="kpi-label">ดักสเปก TOR (B0)</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val" style="color: #ea580c;">${boqCount}</div>
        <div class="kpi-label">ราคากลาง/BOQ</div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">

      <!-- TOP PRIORITY HIGHLIGHTS -->
      ${highlights.length > 0 ? `
        <div class="section-header">
          <h2>⭐ งานสำคัญน่าสนใจประจำวัน (${highlights.length} โครงการ)</h2>
          <span class="section-badge" style="background: #dc2626;">FTE High Priority</span>
        </div>
      ` : ''}

      ${highlights.map(item => `
        <div class="card-highlight" style="border-left-color: ${(item.boq_summary || item.doc_verified) ? '#16a34a' : '#dc2626'}; ${(item.boq_summary || item.doc_verified) ? 'background: #f0fdf4; border: 1.5px solid #86efac; border-left: 5px solid #16a34a;' : ''}">
          <h3 class="card-title">
            <a href="${item.url}" target="_blank">
              ${item.title}
            </a>
          </h3>

          <div class="card-tags">
            ${item.meta.tags.map(t => `
              <span class="pill" style="color: ${t.color}; background: ${t.bg};">
                ${t.label}
              </span>
            `).join('')}
          </div>

          <div class="card-meta">
            <div>🏛️ <strong>หน่วยงาน:</strong> ${item.dept} (${item.prov})</div>
            <div>💰 <strong>งบประมาณ:</strong> <span style="color: #059669; font-weight: 700; font-size: 15px;">${formatBaht(item.budget)}</span></div>
            ${item.deadline && item.deadline !== 'ยังไม่กำหนด' ? `
              <div>⏳ <strong>วันสิ้นสุดยื่นซอง:</strong> <span style="color: #dc2626; font-weight: 700;">${formatThaiDateShort(item.deadline)}</span></div>
            ` : ''}
          </div>

          ${item.boq_summary ? `
            <div style="margin-bottom: 12px; font-size: 12.5px; color: #14532d; background: #dcfce7; padding: 8px 12px; border-radius: 6px; border: 1px solid #86efac; font-weight: 600;">
              🎯 <strong>ตรวจพบสเปกระบบดับเพลิงใน BOQ:</strong> ${item.boq_summary}
            </div>
          ` : ''}

          <div class="card-actions">
            <a href="${item.url}" target="_blank" class="btn btn-egp">
              🔗 เปิดเอกสารบน e-GP &rarr;
            </a>
            <a href="${portalUrl}" target="_blank" class="btn btn-portal">
              📱 ดูในระบบ FTE Command Center
            </a>
          </div>
        </div>
      `).join('')}

      <!-- ALL CATEGORIZED OPPORTUNITIES -->
      ${sortedTypes.map(type => {
        const conf = TYPE_CONFIG[type] || { icon: '📄', label: `รหัส ${type}`, color: '#dc2626', bg: '#f1f5f9' };
        const items = grouped[type] || [];
        return `
          <div class="section-header" style="border-color: ${conf.color};">
            <h2 style="color: ${conf.color};">${conf.icon} ${conf.label}</h2>
            <span class="section-badge" style="background: ${conf.color};">${items.length} รายการ</span>
          </div>

          ${items.slice(0, 15).map((item, i) => `
            <div class="standard-item" style="border-left-color: ${(item.boq_summary || item.doc_verified) ? '#16a34a' : conf.color}; ${(item.boq_summary || item.doc_verified) ? 'background: #f0fdf4; border: 1.5px solid #86efac; border-left: 5px solid #16a34a;' : ''}">
              ${(item.boq_summary || item.doc_verified) ? `
                <div style="margin-bottom: 6px;">
                  <span style="background: #16a34a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    🎯 ตรวจพบสเปกระบบดับเพลิงใน BOQ
                  </span>
                </div>
              ` : ''}
              <h4 class="standard-title">
                <a href="${item.url}" target="_blank" style="color: inherit; text-decoration: none;">
                  ${i + 1}. ${item.title}
                </a>
              </h4>
              <div style="font-size: 13px; color: #475569; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                <div><strong>งบประมาณ:</strong> <span style="color: #059669; font-weight: 700;">${formatBaht(item.budget)}</span></div>
                <div><strong>หน่วยงาน:</strong> ${item.dept} (${item.prov})</div>
                ${item.deadline && item.deadline !== 'ยังไม่กำหนด' ? `<div><strong>ปิดรับ:</strong> ${formatThaiDateShort(item.deadline)}</div>` : ''}
                <div><a href="${item.url}" target="_blank" style="color: #dc2626; font-weight: 600; text-decoration: none;">🔗 e-GP</a></div>
              </div>

              ${item.boq_summary ? `
                <div style="margin-top: 8px; font-size: 12px; color: #14532d; background: #dcfce7; padding: 6px 10px; border-radius: 4px; border: 1px solid #86efac; font-weight: 600;">
                  🎯 <strong>ตรวจพบสเปกระบบดับเพลิงใน BOQ:</strong> ${item.boq_summary}
                </div>
              ` : ''}

              ${type === 'W0' ? `
                <div class="winner-box">
                  <div><strong>ผู้ชนะ:</strong> ${item.winner_name || 'ไม่ระบุ'}</div>
                  <div><strong>ราคาชนะ:</strong> ${formatBaht(item.winner_price)} ${item.discount_percent ? `(ลด ${item.discount_percent.toFixed(2)}%)` : ''}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}

          ${items.length > 15 ? `
            <div style="text-align: center; padding: 8px; font-size: 13px;">
              <a href="${portalUrl}" style="color: #dc2626; font-weight: 600;">
                + ดูอีก ${items.length - 15} รายการในหมวดนี้บนระบบ FTE Tracker &rarr;
              </a>
            </div>
          ` : ''}
        `;
      }).join('')}

    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin-bottom: 6px;">
        อีเมลสรุปข้อมูลอัตโนมัตินี้ส่งถึง <strong>${recipientEmail}</strong> ทุกวันเวลา 07:00 น.
      </p>
      <p style="margin-bottom: 12px;">
        รวบรวมและคัดกรองข้อมูลตรงจากระบบ e-GP กรมบัญชีกลาง สำหรับ บริษัท ไฟร์เทรดเอ็นจิเนียริ่ง จำกัด (มหาชน)
      </p>
      <p style="margin: 0;">
        <a href="${portalUrl}" target="_blank">🌐 เปิดเข้าระบบ FTE B2G Command Center (Dashboard)</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
