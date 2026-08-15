ALTER TABLE `cartItems`
  ADD COLUMN `urgencyRate` decimal(10,2) NULL,
  ADD COLUMN `urgencyMultiplier` decimal(10,3) NULL,
  ADD COLUMN `urgencyUnit` varchar(30) NULL,
  ADD COLUMN `urgencySurcharge` decimal(10,2) NULL;

ALTER TABLE `orderItems`
  ADD COLUMN `urgencyRate` decimal(10,2) NULL,
  ADD COLUMN `urgencyMultiplier` decimal(10,3) NULL,
  ADD COLUMN `urgencyUnit` varchar(30) NULL,
  ADD COLUMN `urgencySurcharge` decimal(10,2) NULL;
