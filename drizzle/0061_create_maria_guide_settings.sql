CREATE TABLE `siteMariaGuideSettings` (
  `id` int NOT NULL,
  `draftContent` longtext,
  `publishedContent` longtext,
  `isPublished` boolean NOT NULL DEFAULT true,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
