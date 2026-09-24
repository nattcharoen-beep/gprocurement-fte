// simulator.js - Smart Bidding Simulator for FTE (ไฟร์เทรดเอ็นจิเนียริ่ง)
// Implements Thai government e-bidding cost formulas, VAT 7% reconciliation, and competitor market benchmarks.

window.currentSimProject = null;

// Benchmark market discount percentages derived from fire safety and engineering tenders
window.MARKET_BENCHMARKS = {
  fire_alarm: {
    avgDiscount: 6.85,
    name: '🚨 ระบบแจ้งเหตุเพลิงไหม้ (Fire Alarm)',
    tip: 'คู่แข่งเสนอ Notifier/System Sensor/Morley ลดเฉลี่ย 6.8% สเปก FACP และ Detector มีผลต่อราคาสูง แนะนำเคาะลด 5.5% - 7.0%'
  },
  fire_sprinkler_pump: {
    avgDiscount: 5.20,
    name: '💦 สปริงเกอร์ & เครื่องสูบน้ำดับเพลิง (Fire Pump)',
    tip: 'ปั๊มดับเพลิงมาตรฐาน NFPA 20 / UL-FM ตลาดลดเฉลี่ย 5.2% แบรนด์ Patterson/Viking ได้เปรียบด้านความน่าเชื่อถือ'
  },
  fire_suppression_gas: {
    avgDiscount: 7.45,
    name: '🧯 ระบบสารสะอาด/แก๊ส/โฟม (Clean Agent)',
    tip: 'งาน Novec 1230 / FM-200 / CO2 ตัดราคาเฉลี่ย 7.5% ต้องระวังต้นทุนน้ำยาเคมี ห้ามเคาะต่ำกว่าจุดคุ้มทุน'
  },
  fire_hydrant_equipment: {
    avgDiscount: 8.30,
    name: '🚒 ตู้สายส่งน้ำ/หัวรับน้ำ/วาล์วดับเพลิง (Hydrant & FHC)',
    tip: 'ตู้ FHC และท่อวาล์ว NIBCO แข่งขันสูงเฉลี่ยลด 8.3% แนะนำเคาะลด 7.5% - 9.0% ชนะได้ดี'
  },
  safety_ppe_emergency: {
    avgDiscount: 9.15,
    name: '💡 ไฟฉุกเฉิน & ป้ายทางออก (Emergency Light)',
    tip: 'โคมไฟฉุกเฉิน Max Bright และป้ายทางออก ตลาดลดเฉลี่ย 9.1% ตรวจสอบ มอก. และระยะเวลาสำรองไฟ'
  },
  // Backward compatibility
  sport_flooring: { avgDiscount: 6.85, name: 'ระบบแจ้งเหตุเพลิงไหม้ (Fire Alarm)', tip: 'ระบบเตือนภัยเพลิงไหม้' },
  playground: { avgDiscount: 5.20, name: 'สปริงเกอร์ & ปั๊มน้ำดับเพลิง', tip: 'ระบบหัวกระจายน้ำ' },
  waterproofing: { avgDiscount: 7.45, name: 'ระบบดับเพลิงแก๊สและสารสะอาด', tip: 'ระบบสารสะอาด' },
  factory_flooring: { avgDiscount: 8.30, name: 'ตู้สายส่งน้ำและวาล์ว', tip: 'ระบบท่อและตู้ดับเพลิง' }
};

// Global announcements map for fast lookup
window.projectDataStore = window.projectDataStore || new Map();

