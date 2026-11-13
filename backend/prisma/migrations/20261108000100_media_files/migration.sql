CREATE TABLE IF NOT EXISTS `media_files` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `mimetype` VARCHAR(100) NOT NULL,
  `size` INTEGER NOT NULL,
  `data` LONGBLOB NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `media_files_filename_idx` (`filename`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
