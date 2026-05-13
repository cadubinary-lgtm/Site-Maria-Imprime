CREATE TABLE `automationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('whatsapp','email','sms','notificacao') NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`message` longtext,
	`status` enum('pendente','enviado','falhou') NOT NULL DEFAULT 'pendente',
	`errorMessage` longtext,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`clientType` enum('balcao','revendedor','agencia','corporativo') NOT NULL DEFAULT 'balcao',
	`totalVolume` decimal(15,2) NOT NULL DEFAULT '0',
	`totalOrders` int NOT NULL DEFAULT 0,
	`averageTicket` decimal(10,2) NOT NULL DEFAULT '0',
	`notes` longtext,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailySalesReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportDate` date NOT NULL,
	`totalSales` decimal(15,2) NOT NULL DEFAULT '0',
	`totalCosts` decimal(15,2) NOT NULL DEFAULT '0',
	`totalProfit` decimal(15,2) NOT NULL DEFAULT '0',
	`ordersCount` int NOT NULL DEFAULT 0,
	`averageTicket` decimal(10,2) NOT NULL DEFAULT '0',
	`topProduct` varchar(255),
	`topProductQuantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailySalesReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fileValidations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`dpi` int,
	`colorMode` varchar(50),
	`hasBleed` boolean,
	`hasSafeMargin` boolean,
	`issues` longtext,
	`status` enum('enviado','em_analise','aprovado','correcao_solicitada','rejeitado') NOT NULL DEFAULT 'enviado',
	`validatedBy` int,
	`validatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fileValidations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financialRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('venda','custo','lucro','devolucao') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(255),
	`paymentMethod` enum('dinheiro','cartao_credito','cartao_debito','boleto','pix','transferencia','cheque'),
	`status` enum('pendente','processando','concluido','falhou') NOT NULL DEFAULT 'pendente',
	`recordedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financialRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productCosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialCost` decimal(10,2) NOT NULL DEFAULT '0',
	`laborCost` decimal(10,2) NOT NULL DEFAULT '0',
	`equipmentCost` decimal(10,2) NOT NULL DEFAULT '0',
	`overheadCost` decimal(10,2) NOT NULL DEFAULT '0',
	`totalCost` decimal(10,2) NOT NULL DEFAULT '0',
	`profitMarginPercent` decimal(5,2) NOT NULL DEFAULT '30',
	`lastUpdatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productCosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productionJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int NOT NULL,
	`jobNumber` varchar(50) NOT NULL,
	`status` enum('recebido','pagamento_aprovado','pre_impressao','producao','acabamento','controle_qualidade','finalizado','pronto_retirada','enviado') NOT NULL DEFAULT 'recebido',
	`productName` varchar(255) NOT NULL,
	`dimensions` varchar(100),
	`material` varchar(255),
	`printingType` varchar(255),
	`finish` varchar(255),
	`quantity` int NOT NULL,
	`assignedTo` int,
	`deadline` timestamp,
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productionJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `productionJobs_jobNumber_unique` UNIQUE(`jobNumber`)
);
--> statement-breakpoint
CREATE TABLE `productionStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productionJobId` int NOT NULL,
	`previousStatus` varchar(100),
	`newStatus` varchar(100) NOT NULL,
	`changedBy` int,
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productionStatusHistory_id` PRIMARY KEY(`id`)
);
