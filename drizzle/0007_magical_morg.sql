ALTER TABLE `products` MODIFY COLUMN `segment` enum('alimentacao','beleza','varejo','servicos') NOT NULL;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `technicalInfo`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `benefits`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `applications`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `allowCustomMeasures`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `pricePerSquareMeter`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `minWidth`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `maxWidth`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `minHeight`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `maxHeight`;