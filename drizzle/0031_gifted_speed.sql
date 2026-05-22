ALTER TABLE `orderStatusHistory` MODIFY COLUMN `previousStatus` enum('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado');--> statement-breakpoint
ALTER TABLE `orderStatusHistory` MODIFY COLUMN `newStatus` enum('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado') NOT NULL DEFAULT 'pedido_recebido';--> statement-breakpoint
ALTER TABLE `orderItems` ADD `productName` varchar(255);--> statement-breakpoint
ALTER TABLE `orderItems` ADD `selectedAttributes` longtext;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `artFileUrl` text;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `notes` longtext;--> statement-breakpoint
ALTER TABLE `orders` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryStreet` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryNumber` varchar(10);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryComplement` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryNeighborhood` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryCity` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryState` varchar(2);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryZipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryFullName` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryPhone` varchar(20);