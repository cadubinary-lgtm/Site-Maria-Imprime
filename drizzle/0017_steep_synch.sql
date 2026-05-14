ALTER TABLE `products` ADD `category` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `subcategory` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `galleryUrls` longtext;--> statement-breakpoint
ALTER TABLE `products` ADD `calculationType` enum('m2','metro_linear','pacote','unidade') DEFAULT 'pacote' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `unit` varchar(50) DEFAULT 'pacote' NOT NULL;