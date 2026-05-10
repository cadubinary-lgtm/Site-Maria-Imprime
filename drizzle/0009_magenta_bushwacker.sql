CREATE TABLE `productVariationCombinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variationOptionIds` longtext,
	`basePrice` decimal(10,2) NOT NULL,
	`totalPriceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`finalPrice` decimal(10,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productVariationCombinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `isConfigurable` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `variationOptions` ADD `displayOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `variationOptions` ADD `isActive` boolean DEFAULT true NOT NULL;