CREATE TABLE `adminAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(255) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('superadmin','admin','production') NOT NULL DEFAULT 'admin',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`lastLogin` bigint,
	`loginAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` bigint,
	`createdBy` int,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `adminAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `adminSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`expiresAt` bigint NOT NULL,
	`createdAt` bigint NOT NULL,
	`ipAddress` varchar(50),
	`userAgent` varchar(500),
	CONSTRAINT `adminSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminSessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int,
	`adminName` varchar(150),
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` varchar(50),
	`before` text,
	`after` text,
	`ipAddress` varchar(50),
	`createdAt` bigint NOT NULL,
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adminSessions` ADD CONSTRAINT `adminSessions_adminId_adminAccounts_id_fk` FOREIGN KEY (`adminId`) REFERENCES `adminAccounts`(`id`) ON DELETE cascade ON UPDATE no action;