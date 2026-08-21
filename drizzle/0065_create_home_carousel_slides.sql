CREATE TABLE IF NOT EXISTS `homeCarouselSlides` (
  `id` int AUTO_INCREMENT NOT NULL,
  `imageUrl` text NOT NULL,
  `imageKey` varchar(255),
  `segmentId` int NOT NULL,
  `position` int NOT NULL DEFAULT 0,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `homeCarouselSlides_segment_position_idx` (`segmentId`, `position`)
);
