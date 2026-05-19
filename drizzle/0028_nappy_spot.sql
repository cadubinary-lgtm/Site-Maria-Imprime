CREATE TABLE `deliveryOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`daysToDeliver` int NOT NULL,
	`pricePerM2` decimal(10,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productDeliveryOptionMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`deliveryOptionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productDeliveryOptionMappings_id` PRIMARY KEY(`id`)
);
