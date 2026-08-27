ALTER TABLE `sellers` ADD COLUMN IF NOT EXISTS `allowStorePickupPayment` boolean NOT NULL DEFAULT false AFTER `status`;
