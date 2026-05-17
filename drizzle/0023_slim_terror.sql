CREATE TABLE `variationAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variationTypeId` int NOT NULL,
	`attributeId` int NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`allowMultiple` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`calculationType` enum('fixed','percentage','multiplier','per_sqm','per_quantity') NOT NULL DEFAULT 'fixed',
	`timeModifier` int NOT NULL DEFAULT 0,
	`weightModifier` decimal(10,4) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`priority` int NOT NULL DEFAULT 0,
	`rules` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `variationAttributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `variationAttributes` ADD CONSTRAINT `variationAttributes_variationTypeId_variationTypes_id_fk` FOREIGN KEY (`variationTypeId`) REFERENCES `variationTypes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variationAttributes` ADD CONSTRAINT `variationAttributes_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variationTypes` DROP COLUMN `globalVariationTypeId`;