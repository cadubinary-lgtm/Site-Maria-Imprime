ALTER TABLE `products` ADD COLUMN `resellerPrice` decimal(10,2);
ALTER TABLE `products` ADD COLUMN `resellerPricePerM2` decimal(10,2);
ALTER TABLE `customer_accounts` ADD COLUMN `priceTier` enum('final','reseller') NOT NULL DEFAULT 'final';
