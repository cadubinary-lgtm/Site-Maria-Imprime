CREATE TABLE `fileChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderItemId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`resolution` varchar(50),
	`colorMode` varchar(50),
	`issues` longtext,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`checkedAt` timestamp,
	`checkedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fileChecks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItemVariations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderItemId` int NOT NULL,
	`variationOptionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItemVariations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variationOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variationTypeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variationOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variationTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`type` enum('material','acabamento') NOT NULL,
	`name` varchar(255) NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variationTypes_id` PRIMARY KEY(`id`)
);
