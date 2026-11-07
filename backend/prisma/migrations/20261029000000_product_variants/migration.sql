SET @product_status_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'status'
);
SET @product_status_ddl = IF(
  @product_status_column_exists = 0,
  'ALTER TABLE `products` ADD COLUMN `status` ENUM(''ACTIVE'', ''DRAFT'', ''INACTIVE'') NOT NULL DEFAULT ''ACTIVE''',
  'SELECT 1'
);
PREPARE product_status_stmt FROM @product_status_ddl;
EXECUTE product_status_stmt;
DEALLOCATE PREPARE product_status_stmt;

CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(100) NOT NULL,
  `color` VARCHAR(50) NULL,
  `size` VARCHAR(50) NULL,
  `price` INT NOT NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_variants_sku` (`sku`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;