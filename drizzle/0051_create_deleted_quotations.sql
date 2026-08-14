CREATE TABLE `deletedQuotations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `quotationId` int NOT NULL,
  `deletedByAdminId` int,
  `deletedByAdminName` varchar(255),
  `deletionReason` varchar(1000),
  `deletedAt` bigint NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `deletedQuotations_id` PRIMARY KEY(`id`),
  CONSTRAINT `deletedQuotations_quotationId_unique` UNIQUE(`quotationId`)
);
