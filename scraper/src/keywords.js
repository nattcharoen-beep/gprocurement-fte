/**
 * Firetrade Engineering PCL (FTE) - Product Groups & Target Keywords
 * Website: https://firetrade.co.th/
 * 5 Core Product Groups for Government Procurement & B2G e-GP Tracking
 */
export const PRODUCT_GROUPS = {
  // 1. ระบบแจ้งเหตุเพลิงไหม้และเตือนภัยอัคคีภัย
  fire_alarm: [
    "ระบบแจ้งเหตุเพลิงไหม้", "แจ้งเหตุเพลิงไหม้", "ระบบเตือนอัคคีภัย", "เตือนอัคคีภัย", "ระบบเตือนภัยเพลิงไหม้",
    "Fire Alarm", "Fire Alarm System", "Fire Alarm Control Panel", "FACP",
    "Addressable Control Panel", "Conventional Control Panel", "Release Control Panel",
    "ตู้ควบคุมระบบแจ้งเหตุเพลิงไหม้", "ตู้ควบคุมสัญญาณเตือนอัคคีภัย", "ตู้ FACP",
    "อุปกรณ์ตรวจจับควัน", "เครื่องตรวจจับควัน", "Smoke Detector", "Photoelectric Smoke Detector",
    "อุปกรณ์ตรวจจับความร้อน", "เครื่องตรวจจับความร้อน", "Heat Detector", "Line Heat Detector",
    "Beam Detector", "Beam Smoke Detector", "อุปกรณ์ตรวจจับควันชนิดลำแสง",
    "Aspirated Smoke Detector", "VESDA", "ตรวจจับควันแบบสุ่มอากาศ",
    "Flame Detector", "อุปกรณ์ตรวจจับเปลวไฟ",
    "Manual Pull Station", "Manual Call Point", "ปุ่มกดแจ้งเหตุด้วยมือ", "ปุ่มกดสัญญาณเตือนเพลิงไหม้",
    "กระดิ่งเตือนภัย", "Fire Alarm Bell", "กระดิ่งสัญญาณเตือนเพลิงไหม้", "กระดิ่งเตือนอัคคีภัย",
    "ไซเรน", "Horn Strobe", "Strobe Light", "ไฟสัญญาณเตือนเพลิงไหม้",
    "Notifier", "Honeywell", "Morley", "System Sensor", "GST"
  ],

  // 2. ระบบหัวกระจายน้ำดับเพลิงและเครื่องสูบน้ำดับเพลิง
  fire_sprinkler_pump: [
    "หัวกระจายน้ำดับเพลิง", "สปริงเกอร์ดับเพลิง", "สปริงเกลอร์ดับเพลิง", "ระบบสปริงเกอร์ดับเพลิง", "ระบบสปริงเกลอร์",
    "Fire Sprinkler", "Sprinkler System", "หัวสปริงเกอร์", "หัวสปริงเกลอร์", "หัวฉีดน้ำดับเพลิงอัตโนมัติ",
    "ESFR", "ESFR Sprinkler", "Dry Type Sprinkler", "Pendent Sprinkler", "Upright Sprinkler", "Sidewall Sprinkler",
    "Deluge Valve", "Alarm Check Valve", "Preaction Valve", "Preaction System", "Dry Pipe Valve",
    "Flow Switch", "Tamper Switch", "วาล์วระบบสปริงเกอร์", "ระบบดับเพลิงอัตโนมัติ",
    "เครื่องสูบน้ำดับเพลิง", "ระบบเครื่องสูบน้ำดับเพลิง", "Fire Pump", "Fire Pump System",
    "ปั๊มดับเพลิง", "ระบบปั๊มดับเพลิง", "เครื่องสูบน้ำดับเพลิงชนิดเครื่องยนต์ดีเซล", "เครื่องสูบน้ำดับเพลิงมอเตอร์ไฟฟ้า",
    "Diesel Fire Pump", "Electric Fire Pump", "Jockey Pump", "ปั๊มรักษาแรงดัน", "ปั๊มช่วยรักษาแรงดันน้ำ",
    "ตู้ควบคุมเครื่องสูบน้ำดับเพลิง", "Fire Pump Controller", "NFPA 20", "UL/FM Fire Pump",
    "Flow Meter ระบบดับเพลิง", "Pressure Relief Valve", "ปรับปรุงระบบดับเพลิง", "ติดตั้งระบบดับเพลิง",
    "Patterson", "Clarke", "Tornatech", "Viking", "Tyco", "Globe", "Rapidrop"
  ],

  // 3. ระบบสารสะอาด ก๊าซดับเพลิง โฟมดับเพลิง และถังดับเพลิง
  fire_suppression_gas: [
    "ระบบสารสะอาดดับเพลิง", "ระบบดับเพลิงด้วยสารสะอาด", "สารสะอาดดับเพลิง", "Clean Agent", "Clean Agent Fire Suppression",
    "Novec 1230", "Novec", "FK-5-1-12", "FK5112", "FM-200", "FM200", "HFC-227ea", "HFC227ea", "ECARO-25",
    "Inert Gas", "ระบบก๊าซเฉื่อย", "IG-541", "IG541", "IG-100", "IG100", "IG-55", "Inergen",
    "ระบบก๊าซคาร์บอนไดออกไซด์", "ระบบ CO2 ดับเพลิง", "CO2 Fire Suppression", "ก๊าซคาร์บอนไดออกไซด์ดับเพลิง",
    "ระบบดับเพลิงห้องครัว", "ระบบดับเพลิงในห้องครัว", "Kitchen Fire Suppression", "Kitchen Hood System", "Wet Chemical",
    "ระบบละอองน้ำดับเพลิง", "Water Mist System", "Water Mist", "ระบบละอองน้ำแรงดันสูง",
    "ระบบโฟมดับเพลิง", "ระบบดับเพลิงด้วยโฟม", "Foam System", "Foam Proportioner", "น้ำยาโฟมดับเพลิง", "AFFF", "AR-AFFF",
    "National Foam", "Foam Chamber", "Foam Monitor",
    "ถังดับเพลิง", "เครื่องดับเพลิงยกหิ้ว", "เครื่องดับเพลิง", "ถังดับเพลิงเคมีแห้ง", "ถังดับเพลิง CO2", "ถังดับเพลิงสารสะอาด",
    "เครื่องดับเพลิงชนิดก๊าซ", "เครื่องดับเพลิงชนิดโฟม", "Badger", "Total Fire",
    "ระบบดับเพลิงห้องเซิร์ฟเวอร์", "ระบบดับเพลิงห้อง Server", "ระบบดับเพลิงห้อง Data Center", "ระบบดับเพลิงห้องควบคุมไฟฟ้า",
    "Ansul", "Kidde", "Fire-Trace", "Pyro-Chem", "SEVO"
  ],

  // 4. ระบบสายส่งน้ำดับเพลิง ตู้ดับเพลิง หัวรับน้ำ วาล์ว และข้อต่อ
  fire_hydrant_equipment: [
    "ตู้สายฉีดน้ำดับเพลิง", "ตู้ดับเพลิง", "Fire Hose Cabinet", "FHC", "ตู้เก็บสายฉีดน้ำดับเพลิง", "ตู้โฮสริว", "ตู้โฮสแร็ค",
    "สายส่งน้ำดับเพลิง", "สายฉีดน้ำดับเพลิง", "Fire Hose", "Fire Hose Reel", "Fire Hose Rack", "กงล้อสายส่งน้ำดับเพลิง",
    "หัวฉีดน้ำดับเพลิง", "Fire Nozzle", "หัวรับน้ำดับเพลิง", "Siamese Connection", "หัวจ่ายน้ำดับเพลิง",
    "หัวดับเพลิง", "Fire Hydrant", "หัวดับเพลิงเสาสาธารณะ", "หัวจ่ายน้ำดับเพลิงภายนอกอาคาร",
    "วาล์วระบบดับเพลิง", "Fire Protection Valve", "OS&Y Gate Valve", "Butterfly Valve ดับเพลิง", "Check Valve ดับเพลิง", "Gate Valve ดับเพลิง",
    "ข้อต่อกรูฟ", "ข้อต่อกรู๊ฟ", "Grooved Coupling", "Grooved Fitting", "Mechanical Tee",
    "ท่อส่งน้ำดับเพลิง", "ท่อดับเพลิง", "ติดตั้งท่อดับเพลิง", "เดินท่อดับเพลิง", "ระบบท่อดับเพลิง",
    "NIBCO", "Dixon", "Dixon Powhatan", "Potter Roemer", "SRI", "Victaulic", "Newage"
  ],

  // 5. อุปกรณ์ความปลอดภัย ไฟฉุกเฉิน ป้ายทางออก และชุดกู้ภัย
  safety_ppe_emergency: [
    "ไฟฉุกเฉิน", "โคมไฟฉุกเฉิน", "Emergency Light", "ไฟฉุกเฉินอัตโนมัติ", "ระบบไฟฉุกเฉิน",
    "ป้ายทางออกฉุกเฉิน", "ป้ายไฟทางออกฉุกเฉิน", "ป้ายทางหนีไฟ", "ป้ายไฟทางหนีไฟ", "Exit Sign", "Emergency Exit Sign", "Max Bright", "Maxbright",
    "สายไฟทนไฟ", "Fire Resistant Cable", "FRC Cable", "FRC", "MCI-DRAKA",
    "ตู้เก็บสารเคมี", "ตู้เก็บสารไวไฟ", "Flammable Cabinet", "Safety Cabinet", "ตู้เซฟตี้เก็บสารเคมี",
    "อ่างล้างตาฉุกเฉิน", "ฝักบัวฉุกเฉิน", "Emergency Shower", "Emergency Eyewash", "Emergency Shower and Eyewash",
    "ชุดดับเพลิง", "ชุดผจญเพลิง", "Fire Fighting Suit", "ชุดป้องกันไฟ", "เครื่องช่วยหายใจ", "SCBA", "หน้ากาก SCBA",
    "ถังอัดอากาศดับเพลิง", "หมวกดับเพลิง", "ถุงมือดับเพลิง", "รองเท้าดับเพลิง", "อุปกรณ์กู้ภัยดับเพลิง",
    "วัสดุดูดซับสารเคมี", "Absorbents", "พาเลทรองรับสารเคมี"
  ]
};

