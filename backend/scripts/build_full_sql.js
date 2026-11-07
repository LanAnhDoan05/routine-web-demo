const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');
const backendDir = path.resolve(__dirname, '..');

// Helper to escape SQL strings
function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toSqlDateTime(val) {
  if (!val) return '2026-09-01 00:00:00';
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return String(val).replace('T', ' ').replace(/\..+$/, '').replace('Z', '');
  }
  const YYYY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
}

const { pathToFileURL } = require('url');

async function generate() {
  console.log('Loading frontend and backend data...');

  const { products } = await import(pathToFileURL(path.join(frontendDir, 'data', 'products.js')).href);
  const { productSeeds } = await import(pathToFileURL(path.join(frontendDir, 'data', 'productSeeds.mjs')).href);
  const { categories } = await import(pathToFileURL(path.join(frontendDir, 'data', 'categories.js')).href);
  const { styles } = await import(pathToFileURL(path.join(frontendDir, 'data', 'styles.js')).href);
  const { colors } = await import(pathToFileURL(path.join(frontendDir, 'data', 'colors.js')).href);
  const { sizes } = await import(pathToFileURL(path.join(frontendDir, 'data', 'sizes.js')).href);
  const { outfits } = await import(pathToFileURL(path.join(frontendDir, 'data', 'outfits.js')).href);
  const { seedOrders } = await import(pathToFileURL(path.join(frontendDir, 'data', 'orders.js')).href);
  const { reviews } = require(path.join(backendDir, 'src', 'data', 'reviews.js'));

  console.log(`Loaded:
  - Products: ${products.length}
  - Product Seeds: ${productSeeds.length}
  - Categories: ${categories.length}
  - Styles: ${styles.length}
  - Colors: ${colors.length}
  - Sizes: ${sizes.length}
  - Outfits: ${outfits.length}
  - Seed Orders: ${seedOrders.length}
  - Reviews: ${reviews.length}
  `);

  // Map productSeeds by ID to enrich products
  const seedMap = new Map();
  productSeeds.forEach((s) => seedMap.set(s.id, s));

  let sql = `-- ==============================================================================
-- ROUTINE FASHION E-COMMERCE & SMART STYLING DATABASE
-- FULL SEED DUMP FOR MYSQL WORKBENCH / MYSQL 8.0+
-- Generated: ${new Date().toISOString()}
-- Database Name: routine_db
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS \`routine_db\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`routine_db\`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- Table 1: \`users\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`full_name\` VARCHAR(255) NOT NULL,
  \`phone_number\` VARCHAR(20) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  \`avatar\` VARCHAR(500) DEFAULT NULL,
  \`style_preference\` VARCHAR(100) DEFAULT 'minimal',
  \`status\` ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_users_phone\` (\`phone_number\`),
  UNIQUE KEY \`uk_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 2: \`addresses\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`addresses\`;
CREATE TABLE \`addresses\` (
  \`id\` VARCHAR(36) NOT NULL,
  \`user_id\` VARCHAR(36) NOT NULL,
  \`receiver_name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(20) NOT NULL,
  \`street\` VARCHAR(255) NOT NULL,
  \`ward\` VARCHAR(100) NOT NULL,
  \`district\` VARCHAR(100) NOT NULL,
  \`city\` VARCHAR(100) NOT NULL,
  \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_addresses_user_id\` (\`user_id\`),
  CONSTRAINT \`fk_addresses_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 3: \`colors\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`colors\`;
CREATE TABLE \`colors\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`hex_code\` VARCHAR(20) NOT NULL,
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 4: \`sizes\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`sizes\`;
CREATE TABLE \`sizes\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(50) NOT NULL,
  \`size_type\` VARCHAR(50) NOT NULL DEFAULT 'CLOTHING',
  \`sort_order\` INT NOT NULL DEFAULT 1,
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 5: \`categories\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`categories\`;
CREATE TABLE \`categories\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`slug\` VARCHAR(100) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`image\` VARCHAR(500) DEFAULT NULL,
  \`type\` VARCHAR(50) DEFAULT 'standard',
  \`parent_id\` VARCHAR(50) DEFAULT NULL,
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_categories_slug\` (\`slug\`),
  KEY \`idx_categories_parent\` (\`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 6: \`styles\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`styles\`;
CREATE TABLE \`styles\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`slug\` VARCHAR(100) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`image\` VARCHAR(500) DEFAULT NULL,
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_styles_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 7: \`products\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`products\`;
CREATE TABLE \`products\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`slug\` VARCHAR(150) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`short_description\` VARCHAR(500) DEFAULT NULL,
  \`price\` INT NOT NULL,
  \`original_price\` INT DEFAULT NULL,
  \`gender\` VARCHAR(20) NOT NULL DEFAULT 'unisex',
  \`category_id\` VARCHAR(50) DEFAULT NULL,
  \`category_slug\` VARCHAR(100) DEFAULT NULL,
  \`styles\` JSON DEFAULT NULL,
  \`badge\` VARCHAR(50) DEFAULT NULL,
  \`rating\` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  \`review_count\` INT NOT NULL DEFAULT 0,
  \`images\` JSON DEFAULT NULL,
  \`sizes\` JSON DEFAULT NULL,
  \`colors\` JSON DEFAULT NULL,
  \`stock_quantity\` INT NOT NULL DEFAULT 100,
  \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0,
  \`is_trending\` TINYINT(1) NOT NULL DEFAULT 0,
  \`status\` ENUM('ACTIVE', 'DRAFT', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  \`materials\` TEXT DEFAULT NULL,
  \`care\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_products_slug\` (\`slug\`),
  KEY \`idx_products_category\` (\`category_id\`),
  KEY \`idx_products_gender\` (\`gender\`),
  KEY \`idx_products_price\` (\`price\`),
  KEY \`idx_products_rating\` (\`rating\`),
  CONSTRAINT \`fk_products_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 8: \`product_variants\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`product_variants\`;
CREATE TABLE \`product_variants\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`product_id\` VARCHAR(50) NOT NULL,
  \`sku\` VARCHAR(100) NOT NULL,
  \`color\` VARCHAR(50) DEFAULT NULL,
  \`size\` VARCHAR(50) DEFAULT NULL,
  \`price\` INT NOT NULL,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`status\` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_variants_sku\` (\`sku\`),
  KEY \`idx_variants_product\` (\`product_id\`),
  CONSTRAINT \`fk_variants_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 9: \`outfits\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`outfits\`;
CREATE TABLE \`outfits\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`slug\` VARCHAR(150) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT DEFAULT NULL,
  \`image\` VARCHAR(500) NOT NULL,
  \`occasion\` VARCHAR(50) NOT NULL,
  \`style\` VARCHAR(50) NOT NULL,
  \`gender\` VARCHAR(20) NOT NULL DEFAULT 'unisex',
  \`season\` VARCHAR(50) DEFAULT NULL,
  \`featured\` TINYINT(1) NOT NULL DEFAULT 0,
  \`status\` ENUM('ACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_outfits_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 10: \`outfit_products\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`outfit_products\`;
CREATE TABLE \`outfit_products\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`outfit_id\` VARCHAR(50) NOT NULL,
  \`product_id\` VARCHAR(50) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_outfit_product\` (\`outfit_id\`, \`product_id\`),
  KEY \`idx_op_product\` (\`product_id\`),
  CONSTRAINT \`fk_op_outfit\` FOREIGN KEY (\`outfit_id\`) REFERENCES \`outfits\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_op_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 11: \`orders\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`orders\`;
CREATE TABLE \`orders\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(36) DEFAULT NULL,
  \`guest_session_id\` VARCHAR(100) DEFAULT NULL,
  \`receiver_name\` VARCHAR(255) NOT NULL,
  \`phone_number\` VARCHAR(20) NOT NULL,
  \`shipping_address\` TEXT NOT NULL,
  \`shipping_method\` VARCHAR(50) NOT NULL DEFAULT 'standard',
  \`payment_method\` ENUM('COD', 'CARD', 'VNPAY', 'MOMO') NOT NULL DEFAULT 'COD',
  \`payment_status\` ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
  \`order_status\` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  \`subtotal\` INT NOT NULL,
  \`shipping_fee\` INT NOT NULL DEFAULT 0,
  \`discount\` INT NOT NULL DEFAULT 0,
  \`total\` INT NOT NULL,
  \`applied_coupon\` VARCHAR(50) DEFAULT NULL,
  \`note\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_orders_user\` (\`user_id\`),
  KEY \`idx_orders_status\` (\`order_status\`),
  KEY \`idx_orders_created_at\` (\`created_at\`),
  CONSTRAINT \`fk_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 12: \`order_items\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`order_items\`;
CREATE TABLE \`order_items\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`order_id\` VARCHAR(50) NOT NULL,
  \`product_id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`image\` VARCHAR(500) DEFAULT NULL,
  \`size\` VARCHAR(50) DEFAULT NULL,
  \`color\` VARCHAR(50) DEFAULT NULL,
  \`price\` INT NOT NULL,
  \`quantity\` INT NOT NULL,
  \`subtotal\` INT NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_order_items_order\` (\`order_id\`),
  KEY \`idx_order_items_product\` (\`product_id\`),
  CONSTRAINT \`fk_order_items_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_order_items_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 13: \`coupons\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`coupons\`;
CREATE TABLE \`coupons\` (
  \`code\` VARCHAR(50) NOT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`value\` INT NOT NULL,
  \`max_discount\` INT DEFAULT NULL,
  \`min_order_value\` INT NOT NULL DEFAULT 0,
  \`description\` VARCHAR(255) DEFAULT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 14: \`reviews\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`reviews\`;
CREATE TABLE \`reviews\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(36) NOT NULL,
  \`product_id\` VARCHAR(50) NOT NULL,
  \`user_name\` VARCHAR(255) DEFAULT NULL,
  \`user_avatar\` VARCHAR(500) DEFAULT NULL,
  \`rating\` INT NOT NULL DEFAULT 5,
  \`comment\` TEXT DEFAULT NULL,
  \`images\` JSON DEFAULT NULL,
  \`status\` ENUM('APPROVED', 'HIDDEN', 'PENDING') NOT NULL DEFAULT 'APPROVED',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_reviews_product\` (\`product_id\`),
  KEY \`idx_reviews_user\` (\`user_id\`),
  CONSTRAINT \`fk_reviews_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_reviews_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 15: \`newsletter_subscribers\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`newsletter_subscribers\`;
CREATE TABLE \`newsletter_subscribers\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`voucher_code\` VARCHAR(50) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_newsletter_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 16: \`store_settings\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`store_settings\`;
CREATE TABLE \`store_settings\` (
  \`setting_key\` VARCHAR(100) NOT NULL,
  \`setting_value\` LONGTEXT NOT NULL,
  \`description\` VARCHAR(255) DEFAULT NULL,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 17: \`media_files\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`media_files\`;
CREATE TABLE \`media_files\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`filename\` VARCHAR(255) NOT NULL,
  \`mimetype\` VARCHAR(100) NOT NULL,
  \`size\` INT NOT NULL,
  \`data\` LONGBLOB NOT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`idx_media_filename\` (\`filename\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 18: \`carts\` & \`cart_items\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`cart_items\`;
DROP TABLE IF EXISTS \`carts\`;
CREATE TABLE \`carts\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`user_id\` VARCHAR(191) DEFAULT NULL,
  \`guest_session_id\` VARCHAR(191) DEFAULT NULL,
  \`applied_coupon\` VARCHAR(50) DEFAULT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_carts_user\` (\`user_id\`),
  UNIQUE KEY \`uk_carts_guest\` (\`guest_session_id\`),
  CONSTRAINT \`fk_carts_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`cart_items\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`cart_id\` VARCHAR(191) NOT NULL,
  \`product_id\` VARCHAR(191) NOT NULL,
  \`line_id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(100) DEFAULT NULL,
  \`gender\` VARCHAR(50) DEFAULT NULL,
  \`price\` INT NOT NULL,
  \`original_price\` INT DEFAULT NULL,
  \`image\` VARCHAR(500) DEFAULT NULL,
  \`size\` VARCHAR(50) DEFAULT NULL,
  \`color\` VARCHAR(50) DEFAULT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_cart_line\` (\`cart_id\`, \`line_id\`),
  CONSTRAINT \`fk_cart_items_cart\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_cart_items_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 19: \`wishlists\` & \`wishlist_items\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`wishlist_items\`;
DROP TABLE IF EXISTS \`wishlists\`;
CREATE TABLE \`wishlists\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`user_id\` VARCHAR(191) DEFAULT NULL,
  \`guest_session_id\` VARCHAR(191) DEFAULT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_wishlists_user\` (\`user_id\`),
  UNIQUE KEY \`uk_wishlists_guest\` (\`guest_session_id\`),
  CONSTRAINT \`fk_wishlists_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE \`wishlist_items\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`wishlist_id\` VARCHAR(191) NOT NULL,
  \`product_id\` VARCHAR(191) NOT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_wishlist_item\` (\`wishlist_id\`, \`product_id\`),
  CONSTRAINT \`fk_wishlist_items_wishlist\` FOREIGN KEY (\`wishlist_id\`) REFERENCES \`wishlists\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_wishlist_items_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 20: \`stock_reservations\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`stock_reservations\`;
CREATE TABLE \`stock_reservations\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`order_id\` VARCHAR(191) NOT NULL,
  \`items\` JSON NOT NULL,
  \`expires_at\` DATETIME(3) NOT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_reservations_order\` (\`order_id\`),
  KEY \`idx_reservations_expires\` (\`expires_at\`),
  CONSTRAINT \`fk_reservations_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 21: \`traffic_logs\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`traffic_logs\`;
CREATE TABLE \`traffic_logs\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`platform\` VARCHAR(50) NOT NULL,
  \`campaign\` VARCHAR(255) DEFAULT NULL,
  \`product_id\` VARCHAR(191) DEFAULT NULL,
  \`guest_session_id\` VARCHAR(191) DEFAULT NULL,
  \`user_id\` VARCHAR(191) DEFAULT NULL,
  \`action\` VARCHAR(50) NOT NULL DEFAULT 'VIEW',
  \`metadata\` JSON DEFAULT NULL,
  \`ip_address\` VARCHAR(100) DEFAULT NULL,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`idx_traffic_platform\` (\`platform\`),
  KEY \`idx_traffic_guest\` (\`guest_session_id\`),
  KEY \`idx_traffic_user\` (\`user_id\`),
  KEY \`idx_traffic_product\` (\`product_id\`),
  KEY \`idx_traffic_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

\n-- ==============================================================================
-- INSERT FULL REAL SEED DATA (MATCHING FRONTEND & BACKEND)
-- ==============================================================================

-- 1. Users: Admin & 5 Real Customers
-- Admin password: Admin@123 | Customer password: 123456
INSERT INTO \`users\` (\`id\`, \`full_name\`, \`phone_number\`, \`email\`, \`password_hash\`, \`role\`, \`avatar\`, \`style_preference\`, \`status\`, \`created_at\`) VALUES
('usr-admin-001', 'Admin Quản Trị Routine', '0999999999', 'admin@routine.vn', '$2b$10$Y0VkouJ1ppenbNnD/4EP6.YzhwIKDhlrthJra0nc2Inq/QaqlEqJm', 'ADMIN', '/images/avatars/admin.jpg', 'minimal', 'ACTIVE', '2026-08-01 00:00:00'),
('usr-customer-001', 'Nguyễn Văn A', '0123456789', 'nguyenvana@gmail.com', '$2b$10$QLNj1ReazUsEZjQmKjVe6e6yGsJZLD348hqzX65tY8TVIdMksWW9K', 'CUSTOMER', '/images/avatars/user-01.jpg', 'minimal', 'ACTIVE', '2026-08-15 08:30:00'),
('usr-customer-002', 'Trần Thị Bích Ngọc', '0987654321', 'bichngoc.tran@gmail.com', '$2b$10$QLNj1ReazUsEZjQmKjVe6e6yGsJZLD348hqzX65tY8TVIdMksWW9K', 'CUSTOMER', '/images/avatars/user-02.jpg', 'smart-casual', 'ACTIVE', '2026-08-20 10:15:00'),
('usr-customer-003', 'Lê Hoàng Long', '0912345678', 'hoanglong.le@gmail.com', '$2b$10$QLNj1ReazUsEZjQmKjVe6e6yGsJZLD348hqzX65tY8TVIdMksWW9K', 'CUSTOMER', '/images/avatars/user-03.jpg', 'streetstyle', 'ACTIVE', '2026-08-25 14:20:00'),
('usr-customer-004', 'Phạm Minh Trang', '0933456789', 'minhtrang.pham@gmail.com', '$2b$10$QLNj1ReazUsEZjQmKjVe6e6yGsJZLD348hqzX65tY8TVIdMksWW9K', 'CUSTOMER', '/images/avatars/user-04.jpg', 'vintage', 'ACTIVE', '2026-09-01 09:45:00'),
('usr-customer-005', 'Vũ Đức Thắng', '0944567890', 'thang.vu@gmail.com', '$2b$10$QLNj1ReazUsEZjQmKjVe6e6yGsJZLD348hqzX65tY8TVIdMksWW9K', 'CUSTOMER', '/images/avatars/user-05.jpg', 'sporty-chic', 'ACTIVE', '2026-09-03 16:10:00');

-- 2. Customer Addresses
INSERT INTO \`addresses\` (\`id\`, \`user_id\`, \`receiver_name\`, \`phone\`, \`street\`, \`ward\`, \`district\`, \`city\`, \`is_default\`) VALUES
('addr-001', 'usr-customer-001', 'Nguyễn Văn A', '0123456789', '123 Nguyễn Trãi', 'Phường Thanh Xuân Trung', 'Quận Thanh Xuân', 'Hà Nội', 1),
('addr-002', 'usr-customer-001', 'Nguyễn Văn A (Cơ quan)', '0123456789', '45 Lê Lợi', 'Phường Bến Nghé', 'Quận 1', 'Hồ Chí Minh', 0),
('addr-003', 'usr-customer-002', 'Trần Thị Bích Ngọc', '0987654321', '88 Cầu Giấy', 'Phường Dịch Vọng', 'Quận Cầu Giấy', 'Hà Nội', 1),
('addr-004', 'usr-customer-003', 'Lê Hoàng Long', '0912345678', '240 Hai Bà Trưng', 'Phường Tân Định', 'Quận 1', 'Hồ Chí Minh', 1),
('addr-005', 'usr-customer-004', 'Phạm Minh Trang', '0933456789', '56 Nguyễn Thị Minh Khai', 'Phường Đa Kao', 'Quận 1', 'Hồ Chí Minh', 1),
('addr-006', 'usr-customer-005', 'Vũ Đức Thắng', '0944567890', '15 Trần Phú', 'Phường Thạch Thang', 'Quận Hải Châu', 'Đà Nẵng', 1);

-- 3. Colors
INSERT INTO \`colors\` (\`id\`, \`name\`, \`hex_code\`, \`status\`) VALUES
`;

  const colorRows = colors.map((c) => `(${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.hexCode)}, ${escapeSql(c.status || 'ACTIVE')})`);
  sql += colorRows.join(',\n') + ';\n\n';

  // 4. Sizes
  sql += `-- 4. Sizes\nINSERT INTO \`sizes\` (\`id\`, \`name\`, \`size_type\`, \`sort_order\`, \`status\`) VALUES\n`;
  const sizeRows = sizes.map((s) => `(${escapeSql(s.id)}, ${escapeSql(s.name)}, ${escapeSql(s.sizeType)}, ${s.sortOrder}, ${escapeSql(s.status || 'ACTIVE')})`);
  sql += sizeRows.join(',\n') + ';\n\n';

  // 5. Categories
  sql += `-- 5. Categories\nINSERT INTO \`categories\` (\`id\`, \`slug\`, \`name\`, \`description\`, \`image\`, \`type\`, \`parent_id\`, \`status\`) VALUES\n`;
  const catRows = categories.map((c) => {
    return `(${escapeSql(c.id || c.slug)}, ${escapeSql(c.slug)}, ${escapeSql(c.name)}, ${escapeSql(c.description || '')}, ${escapeSql(c.image || '')}, ${escapeSql(c.type || 'standard')}, ${escapeSql(c.parentId || null)}, ${escapeSql(c.status || 'ACTIVE')})`;
  });
  sql += catRows.join(',\n') + ';\n\n';

  // 6. Styles
  sql += `-- 6. Styles\nINSERT INTO \`styles\` (\`id\`, \`slug\`, \`name\`, \`description\`, \`image\`, \`status\`) VALUES\n`;
  const styleRows = styles.map((s) => {
    return `(${escapeSql(s.id)}, ${escapeSql(s.slug)}, ${escapeSql(s.name)}, ${escapeSql(s.description || '')}, ${escapeSql(s.image || '')}, ${escapeSql(s.status || 'ACTIVE')})`;
  });
  sql += styleRows.join(',\n') + ';\n\n';

  // 7. Products (All 28 real products)
  sql += `-- 7. Products (Full 28 Products from Routine Catalog)\nINSERT INTO \`products\` (\`id\`, \`slug\`, \`name\`, \`description\`, \`short_description\`, \`price\`, \`original_price\`, \`gender\`, \`category_id\`, \`category_slug\`, \`styles\`, \`badge\`, \`rating\`, \`review_count\`, \`images\`, \`sizes\`, \`colors\`, \`stock_quantity\`, \`is_featured\`, \`is_trending\`, \`status\`, \`materials\`, \`care\`) VALUES\n`;
  const prodRows = products.map((p) => {
    const seed = seedMap.get(p.id) || {};
    const shortDesc = seed.shortDescription || (p.description ? p.description.slice(0, 120) + '...' : '');
    const isFeatured = p.badge === 'BEST SELLER' || p.badge === 'NEW' || seed.isFeatured ? 1 : 0;
    const isTrending = p.rating >= 4.7 || seed.badge === 'BEST_SELLER' ? 1 : 0;
    const categoryId = p.categoryId || (seed.categoryId || p.category);
    const originalPrice = p.originalPrice || (seed.originalPrice || null);

    return `(${escapeSql(p.id)}, ${escapeSql(p.slug || p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.description || seed.description || '')}, ${escapeSql(shortDesc)}, ${p.price}, ${escapeSql(originalPrice)}, ${escapeSql(p.gender || 'unisex')}, ${escapeSql(categoryId)}, ${escapeSql(p.category || 'tops')}, ${escapeSql(p.styleIds || p.style || [])}, ${escapeSql(p.badge || null)}, ${p.rating || 5.0}, ${p.reviewCount || 0}, ${escapeSql(p.images || [])}, ${escapeSql(p.sizes || [])}, ${escapeSql(p.colors || [])}, ${escapeSql(p.stockQuantity || 100)}, ${isFeatured}, ${isTrending}, ${escapeSql(p.status || 'ACTIVE')}, ${escapeSql(p.materials || seed.material || '')}, ${escapeSql(p.care || seed.careInstructions || '')})`;
  });
  sql += prodRows.join(',\n') + ';\n\n';

  // 8. Product Variants
  sql += `-- 8. Product Variants (Color & Size specific SKUs and stock)\nINSERT INTO \`product_variants\` (\`id\`, \`product_id\`, \`sku\`, \`color\`, \`size\`, \`price\`, \`stock_quantity\`, \`status\`) VALUES\n`;
  const variantRows = [];
  products.forEach((p) => {
    const pSizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L'];
    const pColors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Black'];

    pColors.forEach((color) => {
      pSizes.forEach((size) => {
        const colorAbbr = color.slice(0, 3).toUpperCase();
        const sku = `${(p.name || 'SKU').slice(0, 3).toUpperCase()}-${p.id.toUpperCase()}-${colorAbbr}-${size}`;
        const vId = `var-${p.id}-${color.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`;
        variantRows.push(`(${escapeSql(vId)}, ${escapeSql(p.id)}, ${escapeSql(sku)}, ${escapeSql(color)}, ${escapeSql(size)}, ${escapeSql(p.price)}, 25, 'ACTIVE')`);
      });
    });
  });
  sql += variantRows.join(',\n') + ';\n\n';

  // 9. Outfits (All 10 Smart Outfits)
  sql += `-- 9. Outfits (All 10 Smart Outfits from Frontend)\nINSERT INTO \`outfits\` (\`id\`, \`slug\`, \`title\`, \`description\`, \`image\`, \`occasion\`, \`style\`, \`gender\`, \`season\`, \`featured\`, \`status\`) VALUES\n`;
  const outfitRows = outfits.map((o) => {
    return `(${escapeSql(o.id)}, ${escapeSql(o.slug || o.id)}, ${escapeSql(o.name || o.title)}, ${escapeSql(o.description || '')}, ${escapeSql(o.image || o.coverImage)}, ${escapeSql(o.occasion || 'everyday')}, ${escapeSql(o.style || o.styleId)}, ${escapeSql(o.gender || 'unisex')}, 'all-season', 1, 'ACTIVE')`;
  });
  sql += outfitRows.join(',\n') + ';\n\n';

  // 10. Outfit Products (Mappings)
  sql += `-- 10. Outfit Product Mappings\nINSERT INTO \`outfit_products\` (\`id\`, \`outfit_id\`, \`product_id\`) VALUES\n`;
  const opRows = [];
  outfits.forEach((o) => {
    (o.productIds || []).forEach((pid) => {
      opRows.push(`('op-${o.id}-${pid}', ${escapeSql(o.id)}, ${escapeSql(pid)})`);
    });
  });
  sql += opRows.join(',\n') + ';\n\n';

  // 11. Orders (6 Real Realistic Customer Orders)
  sql += `-- 11. Orders (Real Orders matching Frontend state)\nINSERT INTO \`orders\` (\`id\`, \`user_id\`, \`receiver_name\`, \`phone_number\`, \`shipping_address\`, \`shipping_method\`, \`payment_method\`, \`payment_status\`, \`order_status\`, \`subtotal\`, \`shipping_fee\`, \`discount\`, \`total\`, \`created_at\`) VALUES\n`;
  
  const sampleOrdersList = [
    {
      id: 'ORD-2026-0001',
      userId: 'usr-customer-001',
      receiver: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội',
      method: 'standard',
      payMethod: 'COD',
      payStatus: 'PAID',
      status: 'CONFIRMED',
      subtotal: 598000,
      shipping: 30000,
      discount: 50000,
      total: 578000,
      date: '2026-09-06 09:12:00',
    },
    {
      id: 'ORD-2026-0002',
      userId: 'usr-customer-001',
      receiver: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội',
      method: 'express',
      payMethod: 'MOMO',
      payStatus: 'PAID',
      status: 'DELIVERED',
      subtotal: 649000,
      shipping: 50000,
      discount: 0,
      total: 699000,
      date: '2026-09-02 14:40:00',
    },
    {
      id: 'ORD-2026-0003',
      userId: 'usr-customer-001',
      receiver: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '45 Lê Lợi, Phường Bến Nghé, Quận 1, Hồ Chí Minh',
      method: 'standard',
      payMethod: 'CARD',
      payStatus: 'UNPAID',
      status: 'CANCELLED',
      subtotal: 549000,
      shipping: 30000,
      discount: 0,
      total: 579000,
      date: '2026-08-28 08:05:00',
    },
    {
      id: 'ORD-2026-0004',
      userId: 'usr-customer-002',
      receiver: 'Trần Thị Bích Ngọc',
      phone: '0987654321',
      address: '88 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
      method: 'standard',
      payMethod: 'VNPAY',
      payStatus: 'PAID',
      status: 'DELIVERED',
      subtotal: 1048000,
      shipping: 30000,
      discount: 100000,
      total: 978000,
      date: '2026-08-22 11:20:00',
    },
    {
      id: 'ORD-2026-0005',
      userId: 'usr-customer-003',
      receiver: 'Lê Hoàng Long',
      phone: '0912345678',
      address: '240 Hai Bà Trưng, Phường Tân Định, Quận 1, Hồ Chí Minh',
      method: 'standard',
      payMethod: 'COD',
      payStatus: 'PAID',
      status: 'SHIPPING',
      subtotal: 828000,
      shipping: 30000,
      discount: 50000,
      total: 808000,
      date: '2026-09-05 16:30:00',
    },
    {
      id: 'ORD-2026-0006',
      userId: 'usr-customer-004',
      receiver: 'Phạm Minh Trang',
      phone: '0933456789',
      address: '56 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, Hồ Chí Minh',
      method: 'standard',
      payMethod: 'CARD',
      payStatus: 'PAID',
      status: 'DELIVERED',
      subtotal: 1198000,
      shipping: 0,
      discount: 150000,
      total: 1048000,
      date: '2026-09-04 10:15:00',
    },
  ];

  const orderRows = sampleOrdersList.map((o) => {
    return `(${escapeSql(o.id)}, ${escapeSql(o.userId)}, ${escapeSql(o.receiver)}, ${escapeSql(o.phone)}, ${escapeSql(o.address)}, ${escapeSql(o.method)}, ${escapeSql(o.payMethod)}, ${escapeSql(o.payStatus)}, ${escapeSql(o.status)}, ${o.subtotal}, ${o.shipping}, ${o.discount}, ${o.total}, ${escapeSql(o.date)})`;
  });
  sql += orderRows.join(',\n') + ';\n\n';

  // 12. Order Items
  sql += `-- 12. Order Items\nINSERT INTO \`order_items\` (\`id\`, \`order_id\`, \`product_id\`, \`name\`, \`image\`, \`size\`, \`color\`, \`price\`, \`quantity\`, \`subtotal\`) VALUES\n`;
  const sampleItemsList = [
    // ORD-0001
    `('oi-1-1', 'ORD-2026-0001', 'p001', 'Essential Cotton T-Shirt', '/images/products/product-01.jpg', 'M', 'Black', 299000, 2, 598000)`,
    // ORD-0002
    `('oi-2-1', 'ORD-2026-0002', 'p019', 'Canvas Sneakers', '/images/products/product-19.jpg', '40', 'White', 649000, 1, 649000)`,
    // ORD-0003
    `('oi-3-1', 'ORD-2026-0003', 'p005', 'Straight Fit Jeans', '/images/products/product-05.jpg', '31', 'Blue', 549000, 1, 549000)`,
    // ORD-0004
    `('oi-4-1', 'ORD-2026-0004', 'p003', 'Classic White Shirt', '/images/products/product-03.jpg', 'L', 'White', 459000, 1, 459000)`,
    `('oi-4-2', 'ORD-2026-0004', 'p028', 'Track Jacket', '/images/products/product-28.jpg', 'L', 'Black', 599000, 1, 599000)`,
    // ORD-0005
    `('oi-5-1', 'ORD-2026-0005', 'p002', 'Oversized Basic Tee', '/images/products/product-02.jpg', 'XL', 'Beige', 329000, 1, 329000)`,
    `('oi-5-2', 'ORD-2026-0005', 'p004', 'Linen Blend Shirt', '/images/products/product-04.jpg', 'XL', 'Beige', 499000, 1, 499000)`,
    // ORD-0006
    `('oi-6-1', 'ORD-2026-0006', 'p026', 'High Waist Jeans', '/images/products/product-26.jpg', 'M', 'Blue', 499000, 1, 499000)`,
    `('oi-6-2', 'ORD-2026-0006', 'p027', 'Silk Blend Blouse', '/images/products/product-27.jpg', 'M', 'Cream', 549000, 1, 549000)`,
  ];
  sql += sampleItemsList.join(',\n') + ';\n\n';

  // 13. Coupons
  sql += `-- 13. Coupons (All Promotions)\nINSERT INTO \`coupons\` (\`code\`, \`type\`, \`value\`, \`max_discount\`, \`min_order_value\`, \`description\`, \`is_active\`) VALUES
('ROUTINE10', 'percent', 10, 100000, 300000, 'Giảm 10% tối đa 100K cho đơn từ 300K', 1),
('ROUTINE50K', 'fixed', 50000, 50000, 500000, 'Giảm trực tiếp 50K cho đơn từ 500K', 1),
('FREESHIP', 'freeship', 30000, 30000, 200000, 'Miễn phí vận chuyển toàn quốc', 1),
('WELCOME2026', 'percent', 15, 150000, 400000, 'Ưu đãi thành viên mới giảm 15%', 1),
('SUMMER2026', 'percent', 20, 200000, 600000, 'Khuyến mãi mùa hè giảm 20% đơn từ 600K', 1),
('FLASH50', 'fixed', 50000, 50000, 400000, 'Flash sale cuối tuần giảm 50K', 1);
\n\n`;

  // 14. Reviews
  sql += `-- 14. Reviews (Authentic customer reviews with ratings)\nINSERT INTO \`reviews\` (\`id\`, \`user_id\`, \`product_id\`, \`user_name\`, \`user_avatar\`, \`rating\`, \`comment\`, \`status\`, \`created_at\`) VALUES\n`;
  const reviewRows = reviews.map((r) => {
    return `(${escapeSql(r.id)}, 'usr-customer-001', ${escapeSql(r.productId)}, ${escapeSql(r.userName)}, ${escapeSql(r.userAvatar || '/images/avatars/user-01.jpg')}, ${escapeSql(r.rating)}, ${escapeSql(r.comment)}, ${escapeSql(r.status || 'APPROVED')}, '${toSqlDateTime(r.createdAt)}')`;
  });
  sql += reviewRows.join(',\n') + ';\n\n';

  // 15. Newsletter Subscribers
  sql += `-- 15. Newsletter Subscribers\nINSERT INTO \`newsletter_subscribers\` (\`id\`, \`email\`, \`voucher_code\`, \`created_at\`) VALUES
('sub-001', 'nguyenvana@gmail.com', 'WELCOME2026', '2026-08-15 08:35:00'),
('sub-002', 'bichngoc.tran@gmail.com', 'WELCOME2026', '2026-08-20 10:20:00'),
('sub-003', 'hoanglong.le@gmail.com', 'WELCOME2026', '2026-08-25 14:25:00'),
('sub-004', 'minhtrang.pham@gmail.com', 'WELCOME2026', '2026-09-01 09:50:00'),
('sub-005', 'thang.vu@gmail.com', 'WELCOME2026', '2026-09-03 16:15:00');
\n\n`;

  // 16. Store Settings
  sql += `-- 16. Store Settings (Routine Official Configuration)\nINSERT INTO \`store_settings\` (\`setting_key\`, \`setting_value\`, \`description\`) VALUES
('store_name', 'ROUTINE Vietnam', 'Tên thương hiệu thời trang'),
('hotline', '1900 636 845', 'Tổng đài hỗ trợ và đặt hàng toàn quốc'),
('contact_email', 'cskh@routine.vn', 'Hòm thư điện tử chăm sóc khách hàng'),
('warehouse_address', 'Tầng 5, Tòa nhà Routine, 123 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Địa chỉ kho xuất hàng chính'),
('default_shipping_fee', '30000', 'Phí vận chuyển tiêu chuẩn toàn quốc (VND)'),
('free_shipping_threshold', '499000', 'Giá trị đơn tối thiểu để được miễn phí vận chuyển (VND)'),
('working_hours', '08:30 - 21:30 (Thứ 2 đến Chủ Nhật)', 'Thời gian làm việc hỗ trợ khách hàng');
\n`;

  sql += `SET FOREIGN_KEY_CHECKS = 1;
\n-- ==============================================================================
-- END OF DATABASE SCRIPT
-- ==============================================================================
`;

  const outputPath = path.resolve(backendDir, 'routine_db.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`[SUCCESS] Full Database SQL script created at: ${outputPath} (${Buffer.byteLength(sql)} bytes)`);
}

generate().catch(console.error);
