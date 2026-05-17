CREATE TABLE `productVariationTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variationTypeId` int NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productVariationTypes_id` PRIMARY KEY(`id`)
);
