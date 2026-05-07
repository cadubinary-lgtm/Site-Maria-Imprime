ALTER TABLE `products` MODIFY COLUMN `segment` enum('alimentacao','beleza','saude','varejo','servicos') NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `technicalInfo` longtext;--> statement-breakpoint
ALTER TABLE `products` ADD `benefits` longtext;--> statement-breakpoint
ALTER TABLE `products` ADD `applications` longtext;--> statement-breakpoint
ALTER TABLE `products` ADD `allowCustomMeasures` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `pricePerSquareMeter` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `minWidth` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `maxWidth` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `minHeight` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` ADD `maxHeight` decimal(10,2);