-- Módulo comercial: perfis de vendedores, vínculo por pedido/orçamento,
-- comissões congeladas por pedido e histórico de baixas financeiras.

ALTER TABLE `users`
  MODIFY COLUMN `role` enum('user','admin','production','seller') NOT NULL DEFAULT 'user';

ALTER TABLE `adminAccounts`
  MODIFY COLUMN `role` enum('superadmin','admin','production','seller') NOT NULL DEFAULT 'admin';

ALTER TABLE `orders`
  ADD COLUMN `sellerId` int NULL AFTER `customerId`;

ALTER TABLE `orders`
  ADD INDEX `orders_seller_id_idx` (`sellerId`);

ALTER TABLE `quotations`
  ADD COLUMN `sellerId` int NULL AFTER `operatorId`;

ALTER TABLE `quotations`
  ADD INDEX `quotations_seller_id_idx` (`sellerId`);

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `adminAccountId` int NOT NULL,
  `commissionRate` decimal(5,2) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdByAdminId` int,
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `sellers_id` PRIMARY KEY(`id`),
  CONSTRAINT `sellers_admin_account_unique` UNIQUE(`adminAccountId`),
  CONSTRAINT `sellers_adminAccountId_adminAccounts_id_fk` FOREIGN KEY (`adminAccountId`) REFERENCES `adminAccounts`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS `sellerCommissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `sellerId` int NOT NULL,
  `orderNumberSnapshot` varchar(50) NOT NULL,
  `sellerNameSnapshot` varchar(150) NOT NULL,
  `subtotalSnapshot` decimal(10,2) NOT NULL,
  `discountAmountSnapshot` decimal(10,2) NOT NULL DEFAULT '0',
  `commissionBaseAmount` decimal(10,2) NOT NULL,
  `commissionRateSnapshot` decimal(5,2) NOT NULL,
  `commissionAmount` decimal(10,2) NOT NULL,
  `source` enum('quotation_conversion','seller_order','admin_assignment') NOT NULL DEFAULT 'seller_order',
  `status` enum('prevista','a_pagar','paga','cancelada') NOT NULL DEFAULT 'prevista',
  `eligibleAt` bigint,
  `paidAt` bigint,
  `canceledAt` bigint,
  `canceledReason` varchar(1000),
  `createdAt` bigint NOT NULL,
  `updatedAt` bigint NOT NULL,
  CONSTRAINT `sellerCommissions_id` PRIMARY KEY(`id`),
  CONSTRAINT `sellerCommissions_order_unique` UNIQUE(`orderId`),
  CONSTRAINT `sellerCommissions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT `sellerCommissions_sellerId_sellers_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION,
  INDEX `seller_commissions_seller_status_idx` (`sellerId`, `status`)
);

CREATE TABLE IF NOT EXISTS `sellerCommissionPayments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `commissionId` int NOT NULL,
  `sellerId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paidAt` bigint NOT NULL,
  `note` varchar(1500),
  `paidByAdminId` int NOT NULL,
  `paidByAdminName` varchar(150) NOT NULL,
  `createdAt` bigint NOT NULL,
  CONSTRAINT `sellerCommissionPayments_id` PRIMARY KEY(`id`),
  CONSTRAINT `sellerCommissionPayments_commissionId_sellerCommissions_id_fk` FOREIGN KEY (`commissionId`) REFERENCES `sellerCommissions`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT `sellerCommissionPayments_sellerId_sellers_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION,
  INDEX `seller_commission_payments_commission_idx` (`commissionId`),
  INDEX `seller_commission_payments_seller_idx` (`sellerId`)
);
