ALTER TABLE `customer_accounts`
  ADD COLUMN `accountType` ENUM('customer', 'reseller', 'agency') NOT NULL DEFAULT 'customer';
