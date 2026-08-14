CREATE TABLE IF NOT EXISTS `deletedReceivedAccounts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `deletedByAdminId` int,
  `deletedByAdminName` varchar(255),
  `deletedAt` bigint NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `deletedReceivedAccounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `deletedReceivedAccounts_orderId_unique` UNIQUE(`orderId`)
);
