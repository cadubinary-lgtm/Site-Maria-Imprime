CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`selectedAttributes` longtext,
	`customDimensions` varchar(255),
	`priceAtCart` decimal(10,2) NOT NULL,
	`artFileUrl` text,
	`artFileKey` varchar(255),
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`street` varchar(255) NOT NULL,
	`number` varchar(10) NOT NULL,
	`complement` varchar(255),
	`neighborhood` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'Brasil',
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cpfCnpj` varchar(20),
	`whatsapp` varchar(20),
	`companyName` varchar(255),
	`totalSpent` decimal(15,2) NOT NULL DEFAULT '0',
	`totalOrders` int NOT NULL DEFAULT 0,
	`lastOrderDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerProfiles_userId_unique` UNIQUE(`userId`)
);
