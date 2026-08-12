CREATE TABLE IF NOT EXISTS `automationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`type` enum('whatsapp','email','sms','notificacao') NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`message` longtext,
	`status` enum('pendente','enviado','falhou') NOT NULL DEFAULT 'pendente',
	`errorMessage` longtext,
	`sentAt` timestamp NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `automationLogs_id` PRIMARY KEY(`id`)
);
