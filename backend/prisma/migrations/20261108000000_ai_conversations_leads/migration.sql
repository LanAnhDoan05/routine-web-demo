CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `guest_session_id` VARCHAR(191) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  `intent_score` INTEGER NOT NULL DEFAULT 0,
  `intent_level` VARCHAR(20) NOT NULL DEFAULT 'LOW',
  `intent_reason` TEXT NULL,
  `intent_signals` JSON NULL,
  `interested_product_ids` JSON NULL,
  `budget` INTEGER NULL,
  `context_summary` JSON NULL,
  `handoff_decision` VARCHAR(20) NULL,
  `handoff_consented_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `ai_conversations_user_updated_idx` (`user_id`, `updated_at`),
  INDEX `ai_conversations_guest_updated_idx` (`guest_session_id`, `updated_at`),
  INDEX `ai_conversations_leads_idx` (`handoff_consented_at`, `status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ai_conversations_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_conversation_messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `text` LONGTEXT NOT NULL,
  `metadata` JSON NULL,
  `author_user_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ai_conversation_messages_thread_idx` (`conversation_id`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ai_conversation_messages_conversation_id_fkey`
    FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
