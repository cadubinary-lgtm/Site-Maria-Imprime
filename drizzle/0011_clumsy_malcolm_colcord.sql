CREATE TABLE `finishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finishes_id` PRIMARY KEY(`id`),
	CONSTRAINT `finishes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `formats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`width` decimal(10,2),
	`height` decimal(10,2),
	`isCustomizable` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formats_id` PRIMARY KEY(`id`),
	CONSTRAINT `formats_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`description` longtext,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `printColors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printColors_id` PRIMARY KEY(`id`),
	CONSTRAINT `printColors_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `printingTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `printingTypes_id` PRIMARY KEY(`id`),
	CONSTRAINT `printingTypes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `productCalculatorConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`baseValuePerSqm` decimal(10,2) NOT NULL,
	`materialCost` decimal(10,2) NOT NULL DEFAULT '0',
	`printingCost` decimal(10,2) NOT NULL DEFAULT '0',
	`finishingCost` decimal(10,2) NOT NULL DEFAULT '0',
	`profitMarginPercent` decimal(5,2) NOT NULL DEFAULT '30',
	`minimumAreaSqm` decimal(10,2) NOT NULL DEFAULT '1',
	`productionDays` int NOT NULL DEFAULT 5,
	`expressProductionDays` int NOT NULL DEFAULT 2,
	`estimatedWeight` decimal(10,2),
	`shippingType` enum('retirada','entrega_propria','transportadora','correios') NOT NULL DEFAULT 'transportadora',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productCalculatorConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `productCalculatorConfig_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `productFinishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`finishId` int NOT NULL,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productFinishes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productFormats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`formatId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productFormats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialId` int NOT NULL,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productPricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantityMin` int NOT NULL,
	`quantityMax` int,
	`pricePerUnit` decimal(10,2) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productPricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productPrintColors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`printColorId` int NOT NULL,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productPrintColors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productPrintingTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`printingTypeId` int NOT NULL,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productPrintingTypes_id` PRIMARY KEY(`id`)
);
