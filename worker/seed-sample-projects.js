// Use native fetch

const sampleAnnouncements = [
  {
    id: "69010001",
    project_id: "69010001001",
    project_name: "ประกวดราคาซื้อระบบแจ้งเหตุเพลิงไหม้อัตโนมัติ (Fire Alarm System) อาคารผู้ป่วยนอก โรงพยาบาลศูนย์ขอนแก่น",
    announce_type: "D0",
    announce_date: new Date().toISOString(),
    budget: 4850000,
    department: "โรงพยาบาลขอนแก่น สำนักงานปลัดกระทรวงสาธารณสุข",
    province: "ขอนแก่น",
    product_group: "fire_alarm",
    url: "https://process5.gprocurement.go.th"
  },
  {
    id: "69010002",
    project_id: "69010002002",
    project_name: "จ้างติดตั้งเครื่องสูบน้ำดับเพลิง (Fire Pump) ชนิดเครื่องยนต์ดีเซลตามมาตรฐาน NFPA 20 ศูนย์ราชการจังหวัดนนทบุรี",
    announce_type: "B0",
    announce_date: new Date().toISOString(),
    budget: 8200000,
    department: "สำนักงานจังหวัดนนทบุรี",
    province: "นนทบุรี",
    product_group: "fire_sprinkler_pump",
    url: "https://process5.gprocurement.go.th"
  },
  {
    id: "69010003",
    project_id: "69010003003",
    project_name: "ประกวดราคาจ้างติดตั้งระบบดับเพลิงอัตโนมัติด้วยสารสะอาด Novec 1230 ห้องดาต้าเซ็นเตอร์ (Data Center) ธนาคารแห่งประเทศไทย",
    announce_type: "15",
    announce_date: new Date().toISOString(),
    budget: 6400000,
    department: "ธนาคารแห่งประเทศไทย",
    province: "กรุงเทพมหานคร",
    product_group: "fire_suppression_gas",
    url: "https://process5.gprocurement.go.th"
  },
  {
    id: "69010004",
    project_id: "69010004004",
    project_name: "แผนจัดซื้อจัดจ้างปรับปรุงตู้สายส่งน้ำดับเพลิง (FHC) และระบบหัวดับเพลิงภายนอกอาคาร ท่าอากาศยานสุวรรณภูมิ",
    announce_type: "P0",
    announce_date: new Date().toISOString(),
    budget: 3750000,
    department: "บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)",
    province: "สมุทรปราการ",
    product_group: "fire_hydrant_equipment",
    url: "https://process5.gprocurement.go.th"
  },
  {
    id: "69010005",
    project_id: "69010005005",
    project_name: "ประกวดราคาซื้อโคมไฟฉุกเฉิน LED และป้ายทางออกหนีไฟฉุกเฉิน (Exit Sign) พร้อมสายไฟทนไฟ FRC",
    announce_type: "D0",
    announce_date: new Date().toISOString(),
    budget: 1950000,
    department: "มหาวิทยาลัยธรรมศาสตร์ ศูนย์รังสิต",
    province: "ปทุมธานี",
    product_group: "safety_ppe_emergency",
    url: "https://process5.gprocurement.go.th"
  },
  {
    id: "69010006",
    project_id: "69010006006",
    project_name: "ประกาศผู้ชนะการเสนอราคา ปรับปรุงระบบหัวกระจายน้ำดับเพลิงอัตโนมัติ (Fire Sprinkler) อาคารสำนักงานใหญ่ กฟผ.",
    announce_type: "W0",
    announce_date: new Date().toISOString(),
    budget: 5200000,
    department: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย",
    province: "นนทบุรี",
    product_group: "fire_sprinkler_pump",
    url: "https://process5.gprocurement.go.th",
    winner_name: "บริษัท ไฟร์เทรดเอ็นจิเนียริ่ง จำกัด (มหาชน)",
    winner_price: 4890000,
    winner_tax_id: "0107559000371",
    discount_percent: 5.96
  },
  {
    id: "69010007",
    project_id: "69010007007",
    project_name: "ประกาศผู้ชนะการเสนอราคา ซื้อชุดถังดับเพลิงสารสะอาดและถังเคมีแห้ง ประจำปีงบประมาณ 2569",
    announce_type: "W0",
    announce_date: new Date().toISOString(),
    budget: 1450000,
    department: "การทางพิเศษแห่งประเทศไทย",
    province: "กรุงเทพมหานคร",
    product_group: "fire_suppression_gas",
    url: "https://process5.gprocurement.go.th",
    winner_name: "บริษัท ไฟร์เทรดเอ็นจิเนียริ่ง จำกัด (มหาชน)",
    winner_price: 1380000,
    winner_tax_id: "0107559000371",
    discount_percent: 4.83
  }
];

(async () => {
  console.log('Uploading sample FTE announcements to local Worker...');
  const res = await fetch('http://localhost:8787/api/upload/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'fte-scraper-internal-api-key'
    },
    body: JSON.stringify(sampleAnnouncements)
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Upload Result:', JSON.stringify(json, null, 2));
})();
