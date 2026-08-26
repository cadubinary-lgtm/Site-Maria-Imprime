CREATE TABLE `standaloneReceipts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `receiptNumber` varchar(80) NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `customerDocument` varchar(30),
  `customerEmail` varchar(255),
  `customerPhone` varchar(30),
  `paymentMethod` varchar(50) NOT NULL,
  `paidAt` bigint NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT '0',
  `amount` decimal(10,2) NOT NULL,
  `notes` longtext,
  `issuedAt` bigint NOT NULL,
  `issuedByAdminId` int,
  `issuedByAdminName` varchar(150),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `standaloneReceipts_id` PRIMARY KEY(`id`),
  CONSTRAINT `standaloneReceipts_receiptNumber_unique` UNIQUE(`receiptNumber`)
);

CREATE TABLE `standaloneReceiptItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `standaloneReceiptId` int NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `standaloneReceiptItems_id` PRIMARY KEY(`id`),
  CONSTRAINT `standaloneReceiptItems_standaloneReceiptId_fk` FOREIGN KEY (`standaloneReceiptId`) REFERENCES `standaloneReceipts`(`id`) ON DELETE CASCADE
);

CREATE INDEX `standaloneReceiptItems_receiptId_idx` ON `standaloneReceiptItems` (`standaloneReceiptId`);
