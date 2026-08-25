CREATE TABLE IF NOT EXISTS `orderProductionStatusHistory` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `previousStatus` varchar(100),
  `newStatus` varchar(100) NOT NULL,
  `changedBy` int,
  `changedByName` varchar(255),
  `notes` longtext,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `orderProductionStatusHistory_id` PRIMARY KEY(`id`),
  INDEX `orderProductionStatusHistory_orderId_createdAt_idx` (`orderId`, `createdAt`)
);
