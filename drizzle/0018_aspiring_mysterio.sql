ALTER TABLE `variationTypes` ADD `slug` varchar(255);--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `description` longtext;--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `selectionType` enum('radio','checkbox','select','cards','chips') DEFAULT 'select';--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `visualType` varchar(50) DEFAULT 'default';--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `order` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `variationTypes` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;