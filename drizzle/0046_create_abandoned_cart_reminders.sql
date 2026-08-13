CREATE TABLE IF NOT EXISTS `abandonedCartReminders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `cartKey` varchar(320) NOT NULL,
  `channel` enum('email','whatsapp') NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `status` enum('sent','prepared','failed') NOT NULL,
  `sentAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `abandoned_cart_reminders_cart_key_idx` (`cartKey`),
  KEY `abandoned_cart_reminders_status_idx` (`status`)
);
