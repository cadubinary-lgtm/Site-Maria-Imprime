ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `sellerName` varchar(255) NULL AFTER `sellerId`;
