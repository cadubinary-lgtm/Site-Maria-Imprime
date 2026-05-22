ALTER TABLE `orders` ADD `delivery_zip_code` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_installments` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `deliveryZipCode`;