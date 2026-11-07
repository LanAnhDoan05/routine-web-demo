const prisma = require('../src/config/prisma');

const STORES_DATA = [
  // A. Thành phố Hồ Chí Minh và khu vực lân cận (12 cửa hàng)
  {
    name: "Routine Lê Lợi",
    slug: "routine-le-loi",
    address: "34 Lê Lợi, phường Sài Gòn, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3821 0088",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=34+Lê+Lợi+TP+Hồ+Chí+Minh",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine U SPACE Sư Vạn Hạnh",
    slug: "routine-u-space-su-van-hanh",
    address: "583 Sư Vạn Hạnh, phường Hòa Hưng, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3862 8888",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=583+Sư+Vạn+Hạnh+TP+Hồ+Chí+Minh",
    isFlagship: true,
    isActive: true,
  },
  {
    name: "Routine Gò Vấp Flagship Store",
    slug: "routine-go-vap-flagship-store",
    address: "523A Quang Trung, phường Gò Vấp, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3894 5678",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=523A+Quang+Trung+Gò+Vấp",
    isFlagship: true,
    isActive: true,
  },
  {
    name: "Routine Võ Văn Ngân",
    slug: "routine-vo-van-ngan",
    address: "114 Võ Văn Ngân, TP. Thủ Đức, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3722 8999",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=114+Võ+Văn+Ngân+Thủ+Đức",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Vũng Tàu",
    slug: "routine-vung-tau",
    address: "259 Ba Cu, TP. Vũng Tàu",
    city: "Bà Rịa - Vũng Tàu",
    region: "SOUTH",
    phone: "0254 354 1188",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=259+Ba+Cu+Vũng+Tàu",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Hoa Lan",
    slug: "routine-hoa-lan",
    address: "192–194 Hoa Lan, quận Phú Nhuận, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3517 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=192+Hoa+Lan+Phú+Nhuận",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Âu Cơ",
    slug: "routine-au-co",
    address: "655–657 Âu Cơ, quận Tân Phú, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3849 8888",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=655+Âu+Cơ+Tân+Phú",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Nguyễn Thị Thập",
    slug: "routine-nguyen-thi-thap",
    address: "508 Nguyễn Thị Thập, quận 7, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3775 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=508+Nguyễn+Thị+Thập+Quận+7",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine GV",
    slug: "routine-gv",
    address: "145 Quang Trung, quận Gò Vấp, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 3989 7788",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=145+Quang+Trung+Gò+Vấp",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Bình Dương",
    slug: "routine-binh-duong",
    address: "229B Yersin, phường Thủ Dầu Một, Bình Dương (khu vực TP.HCM)",
    city: "Bình Dương",
    region: "SOUTH",
    phone: "0274 385 6688",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=229B+Yersin+Thủ+Dầu+Một",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Aeon Mall Tân Phú",
    slug: "routine-aeon-mall-tan-phu",
    address: "F15, tầng 1, AEON Mall Tân Phú, 30 Bờ Bao Tân Thắng, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 6269 2188",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=AEON+Mall+Tân+Phú+30+Bờ+Bao+Tân+Thắng",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Aeon Mall Bình Tân",
    slug: "routine-aeon-mall-binh-tan",
    address: "Lô F18–19, tầng 1, TTTM AEON Mall Bình Tân, số 1 đường số 17A, khu phố 11, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    region: "SOUTH",
    phone: "028 6277 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=AEON+Mall+Bình+Tân+1+đường+17A",
    isFlagship: false,
    isActive: true,
  },

  // B. Hà Nội (5 cửa hàng)
  {
    name: "Routine Chùa Bộc",
    slug: "routine-chua-boc",
    address: "35 Chùa Bộc, quận Đống Đa, Hà Nội",
    city: "Hà Nội",
    region: "NORTH",
    phone: "024 3564 3388",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=35+Chùa+Bộc+Hà+Nội",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Aeon Mall Long Biên",
    slug: "routine-aeon-mall-long-bien",
    address: "Lô T240-1, tầng 2, TTTM AEON Mall Long Biên, số 27 đường Cổ Linh, Hà Nội",
    city: "Hà Nội",
    region: "NORTH",
    phone: "024 3200 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=AEON+Mall+Long+Biên+27+Cổ+Linh",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Aeon Mall Hà Đông",
    slug: "routine-aeon-mall-ha-dong",
    address: "Lô T231, tầng 2, TTTM AEON Mall Hà Đông, phố Hoàng Văn Thụ, Hà Nội",
    city: "Hà Nội",
    region: "NORTH",
    phone: "024 3201 6688",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=AEON+Mall+Hà+Đông",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Mai Hắc Đế",
    slug: "routine-mai-hac-de",
    address: "73A Mai Hắc Đế, quận Hai Bà Trưng, Hà Nội",
    city: "Hà Nội",
    region: "NORTH",
    phone: "024 3974 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=73A+Mai+Hắc+Đế+Hà+Nội",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Cầu Giấy",
    slug: "routine-cau-giay",
    address: "133 Cầu Giấy, quận Cầu Giấy, Hà Nội",
    city: "Hà Nội",
    region: "NORTH",
    phone: "024 3839 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=133+Cầu+Giấy+Hà+Nội",
    isFlagship: false,
    isActive: true,
  },

  // C. Đà Nẵng (2 cửa hàng)
  {
    name: "Routine Nguyễn Văn Thoại",
    slug: "routine-nguyen-van-thoai",
    address: "62 Nguyễn Văn Thoại, quận Ngũ Hành Sơn, Đà Nẵng",
    city: "Đà Nẵng",
    region: "CENTRAL",
    phone: "0236 395 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=62+Nguyễn+Văn+Thoại+Đà+Nẵng",
    isFlagship: false,
    isActive: true,
  },
  {
    name: "Routine Đà Nẵng",
    slug: "routine-da-nang-le-duan",
    address: "415–417 Lê Duẩn, quận Thanh Khê, Đà Nẵng",
    city: "Đà Nẵng",
    region: "CENTRAL",
    phone: "0236 375 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=415+Lê+Duẩn+Đà+Nẵng",
    isFlagship: true,
    isActive: true,
  },

  // D. Hải Phòng (1 cửa hàng)
  {
    name: "Routine Aeon Mall Hải Phòng",
    slug: "routine-aeon-mall-hai-phong",
    address: "Lô T302, tầng 3, TTTM AEON Mall Hải Phòng, số 10 đường Võ Nguyên Giáp, quận Lê Chân, Hải Phòng",
    city: "Hải Phòng",
    region: "NORTH",
    phone: "0225 385 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=AEON+Mall+Hải+Phòng+Võ+Nguyên+Giáp",
    isFlagship: false,
    isActive: true,
  },

  // E. Lào Cai (1 cửa hàng)
  {
    name: "Routine Lào Cai",
    slug: "routine-lao-cai",
    address: "198D Hoàng Liên, TP. Lào Cai, Lào Cai",
    city: "Lào Cai",
    region: "NORTH",
    phone: "0214 386 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=198D+Hoàng+Liên+Lào+Cai",
    isFlagship: false,
    isActive: true,
  },

  // F. Lạng Sơn (1 cửa hàng)
  {
    name: "Routine Lạng Sơn",
    slug: "routine-lang-son",
    address: "130 Trần Đăng Ninh, TP. Lạng Sơn, Lạng Sơn",
    city: "Lạng Sơn",
    region: "NORTH",
    phone: "0205 387 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=130+Trần+Đăng+Ninh+Lạng+Sơn",
    isFlagship: false,
    isActive: true,
  },

  // G. Gia Lai (1 cửa hàng)
  {
    name: "Routine Gia Lai",
    slug: "routine-gia-lai",
    address: "75 Hai Bà Trưng, TP. Pleiku, Gia Lai",
    city: "Gia Lai",
    region: "CENTRAL",
    phone: "0269 388 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=75+Hai+Bà+Trưng+Pleiku+Gia+Lai",
    isFlagship: false,
    isActive: true,
  },

  // H. Quảng Ngãi (1 cửa hàng)
  {
    name: "Routine Quảng Ngãi",
    slug: "routine-quang-ngai",
    address: "311 Phan Bội Châu, TP. Quảng Ngãi, Quảng Ngãi",
    city: "Quảng Ngãi",
    region: "CENTRAL",
    phone: "0255 382 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=311+Phan+Bội+Châu+Quảng+Ngãi",
    isFlagship: false,
    isActive: true,
  },

  // I. Cà Mau (1 cửa hàng)
  {
    name: "Routine Cà Mau",
    slug: "routine-ca-mau",
    address: "169 Bùi Thị Trường, TP. Cà Mau, Cà Mau",
    city: "Cà Mau",
    region: "SOUTH",
    phone: "0290 383 8899",
    openingHours: "09:00 - 22:00",
    mapUrl: "https://maps.google.com/?q=169+Bùi+Thị+Trường+Cà+Mau",
    isFlagship: false,
    isActive: true,
  },
];

