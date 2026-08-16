ALTER TABLE `products` ADD COLUMN `pixPrice` DECIMAL(10,2) NULL AFTER `price`;
ALTER TABLE `products` ADD COLUMN `cardPrice` DECIMAL(10,2) NULL AFTER `pixPrice`;
ALTER TABLE `products` ADD COLUMN `pixPricePerM2` DECIMAL(10,2) NULL AFTER `pricePerM2`;
ALTER TABLE `products` ADD COLUMN `cardPricePerM2` DECIMAL(10,2) NULL AFTER `pixPricePerM2`;

UPDATE `products`
SET
  `pixPrice` = `price`,
  `cardPrice` = `price`,
  `pixPricePerM2` = `pricePerM2`,
  `cardPricePerM2` = `pricePerM2`;

ALTER TABLE `cartItems` ADD COLUMN `pixPriceAtCart` DECIMAL(10,2) NULL AFTER `priceAtCart`;
ALTER TABLE `cartItems` ADD COLUMN `cardPriceAtCart` DECIMAL(10,2) NULL AFTER `pixPriceAtCart`;

UPDATE `cartItems`
SET
  `pixPriceAtCart` = `priceAtCart`,
  `cardPriceAtCart` = `priceAtCart`;
