CREATE TABLE `productSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`segmentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `productAttributeValues` ADD `priceModifier` decimal(10,2);--> statement-breakpoint
ALTER TABLE `productAttributeValues` ADD `calculationType` enum('fixed','percentage','multiplier','per_sqm','per_quantity');--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `priceModifier` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `calculationType` enum('fixed','percentage','multiplier','per_sqm','per_quantity') DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `timeModifier` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `weightModifier` decimal(10,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `priority` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `rules` text;