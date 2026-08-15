ALTER TABLE `clients`
  ADD COLUMN `priceTier` ENUM('final', 'reseller') NOT NULL DEFAULT 'final' AFTER `isActive`;
