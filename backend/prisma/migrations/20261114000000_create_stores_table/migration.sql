-- CreateTable
CREATE TABLE IF NOT EXISTS `stores` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `address` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `region` VARCHAR(50) NOT NULL DEFAULT 'SOUTH',
    `phone` VARCHAR(50) NULL,
    `opening_hours` VARCHAR(100) NULL DEFAULT '09:00 - 22:00',
    `map_url` VARCHAR(500) NULL,
    `image` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_flagship` BOOLEAN NOT NULL DEFAULT false,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stores_slug_key`(`slug`),
    INDEX `stores_city_idx`(`city`),
    INDEX `stores_region_idx`(`region`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
