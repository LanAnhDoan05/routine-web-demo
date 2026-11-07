const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const parsed = new URL(dbUrl);
const user = parsed.username;
const password = decodeURIComponent(parsed.password);
const host = parsed.hostname || 'localhost';
const port = parsed.port || '3306';
const database = parsed.pathname.replace(/^\//, '');

const sqlFilePath = path.join(__dirname, '../Routine_db.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`File not found: ${sqlFilePath}`);
  process.exit(1);
}

const stats = fs.statSync(sqlFilePath);
const totalBytes = stats.size;
console.log(`Bắt đầu Import an toàn file: ${sqlFilePath}`);
console.log(`Kích thước file: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Kết nối tới MySQL: ${user}@${host}:${port}/${database}`);

const mysqlArgs = [
  `-u${user}`,
  `-p${password}`,
  `-h${host}`,
  `-P${port}`,
  '--default-character-set=utf8mb4',
  '--max-allowed-packet=512M',
  database,
];

const mysqlProcess = spawn('mysql', mysqlArgs, {
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true,
});

let errorOutput = '';
mysqlProcess.stderr.on('data', (chunk) => {
  const msg = chunk.toString();
  // Bỏ qua cảnh báo password trên command line
  if (!msg.includes('[Warning] Using a password on the command line interface can be insecure.')) {
    errorOutput += msg;
  }
});

mysqlProcess.stdout.on('data', (chunk) => {
  console.log(chunk.toString());
});

const fileStream = fs.createReadStream(sqlFilePath, { encoding: 'utf8' });
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let bytesRead = 0;
let lastReportPercent = 0;
let inGtidBlock = false;

rl.on('line', (line) => {
  bytesRead += Buffer.byteLength(line, 'utf8') + 1;

  // Lọc bỏ / comment out các lệnh GTID & SQL_LOG_BIN gây lỗi trên MySQL local
  if (line.includes('SET @@GLOBAL.GTID_PURGED')) {
    inGtidBlock = true;
    mysqlProcess.stdin.write(`-- ${line}\n`);
    if (line.includes(';')) inGtidBlock = false;
    return;
  }

  if (inGtidBlock) {
    mysqlProcess.stdin.write(`-- ${line}\n`);
    if (line.includes(';')) inGtidBlock = false;
    return;
  }

  if (line.includes('SQL_LOG_BIN')) {
    mysqlProcess.stdin.write(`-- ${line}\n`);
    return;
  }

  mysqlProcess.stdin.write(line + '\n');

  const percent = Math.floor((bytesRead / totalBytes) * 100);
  if (percent >= lastReportPercent + 10) {
    lastReportPercent = percent;
    console.log(`Tiến độ import: ${percent}% (${(bytesRead / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)...`);
  }
});

rl.on('close', () => {
  console.log('Đã đọc hết file SQL. Đang hoàn tất ghi vào MySQL...');
  mysqlProcess.stdin.end();
});

mysqlProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ IMPORT THÀNH CÔNG 100% VÀO DATABASE ' + database + '!');
  } else {
    console.error(`\n❌ Import gặp lỗi với exit code ${code}:`);
    console.error(errorOutput);
  }
});
