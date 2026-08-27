CREATE TABLE IF NOT EXISTS `deletedReceipts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `receiptType` enum('pedido','avulso') NOT NULL,
  `originalReceiptId` int NOT NULL,
  `receiptNumber` varchar(80) NOT NULL,
  `orderId` int,
  `orderNumber` varchar(50),
  `customerName` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paidAt` bigint NOT NULL,
  `receiptSnapshot` longtext NOT NULL,
  `deletedAt` bigint NOT NULL,
  `deletedByAdminId` int,
  `deletedByAdminName` varchar(150),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `deletedReceipts_id` PRIMARY KEY(`id`)
);
CREATE INDEX `deletedReceipts_receiptNumber_idx` ON `deletedReceipts` (`receiptNumber`);
CREATE INDEX `deletedReceipts_deletedAt_idx` ON `deletedReceipts` (`deletedAt`);
