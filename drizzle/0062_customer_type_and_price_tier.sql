ALTER TABLE `customer_accounts`
  MODIFY COLUMN `accountType` ENUM('customer', 'balcao', 'reseller', 'agency') NOT NULL DEFAULT 'customer';
