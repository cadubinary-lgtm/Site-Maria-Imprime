CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`priceAtOrder` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`previousStatus` enum('aguardando','em_producao','enviado','entregue'),
	`newStatus` enum('aguardando','em_producao','enviado','entregue') NOT NULL,
	`changedBy` int,
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`status` enum('aguardando','em_producao','enviado','entregue') NOT NULL DEFAULT 'aguardando',
	`totalPrice` decimal(10,2) NOT NULL,
	`artFileUrl` text,
	`artFileKey` varchar(255),
	`paymentStatus` enum('pendente','pago','falhou') NOT NULL DEFAULT 'pendente',
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` longtext,
	`price` decimal(10,2) NOT NULL,
	`segment` enum('alimentacao','beleza','varejo','servicos') NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','production') NOT NULL DEFAULT 'user';