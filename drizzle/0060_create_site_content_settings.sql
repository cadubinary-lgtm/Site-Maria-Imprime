CREATE TABLE `siteFooterSettings` (
  `id` int NOT NULL,
  `introduction` text,
  `newsletterTitle` varchar(120),
  `newsletterDescription` text,
  `businessHours` text,
  `documentsTitle` varchar(160),
  `documentsDescription` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `siteDocuments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` varchar(500) NOT NULL,
  `content` longtext NOT NULL,
  `position` int NOT NULL DEFAULT 0,
  `isPublished` boolean NOT NULL DEFAULT true,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `siteDocuments_slug_unique` (`slug`)
);