function openBiddingSimulator(projectId) {
  let project = window.projectDataStore.get(projectId);
  if (!project) {
    project = {
      id: projectId,
      project_name: 'โครงการจัดซื้อจัดจ้าง',
      department: 'หน่วยงานราชการ',
      province: 'ไม่ระบุ',
      budget: 2000000,
      product_group: 'fire_alarm'
    };
  }

  window.currentSimProject = project;

  const modal = document.getElementById('bidding-simulator-modal') || document.getElementById('sim-modal');
  if (!modal) {
    console.error('Simulator modal element not found');
    return;
  }

  // Pre-fill header
  const titleEl = document.getElementById('sim-project-title') || document.getElementById('sim-modal-project-title');
  const deptEl = document.getElementById('sim-project-dept');
  const budgetDisplayEl = document.getElementById('sim-project-budget-display');
  const benchmarkEl = document.getElementById('sim-benchmark-info');

  if (titleEl) titleEl.textContent = project.project_name || 'ไม่มีชื่อโครงการ';
  if (deptEl) deptEl.textContent = '🏢 ' + (project.department || '-') + ' | 📍 ' + (project.province || '-');
  if (budgetDisplayEl) budgetDisplayEl.textContent = formatMoney(project.budget || 0);

  const group = project.product_group || 'fire_alarm';
  const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.fire_alarm;
  if (benchmarkEl) {
    benchmarkEl.innerHTML = '<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">' +
      '<div>' +
        '<span style="background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.82rem;">' + bm.name + '</span>' +
        '<span style="margin-left: 6px; font-weight: 700; color: #0f172a;">สถิติตลาด e-GP: ตัดราคาเฉลี่ย <span style="color: #dc2626; font-size: 1.05rem;">' + bm.avgDiscount + '%</span></span>' +
      '</div>' +
      '<span style="color: #475569; font-size: 0.82rem;">💡 ' + bm.tip + '</span>' +
    '</div>';
  }

  // Set default inputs
  const budget = project.budget || 1000000;
  const budgetInput = document.getElementById('sim-input-budget');
  if (budgetInput) budgetInput.value = budget;

  // Estimate equipment & installation costs
  const equipInput = document.getElementById('sim-input-equip-cost');
  const installInput = document.getElementById('sim-input-install-cost');
  const epdmAreaInput = document.getElementById('sim-input-epdm-area');
  const epdmUnitCostInput = document.getElementById('sim-input-epdm-unit-cost');
  const otherCostInput = document.getElementById('sim-input-other-cost');
  const bufferInput = document.getElementById('sim-input-buffer');

  const estEquip = Math.max(0, Math.round((budget / 1.07) * 0.40));
  const estInstall = Math.max(0, Math.round((budget / 1.07) * 0.15));
  const estOther = Math.max(0, Math.round((budget / 1.07) * 0.10));

  if (equipInput) equipInput.value = estEquip;
  if (installInput) installInput.value = estInstall;
  if (epdmAreaInput) epdmAreaInput.value = Math.max(10, Math.round(estEquip / 1000));
  if (epdmUnitCostInput) epdmUnitCostInput.value = 1000;
  if (otherCostInput) otherCostInput.value = estOther;
  if (bufferInput) bufferInput.value = 100000;

  // Configure slider limits
  const slider = document.getElementById('sim-bid-slider');
  const defBid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  if (slider) {
    slider.min = Math.round(budget * 0.6);
    slider.max = budget;
    slider.step = 1000;
    slider.value = defBid;
  }

  const bidInput = document.getElementById('sim-input-bid-price');
  if (bidInput) {
    bidInput.value = defBid;
  }

  // Recalculate everything
  recalculateSimulator();

  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBiddingSimulator() {
  const modal = document.getElementById('bidding-simulator-modal') || document.getElementById('sim-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

function applyStrategy(stratNumber) {
  const budget = parseFloat(document.getElementById('sim-input-budget')?.value || 0);
  if (budget <= 0) return;

  const group = window.currentSimProject?.product_group || 'fire_alarm';
  const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.fire_alarm;

  let targetBid = budget;
  if (stratNumber === 1) {
    // Strategy 1: Max Profit (ลด 1.0% เกาะราคากลาง)
    targetBid = Math.round(budget * 0.99);
  } else if (stratNumber === 2) {
    // Strategy 2: Competitive Sweet Spot (ลดตาม Benchmark ตลาด)
    targetBid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  } else if (stratNumber === 3) {
    // Strategy 3: Aggressive Squeeze (ลด 12% หรือลดหนักสกัดเจ้าใหญ่)
    const aggDiscount = Math.max(12, bm.avgDiscount + 4);
    targetBid = Math.round(budget * (1 - (aggDiscount / 100)));
  }

  const bidInput = document.getElementById('sim-input-bid-price');
  const slider = document.getElementById('sim-bid-slider');
  if (bidInput) bidInput.value = targetBid;
  if (slider) slider.value = targetBid;

  recalculateSimulator();
}

function onBidSliderChange(val) {
  const bidInput = document.getElementById('sim-input-bid-price');
  if (bidInput) bidInput.value = val;
  recalculateSimulator();
}

function onBidInputChange(val) {
  const slider = document.getElementById('sim-bid-slider');
  if (slider) slider.value = val;
  recalculateSimulator();
}

function recalculateSimulator() {
  const budget = parseFloat(document.getElementById('sim-input-budget')?.value || 0);
  const equipInput = document.getElementById('sim-input-equip-cost');
  const installInput = document.getElementById('sim-input-install-cost');
  const epdmAreaInput = document.getElementById('sim-input-epdm-area');
  const epdmUnitCostInput = document.getElementById('sim-input-epdm-unit-cost');
  const otherCost = parseFloat(document.getElementById('sim-input-other-cost')?.value || 0);
  const bufferCost = parseFloat(document.getElementById('sim-input-buffer')?.value || 100000);
  const bidPrice = parseFloat(document.getElementById('sim-input-bid-price')?.value || budget);

  // Financial Math (VAT 7% Reconciliation according to FTE SOP)
  let costEquip = equipInput ? parseFloat(equipInput.value || 0) : 0;
  if (!equipInput && epdmAreaInput) {
    costEquip = parseFloat(epdmAreaInput.value || 0) * parseFloat(epdmUnitCostInput?.value || 1000);
  }
  const costInstall = installInput ? parseFloat(installInput.value || 0) : 0;
  const costExVat = otherCost + costEquip + costInstall + bufferCost;
  const vatIn = costExVat * 0.07;
  const costTotalWithVat = costExVat * 1.07;

  const breakEvenBid = costTotalWithVat;

  const discountAmount = budget - bidPrice;
  const discountPercent = budget > 0 ? (discountAmount / budget) * 100 : 0;

  const revExVat = bidPrice / 1.07;
  const vatOut = bidPrice * (7 / 107);
  const vatNetToPay = vatOut - vatIn;

  const grossProfit = revExVat - costExVat;
  const marginPercent = revExVat > 0 ? (grossProfit / revExVat) * 100 : 0;

  const group = window.currentSimProject?.product_group || 'fire_alarm';
  const bm = window.MARKET_BENCHMARKS[group] || window.MARKET_BENCHMARKS.fire_alarm;

  const s1Bid = Math.round(budget * 0.99);
  const s1Profit = (s1Bid / 1.07) - costExVat;
  const s2Bid = Math.round(budget * (1 - (bm.avgDiscount / 100)));
  const s2Profit = (s2Bid / 1.07) - costExVat;
  const s3Discount = Math.max(12, bm.avgDiscount + 4);
  const s3Bid = Math.round(budget * (1 - (s3Discount / 100)));
  const s3Profit = (s3Bid / 1.07) - costExVat;

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setText('strat1-bid', formatMoney(s1Bid));
  setText('strat1-profit', 'กำไร ฿' + Math.round(s1Profit).toLocaleString());
  setText('strat2-bid', formatMoney(s2Bid));
  setText('strat2-profit', 'กำไร ฿' + Math.round(s2Profit).toLocaleString() + ' (ลด ' + bm.avgDiscount + '%)');
  setText('strat3-bid', formatMoney(s3Bid));
  setText('strat3-profit', 'กำไร ฿' + Math.round(s3Profit).toLocaleString() + ' (ลด ' + s3Discount + '%)');

  setText('res-bid-price', formatMoney(bidPrice));
  setText('res-discount-info', 'ลดจากราคากลาง: ฿' + Math.round(discountAmount).toLocaleString() + ' (' + discountPercent.toFixed(2) + '%)');
  setText('res-rev-ex-vat', '฿' + Math.round(revExVat).toLocaleString());
  setText('res-cost-ex-vat', '฿' + Math.round(costExVat).toLocaleString());
  setText('res-vat-in', '฿' + Math.round(vatIn).toLocaleString());
  setText('res-vat-out', '฿' + Math.round(vatOut).toLocaleString());
  setText('res-vat-net', '฿' + Math.round(vatNetToPay).toLocaleString());
  setText('res-breakeven', '฿' + Math.round(breakEvenBid).toLocaleString());

  const profitEl = document.getElementById('res-gross-profit');
  const marginEl = document.getElementById('res-margin-percent');
  const statusBox = document.getElementById('sim-status-box');

  if (profitEl) profitEl.textContent = '฿' + Math.round(grossProfit).toLocaleString();
  if (marginEl) marginEl.textContent = marginPercent.toFixed(1) + '% Margin';

  if (statusBox) {
    if (bidPrice < breakEvenBid) {
      statusBox.style.background = '#fef2f2';
      statusBox.style.borderColor = '#f87171';
      statusBox.style.color = '#991b1b';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.4rem;">🚨</span>' +
        '<div>' +
          '<strong>เตือนอันตราย! เคาะต่ำกว่าจุดคุ้มทุน (ขาดทุนทันที ฿' + Math.abs(Math.round(grossProfit)).toLocaleString() + ')</strong>' +
          '<div style="font-size: 0.82rem;">ราคาเคาะขั้นต่ำที่ห้ามเคาะต่ำกว่านี้คือ <strong>฿' + Math.round(breakEvenBid).toLocaleString() + '</strong> รวม VAT</div>' +
        '</div>' +
      '</div>';
    } else if (marginPercent >= 20) {
      statusBox.style.background = '#f0fdf4';
      statusBox.style.borderColor = '#4ade80';
      statusBox.style.color = '#166534';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.4rem;">🌟</span>' +
        '<div>' +
          '<strong>ยอดเยี่ยม! กำไรสูงมาก (' + marginPercent.toFixed(1) + '%)</strong>' +
          '<div style="font-size: 0.82rem;">FTE เหลือกำไรแท้จริง <strong>฿' + Math.round(grossProfit).toLocaleString() + '</strong> หลังหักภาษีและเงินสำรอง 1 แสนบาท</div>' +
        '</div>' +
      '</div>';
    } else if (marginPercent >= 10) {
      statusBox.style.background = '#eff6ff';
      statusBox.style.borderColor = '#60a5fa';
      statusBox.style.color = '#1e40af';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.4rem;">✅</span>' +
        '<div>' +
          '<strong>ราคาแข่งขันได้ดี มีโอกาสชนะสูง (กำไร ' + marginPercent.toFixed(1) + '%)</strong>' +
          '<div style="font-size: 0.82rem;">กำไรแท้จริง <strong>฿' + Math.round(grossProfit).toLocaleString() + '</strong> อยู่ในเกณฑ์มาตรฐานปลอดภัย</div>' +
        '</div>' +
      '</div>';
    } else {
      statusBox.style.background = '#fffbeb';
      statusBox.style.borderColor = '#fcd34d';
      statusBox.style.color = '#92400e';
      statusBox.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="font-size: 1.4rem;">⚠️</span>' +
        '<div>' +
          '<strong>กำไรค่อนข้างบาง (' + marginPercent.toFixed(1) + '%)</strong>' +
          '<div style="font-size: 0.82rem;">กำไร <strong>฿' + Math.round(grossProfit).toLocaleString() + '</strong> เหมาะสำหรับกรณีต้องการตัดราคาเอาผลงานหรือสกัดคู่แข่งเจ้าใหญ่</div>' +
        '</div>' +
      '</div>';
    }
  }
}

function copySimulationSummary() {
  const p = window.currentSimProject || {};
  const budget = document.getElementById('sim-input-budget')?.value || '0';
  const bidPrice = document.getElementById('sim-input-bid-price')?.value || '0';
  const discountInfo = document.getElementById('res-discount-info')?.textContent || '';
  const profit = document.getElementById('res-gross-profit')?.textContent || '';
  const margin = document.getElementById('res-margin-percent')?.textContent || '';
  const breakEven = document.getElementById('res-breakeven')?.textContent || '';

  const text = '📋 ผลจำลองราคาเคาะประมูล (FTE • Firetrade Engineering)\n' +
'----------------------------------------\n' +
'📌 โครงการ: ' + (p.project_name || '-') + '\n' +
'🏢 หน่วยงาน: ' + (p.department || '-') + ' (' + (p.province || '-') + ')\n' +
'💰 ราคากลางรัฐ: ฿' + Number(budget).toLocaleString() + '\n' +
'🎯 ราคาเคาะเสนอ: ฿' + Number(bidPrice).toLocaleString() + ' (' + discountInfo + ')\n' +
'💵 กำไรแท้จริง: ' + profit + ' (' + margin + ')\n' +
'🛡️ จุดคุ้มทุนขั้นต่ำ (Floor): ' + breakEven + '\n' +
'----------------------------------------\n' +
'วิเคราะห์โดยระบบ FTE B2G Command Center';

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ คัดลอกสรุปการเคาะราคาเรียบร้อยแล้ว! สามารถนำไปวางส่ง LINE ได้ทันที');
    });
  } else {
    alert('คัดลอกข้อความ:\n' + text);
  }
}
