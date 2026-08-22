CREATE TABLE `printTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` text,
  `fileName` varchar(255) NOT NULL,
  `fileUrl` text NOT NULL,
  `fileKey` varchar(512) NOT NULL,
  `mimeType` varchar(120) NOT NULL,
  `fileSize` int NOT NULL DEFAULT 0,
  `position` int NOT NULL DEFAULT 0,
  `isPublished` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `printTemplates_id` PRIMARY KEY(`id`)
);

ALTER TABLE `products` ADD COLUMN `templateId` int;
