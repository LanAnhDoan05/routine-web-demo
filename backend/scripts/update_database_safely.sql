-- ====================================================================
-- Routine Web - Safe Database Update Script
-- Hướng dẫn: Bạn có thể mở file này trong MySQL Workbench,
-- chọn database routine_db và bấm Execute (biểu tượng ⚡) để chạy.
-- Script này an toàn: KHÔNG làm mất dữ liệu, chỉ tạo bảng & bổ sung cột.
-- ====================================================================

USE `routine_db`;

-- --------------------------------------------------------------------
-- 1. BẢNG GIỮ HÀNG TẠM THỜI (5 PHÚT KHI THANH TOÁN)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_reservations` (
  `id` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL,
  `items` JSON NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_reservations_order_id_key` (`order_id`),
  KEY `stock_reservations_expires_at_idx` (`expires_at`),
  CONSTRAINT `stock_reservations_order_id_fkey`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. BẢNG CẤU HÌNH HỆ THỐNG / HERO BANNER
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `store_settings` (
  `setting_key` VARCHAR(191) NOT NULL,
  `setting_value` LONGTEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Nạp cấu hình hero banner mặc định nếu chưa có
INSERT INTO `store_settings` (`setting_key`, `setting_value`, `description`)
SELECT
  'home_hero_banners',
  '{"banners":[{"id":"hb-1","url":"/images/hero/hero-banner-1.svg","title":"Style That Fits You - Look 1","isPrimary":true},{"id":"hb-2","url":"/images/hero/hero-banner-2.svg","title":"Urban Chic - Look 2","isPrimary":false},{"id":"hb-3","url":"/images/hero/hero-banner-3.svg","title":"Daily Essentials - Look 3","isPrimary":false}],"slideInterval":2500,"title":"STYLE THAT FITS YOU","subtitle":"Khám phá phong cách phù hợp với bạn.\\nThời trang không chỉ là mặc gì. Đó là cách bạn thể hiện chính mình.","exploreLink":"/category/new-arrivals","outfitLink":"/smart-outfit"}',
  'Cấu hình Hero Banner toàn màn hình & Slide Trang chủ'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `store_settings` WHERE `setting_key` = 'home_hero_banners'
);

-- --------------------------------------------------------------------
-- 3. BẢNG BIỂU PHÍ & QUY TẮC VẬN CHUYỂN CHO AI VECTOR (shipping_rules)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shipping_rules` (
  `id` VARCHAR(191) NOT NULL,
  `city` VARCHAR(100) NOT NULL COMMENT 'Tên Tỉnh/Thành phố hoặc ALL',
  `district` VARCHAR(100) NULL COMMENT 'Quận/Huyện',
  `region` VARCHAR(50) NOT NULL DEFAULT 'NORTH' COMMENT 'NORTH, CENTRAL, SOUTH',
  `base_fee` INT NOT NULL DEFAULT 30000 COMMENT 'Cước phí cơ bản (VNĐ)',
  `free_ship_threshold` INT NULL DEFAULT 499000 COMMENT 'Mức giá tối thiểu được Freeship',
  `estimated_delivery` VARCHAR(100) NULL DEFAULT '2-3 ngày' COMMENT 'Thời gian dự kiến',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `shipping_rules_city_idx` (`city`),
  KEY `shipping_rules_region_idx` (`region`)
) ENGINE=InnoDB 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Nạp dữ liệu bảng giá cước mẫu cho AI tra cứu
INSERT INTO `shipping_rules` (`id`, `city`, `district`, `region`, `base_fee`, `free_ship_threshold`, `estimated_delivery`, `is_active`)
VALUES
  ('ship-hn-noi-thanh', 'Hà Nội', 'Nội thành', 'NORTH', 20000, 399000, 'Hỏa tốc trong ngày / 1 ngày', 1),
  ('ship-hn-ngoai-thanh', 'Hà Nội', 'Ngoại thành', 'NORTH', 30000, 499000, '1 - 2 ngày', 1),
  ('ship-hcm-noi-thanh', 'Hồ Chí Minh', 'Nội thành', 'SOUTH', 20000, 399000, 'Hỏa tốc trong ngày / 1 ngày', 1),
  ('ship-hcm-ngoai-thanh', 'Hồ Chí Minh', 'Ngoại thành', 'SOUTH', 30000, 499000, '1 - 2 ngày', 1),
  ('ship-da-nang', 'Đà Nẵng', NULL, 'CENTRAL', 25000, 499000, '1 - 2 ngày', 1),
  ('ship-mien-bac', 'Miền Bắc (Khác)', NULL, 'NORTH', 35000, 499000, '2 - 3 ngày', 1),
  ('ship-mien-trung', 'Miền Trung (Khác)', NULL, 'CENTRAL', 35000, 499000, '2 - 3 ngày', 1),
  ('ship-mien-nam', 'Miền Nam (Khác)', NULL, 'SOUTH', 35000, 499000, '2 - 3 ngày', 1)
ON DUPLICATE KEY UPDATE 
  `base_fee` = VALUES(`base_fee`),
  `free_ship_threshold` = VALUES(`free_ship_threshold`),
  `estimated_delivery` = VALUES(`estimated_delivery`);

-- --------------------------------------------------------------------
-- 4. BỔ SUNG CÁC CỘT ĐỊNH VỊ & ĐIỀU PHỐI VẬN CHUYỂN
-- --------------------------------------------------------------------
-- Cột tọa độ bảng stores (cửa hàng)
ALTER TABLE `stores` 
  ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(10, 7) NULL;

-- Cột tọa độ bảng addresses (địa chỉ giao hàng của khách)
ALTER TABLE `addresses` 
  ADD COLUMN IF NOT EXISTS `latitude` DECIMAL(10, 7) NULL,
  ADD COLUMN IF NOT EXISTS `longitude` DECIMAL(10, 7) NULL;

-- Cột chỉ định cửa hàng & ngày nhận dự kiến trong bảng orders (đơn hàng)
ALTER TABLE `orders` 
  ADD COLUMN IF NOT EXISTS `store_id` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `estimated_delivery_date` DATETIME(3) NULL;

-- Cột tọa độ không gian Vector 2 chiều trong bảng products (sản phẩm)
ALTER TABLE `products` 
  ADD COLUMN IF NOT EXISTS `vector_x` DECIMAL(6, 3) NULL,
  ADD COLUMN IF NOT EXISTS `vector_y` DECIMAL(6, 3) NULL;

-- --------------------------------------------------------------------
-- 5. TRUY VẤN KIỂM TRA SAU KHI CẬP NHẬT
-- --------------------------------------------------------------------
SELECT * FROM `shipping_rules`;
SELECT `id`, `name`, `city`, `latitude`, `longitude` FROM `stores` LIMIT 5;
SELECT `id`, `name`, `vector_x`, `vector_y` FROM `products` LIMIT 5;