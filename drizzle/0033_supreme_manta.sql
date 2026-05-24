CREATE TABLE `customer_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`cpfCnpj` varchar(20),
	`passwordHash` varchar(255) NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`emailVerificationToken` varchar(255),
	`emailVerificationExpires` bigint,
	`resetPasswordToken` varchar(255),
	`resetPasswordExpires` bigint,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'inactive',
	`lastLogin` bigint,
	`loginAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `customer_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_accounts_email_unique` UNIQUE(`email`),
	CONSTRAINT `customer_accounts_cpfCnpj_unique` UNIQUE(`cpfCnpj`)
);
--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` bigint NOT NULL,
	`createdAt` bigint NOT NULL,
	`ipAddress` varchar(50),
	`userAgent` varchar(500),
	CONSTRAINT `customer_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `cartItems` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `orderStatusHistory` MODIFY COLUMN `previousStatus` enum('pedido_recebido','pagamento_aprovado','arte_em_analise','aguardando_aprovacao','em_producao','impressao','acabamento','pronto','saiu_para_entrega','entregue','cancelado');--> statement-breakpoint
ALTER TABLE `orderStatusHistory` MODIFY COLUMN `newStatus` enum('pedido_recebido','pagamento_aprovado','arte_em_analise','aguardando_aprovacao','em_producao','impressao','acabamento','pronto','saiu_para_entrega','entregue','cancelado') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pedido_recebido','pagamento_aprovado','arte_em_analise','aguardando_aprovacao','em_producao','impressao','acabamento','pronto','saiu_para_entrega','entregue','cancelado') NOT NULL DEFAULT 'pedido_recebido';--> statement-breakpoint
ALTER TABLE `cartItems` ADD `sessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryZipCode` varchar(20);--> statement-breakpoint
ALTER TABLE `customer_sessions` ADD CONSTRAINT `customer_sessions_customerId_customer_accounts_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customer_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `delivery_zip_code`;