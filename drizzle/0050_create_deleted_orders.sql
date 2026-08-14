CREATE TABLE `deletedOrders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `deletedByAdminId` int,
  `deletedByAdminName` varchar(255),
  `deletionReason` varchar(1000),
  `deletedAt` bigint NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `deletedOrders_id` PRIMARY KEY(`id`),
  CONSTRAINT `deletedOrders_orderId_unique` UNIQUE(`orderId`)
);
