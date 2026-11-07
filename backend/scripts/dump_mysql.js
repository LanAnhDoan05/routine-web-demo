const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Parse DATABASE_URL: mysql://root:password@localhost:3306/routine_db
const parsed = new URL(dbUrl);
const user = parsed.username;
const password = decodeURIComponent(parsed.password);
const host = parsed.hostname || 'localhost';
const port = parsed.port || '3306';
const database = parsed.pathname.replace(/^\//, '');

const backendOutputFile = path.join(__dirname, '../Routine_db.sql');
const rootOutputFile = path.join(__dirname, '../../Routine_db.sql');

console.log(`Đang xuất dump cơ sở dữ liệu "${database}" từ ${host}:${port}...`);

// Dùng --result-file để ghi trực tiếp, tránh tràn RAM bộ đệm Node.js
const cmd = `mysqldump -u ${user} -p"${password}" -h ${host} -P ${port} --default-character-set=utf8mb4 --hex-blob --routines --triggers --add-drop-table --result-file="${backendOutputFile}" ${database}`;

try {
  execSync(cmd, { stdio: 'inherit' });

  // Sao chép sang thư mục gốc để tiện lợi ở cả 2 nơi
  fs.copyFileSync(backendOutputFile, rootOutputFile);

  const stats = fs.statSync(backendOutputFile);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Xuất thành công file dump Routine_db.sql:`);
  console.log(`   - Thư mục backend: ${backendOutputFile} (${sizeMB} MB)`);
  console.log(`   - Thư mục gốc project: ${rootOutputFile} (${sizeMB} MB)`);
} catch (err) {
  console.error('Dump thất bại:', err.message);
  process.exit(1);
}
