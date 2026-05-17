ALTER TABLE `productAttributes` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD `variationTypeId` int;--> statement-breakpoint
ALTER TABLE `productAttributes` ADD CONSTRAINT `productAttributes_variationTypeId_variationTypes_id_fk` FOREIGN KEY (`variationTypeId`) REFERENCES `variationTypes`(`id`) ON DELETE cascade ON UPDATE no action;