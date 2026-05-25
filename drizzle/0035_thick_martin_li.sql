CREATE TABLE `orderArtPreviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255) NOT NULL,
	`uploadedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderArtPreviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressZipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressStreet` varchar(255);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressComplement` varchar(100);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressNeighborhood` varchar(100);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressCity` varchar(100);--> statement-breakpoint
ALTER TABLE `customer_accounts` ADD `addressState` varchar(2);--> statement-breakpoint
ALTER TABLE `orders` ADD `guestToken` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `guestEmail` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `guestName` varchar(255);