// Exclude list to reject false positives (strictly irrelevant civil, medical, waste, office goods)
export const EXCLUDE_KEYWORDS = [
  // 1. Waste / Sanitation / Civil Road Works
  "รถดูดสิ่งปฏิกูล", "รถบรรทุกขยะ", "จัดเก็บขยะ", "กำจัดขยะ", "จ้างเหมาทำความสะอาด", "แม่บ้าน",
  "ถนนลาดยาง", "แอสฟัลท์", "ตีเส้นจราจร", "ป้ายจราจร", "สะพานลอย", "ขุดลอกคลอง", "ถมดิน", "ดินลูกรัง",
  // 2. Automotive maintenance (avoid "ยางรถดับเพลิง" false positive)
  "เปลี่ยนยางรถยนต์", "ปะยาง", "น้ำมันเครื่อง", "ซ่อมบำรุงรถยนต์", "ซ่อมยานพาหนะ",
  // 3. Hospital consumable / Medical goods
  "ยาเวชภัณฑ์", "เวชภัณฑ์ยา", "ถุงมือตรวจโรค", "ถุงมือแพทย์", "เตียงผู้ป่วย", "ผ้าปูที่นอน", "อาหารเสริม",
  // 4. Food, seminars & catering
  "อาหารกลางวัน", "จัดเลี้ยง", "จัดประชุมสัมมนา", "ฝึกอบรมทั่วไป", "ค่าเช่าสถานที่",
  // 5. Landscaping
  "สนามหญ้า", "ตัดหญ้า", "ตกแต่งสวน", "ไม้ประดับ"
];

// Flat keywords array
export const KEYWORDS = Object.values(PRODUCT_GROUPS).flat();

/**
 * Classify announcement title into FTE product groups based on keywords
 * @param {string} title - The title of the announcement
 * @returns {Array<{group: string, matchedKeywords: string[]}>} Array of matched groups with keywords
 */
export function classifyAnnouncement(title) {
  if (!title) return [];
  
  const lowerTitle = title.toLowerCase();

  // Check exclude list first
  for (const ex of EXCLUDE_KEYWORDS) {
    if (lowerTitle.includes(ex.toLowerCase())) {
      return [];
    }
  }

  const matchedGroups = [];

  for (const [group, keywords] of Object.entries(PRODUCT_GROUPS)) {
    const matched = keywords.filter(keyword => lowerTitle.includes(keyword.toLowerCase()));
    
    if (matched.length > 0) {
      matchedGroups.push({
        group,
        matchedKeywords: matched
      });
    }
  }

  return matchedGroups;
}
