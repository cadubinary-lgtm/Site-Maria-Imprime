CREATE TABLE `attributeRuleActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`targetAttributeId` int NOT NULL,
	`action` enum('show','hide','enable','disable','setPrice','addPrice') NOT NULL,
	`value` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attributeRuleActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributeRuleConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`attributeId` int NOT NULL,
	`operator` enum('equals','contains','greaterThan','lessThan','in') NOT NULL,
	`value` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attributeRuleConditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributeRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributeRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributeValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attributeId` int NOT NULL,
	`value` varchar(255) NOT NULL,
	`description` longtext,
	`priceModifier` decimal(10,2) NOT NULL DEFAULT '0',
	`timeModifier` int NOT NULL DEFAULT 0,
	`weightModifier` decimal(10,4) NOT NULL DEFAULT '0',
	`icon` varchar(100),
	`image` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributeValues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` longtext,
	`type` enum('button','select','card','radio','checkbox','numeric','text','measures') NOT NULL,
	`icon` varchar(100),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributes_id` PRIMARY KEY(`id`),
	CONSTRAINT `attributes_name_unique` UNIQUE(`name`),
	CONSTRAINT `attributes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orderItemAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderItemId` int NOT NULL,
	`attributeValueId` int NOT NULL,
	`customValue` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItemAttributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productAttributeValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productAttributeId` int NOT NULL,
	`attributeValueId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productAttributeValues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`attributeId` int NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`allowMultiple` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productAttributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attributeRuleActions` ADD CONSTRAINT `attributeRuleActions_ruleId_attributeRules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `attributeRules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributeRuleActions` ADD CONSTRAINT `attributeRuleActions_targetAttributeId_attributes_id_fk` FOREIGN KEY (`targetAttributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributeRuleConditions` ADD CONSTRAINT `attributeRuleConditions_ruleId_attributeRules_id_fk` FOREIGN KEY (`ruleId`) REFERENCES `attributeRules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributeRuleConditions` ADD CONSTRAINT `attributeRuleConditions_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributeRules` ADD CONSTRAINT `attributeRules_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attributeValues` ADD CONSTRAINT `attributeValues_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItemAttributes` ADD CONSTRAINT `orderItemAttributes_orderItemId_orderItems_id_fk` FOREIGN KEY (`orderItemId`) REFERENCES `orderItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orderItemAttributes` ADD CONSTRAINT `orderItemAttributes_attributeValueId_attributeValues_id_fk` FOREIGN KEY (`attributeValueId`) REFERENCES `attributeValues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productAttributeValues` ADD CONSTRAINT `productAttributeValues_productAttributeId_productAttributes_id_fk` FOREIGN KEY (`productAttributeId`) REFERENCES `productAttributes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productAttributeValues` ADD CONSTRAINT `productAttributeValues_attributeValueId_attributeValues_id_fk` FOREIGN KEY (`attributeValueId`) REFERENCES `attributeValues`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD CONSTRAINT `productAttributes_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD CONSTRAINT `productAttributes_attributeId_attributes_id_fk` FOREIGN KEY (`attributeId`) REFERENCES `attributes`(`id`) ON DELETE cascade ON UPDATE no action;