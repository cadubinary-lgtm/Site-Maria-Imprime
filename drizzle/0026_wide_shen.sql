ALTER TABLE `productAttributes` DROP FOREIGN KEY `productAttributes_variationTypeId_variationTypes_id_fk`;
--> statement-breakpoint
ALTER TABLE `productAttributes` MODIFY COLUMN `productId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `productAttributes` DROP COLUMN `variationTypeId`;