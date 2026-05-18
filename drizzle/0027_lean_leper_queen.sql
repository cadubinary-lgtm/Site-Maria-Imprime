CREATE TABLE `productDeliveryOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`daysToDeliver` int NOT NULL,
	`pricePerM2` decimal(10,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productDeliveryOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `pricePerM2` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `minWidth` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `maxWidth` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `minHeight` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `maxHeight` decimal(10,2);