async function setupAndSeed() {
  console.log("Tạo bảng stores nếu chưa có...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`stores\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      \`slug\` VARCHAR(255) NOT NULL,
      \`address\` VARCHAR(500) NOT NULL,
      \`city\` VARCHAR(100) NOT NULL,
      \`region\` VARCHAR(50) NOT NULL DEFAULT 'SOUTH',
      \`phone\` VARCHAR(50) NULL,
      \`opening_hours\` VARCHAR(100) NULL DEFAULT '09:00 - 22:00',
      \`map_url\` VARCHAR(500) NULL,
      \`image\` VARCHAR(500) NULL,
      \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
      \`is_flagship\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`stores_slug_key\` (\`slug\`),
      KEY \`stores_city_idx\` (\`city\`),
      KEY \`stores_region_idx\` (\`region\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Bắt đầu nạp 25 cửa hàng Routine...");
  let count = 0;
  for (const s of STORES_DATA) {
    const id = `store_${s.slug.replace(/-/g, '_')}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO \`stores\` (
        \`id\`, \`name\`, \`slug\`, \`address\`, \`city\`, \`region\`,
        \`phone\`, \`opening_hours\`, \`map_url\`, \`is_flagship\`, \`is_active\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`address\` = VALUES(\`address\`),
        \`city\` = VALUES(\`city\`),
        \`region\` = VALUES(\`region\`),
        \`phone\` = VALUES(\`phone\`),
        \`opening_hours\` = VALUES(\`opening_hours\`),
        \`map_url\` = VALUES(\`map_url\`),
        \`is_flagship\` = VALUES(\`is_flagship\`),
        \`is_active\` = VALUES(\`is_active\`)
    `, id, s.name, s.slug, s.address, s.city, s.region,
       s.phone, s.openingHours, s.mapUrl, s.isFlagship ? 1 : 0, s.isActive ? 1 : 0);
    count++;
  }

  console.log(`✅ Đã nạp thành công ${count} cửa hàng Routine vào bảng 'stores'!`);
  const result = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM stores');
  console.log(`Tổng số cửa hàng trong CSDL hiện tại:`, Number(result[0].total));

  await prisma.$disconnect();
}

setupAndSeed().catch((err) => {
  console.error("Lỗi khi setup và seed stores:", err);
  process.exit(1);
});
