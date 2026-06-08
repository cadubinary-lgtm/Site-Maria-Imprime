CREATE TABLE `cashFlowEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryType` enum('income','expense') NOT NULL,
	`category` varchar(100),
	`description` varchar(300),
	`amount` decimal(10,2) NOT NULL,
	`entryDate` bigint NOT NULL,
	`referenceId` int,
	`referenceType` varchar(50),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashFlowEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscalNoteItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fiscalNoteId` int NOT NULL,
	`productName` varchar(200) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fiscalNoteItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscalNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`noteNumber` varchar(50),
	`noteType` enum('nfse','nfe') DEFAULT 'nfse',
	`status` enum('pending','issued','cancelled','voided','error') DEFAULT 'pending',
	`customerName` varchar(200),
	`customerCpf` varchar(14),
	`customerCnpj` varchar(18),
	`customerEmail` varchar(200),
	`customerPhone` varchar(20),
	`customerAddress` text,
	`totalValue` decimal(10,2),
	`shippingValue` decimal(10,2) DEFAULT '0',
	`discountValue` decimal(10,2) DEFAULT '0',
	`paymentMethod` varchar(100),
	`issueDate` bigint,
	`cancelDate` bigint,
	`pdfUrl` text,
	`xmlUrl` text,
	`errorMessage` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscalNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscalSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200),
	`tradeName` varchar(200),
	`cnpj` varchar(20),
	`stateRegistration` varchar(50),
	`cityRegistration` varchar(50),
	`address` varchar(300),
	`zipCode` varchar(10),
	`city` varchar(100),
	`state` varchar(2),
	`phone` varchar(20),
	`email` varchar(200),
	`emitMode` enum('manual','on_payment','on_completed') DEFAULT 'manual',
	`documentType` enum('nfse','nfe','both') DEFAULT 'nfse',
	`certificateFilename` varchar(200),
	`certificateKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscalSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originCEP` varchar(10),
	`correiosUser` varchar(255),
	`correiosPassword` varchar(255),
	`correiosContractNumber` varchar(255),
	`correiosPostalCard` varchar(255),
	`correiosToken` text,
	`correiosTokenExpiry` timestamp,
	`senderStreet` varchar(255),
	`senderNumber` varchar(20),
	`senderComplement` varchar(255),
	`senderNeighborhood` varchar(255),
	`senderCity` varchar(255),
	`senderState` varchar(2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `carriers` ADD `cwsUser` varchar(255);--> statement-breakpoint
ALTER TABLE `carriers` ADD `cwsPassword` varchar(255);--> statement-breakpoint
ALTER TABLE `carriers` ADD `contractNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `carriers` ADD `postalCardNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `cartItems` ADD `shippingMethod` varchar(50) DEFAULT 'retirada';--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingPrice` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingEstimatedDays` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingZipCode` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingCarrierId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `weight` decimal(8,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `height` decimal(8,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `width` decimal(8,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `length` decimal(8,3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `allowPickup` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `allowMotoExpress` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `allowedCarriers` longtext DEFAULT '[]' NOT NULL;