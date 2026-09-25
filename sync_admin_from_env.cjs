const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 1. Read .env file from project root
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ไม่พบไฟล์ .env ในโฟลเดอร์โปรเจกต์');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
}

const adminEmail = (env.ADMIN_EMAIL || '').trim();
const adminPassword = (env.ADMIN_PASSWORD || '').trim();
const adminUsername = (env.ADMIN_USERNAME || (adminEmail ? adminEmail.split('@')[0] : 'fte.admin')).trim();
const recoveryKey = (env.RECOVERY_KEY || '').trim();

if (!adminPassword) {
  console.log('⚠️ ยังไม่ได้ระบุ ADMIN_PASSWORD ในไฟล์ .env');
  console.log('👉 กรุณาเปิดไฟล์ .env แล้วกรอก ADMIN_USERNAME, ADMIN_EMAIL และ ADMIN_PASSWORD ให้เรียบร้อย จากนั้นรันคำสั่ง:');
  console.log('   node sync_admin_from_env.cjs');
  process.exit(0);
}

// 2. Hash Password using PBKDF2 (100,000 iterations, 32 bytes, SHA-256) matching Cloudflare Worker
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

const fullHash = hashPassword(adminPassword);
const adminId = crypto.randomUUID();
const cleanEmail = adminEmail || 'admin@firetrade.co.th';
const cleanUsername = adminUsername.toLowerCase();

console.log('====================================================');
console.log('🔄 กำลังซิงค์บัญชี Admin เดี่ยวเข้าสู่ Cloudflare D1...');
console.log(`👤 Username: ${cleanUsername}`);
console.log(`📧 Email:    ${cleanEmail}`);
console.log('====================================================');

// 3. Clear all old users and ensure ONLY this admin exists
const sqlCommands = [
  // Remove all sessions
  `DELETE FROM user_sessions;`,
  // Remove all other users
  `DELETE FROM users;`,
  // Insert single admin
  `INSERT INTO users (id, username, email, password_hash, name, role, status, receive_email) VALUES ('${adminId}', '${cleanUsername}', '${cleanEmail}', '${fullHash}', 'Admin', 'admin', 'approved', 1);`
];

const batchSql = sqlCommands.join(' ');

try {
  const command = `npx wrangler d1 execute gprocurement-fte-db --remote --command "${batchSql.replace(/"/g, '\\"')}"`;
  execSync(command, { stdio: 'inherit' });
  console.log('\n✅ สำเร็จ! ระบบได้รีเซ็ตและบันทึก Admin เพียงคนเดียวในระบบเรียบร้อยแล้ว:');
  console.log(`   - Username: ${cleanUsername}`);
  console.log(`   - Email:    ${cleanEmail}`);
  console.log('   - Role:     admin (ผู้ดูแลระบบสูงสุด)');
  console.log('   - บัญชีอื่นทั้งหมดถูกลบออกจากระบบ 100%');
  console.log('👉 สามารถเข้าสู่ระบบได้ที่: https://gprocurement-fte-web.pages.dev/login.html');
} catch (err) {
  console.error('\n❌ เกิดข้อผิดพลาดในการซิงค์ฐานข้อมูล D1:', err.message);
  process.exit(1);
}
