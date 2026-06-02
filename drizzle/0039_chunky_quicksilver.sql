CREATE TABLE `carriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`apiProvider` varchar(50),
	`apiKey` text,
	`apiUrl` text,
	`minWeight` decimal(8,3),
	`maxWeight` decimal(8,3),
	`baseRate` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carriers_id` PRIMARY KEY(`id`),
	CONSTRAINT `carriers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`carrierId` int NOT NULL,
	`trackingNumber` varchar(100) NOT NULL,
	`weight` decimal(8,3) NOT NULL,
	`volume` decimal(10,2),
	`shippingCost` decimal(10,2) NOT NULL,
	`estimatedDeliveryDate` date,
	`actualDeliveryDate` date,
	`status` enum('pending','shipped','in_transit','delivered','failed') NOT NULL DEFAULT 'pending',
	`labelUrl` text,
	`labelKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `shipments_trackingNumber_unique` UNIQUE(`trackingNumber`)
);
--> statement-breakpoint
CREATE TABLE `shippingRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrierId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`cepFrom` varchar(8),
	`cepTo` varchar(8),
	`minWeight` decimal(8,3),
	`maxWeight` decimal(8,3),
	`basePrice` decimal(10,2) NOT NULL,
	`pricePerKg` decimal(10,2),
	`estimatedDays` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shippingRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackingEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`status` varchar(50) NOT NULL,
	`location` varchar(255),
	`description` text,
	`eventTime` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackingEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `segment` varchar(100) NOT NULL DEFAULT 'geral';--> statement-breakpoint
ALTER TABLE `variationOptions` ADD `calculationType` varchar(50) DEFAULT 'unit' NOT NULL;--> statement-breakpoint
ALTER TABLE `variationOptions` ADD `order` int DEFAULT 0 NOT NULL;