ALTER TABLE `carriers` ADD `originCep` varchar(9);--> statement-breakpoint
ALTER TABLE `carriers` ADD `jadlogCnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `carriers` ADD `jadlogToken` text;--> statement-breakpoint
ALTER TABLE `carriers` ADD `jadlogContaCorrente` varchar(50);--> statement-breakpoint
ALTER TABLE `carriers` ADD `jadlogCodigoFranquia` varchar(20);--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioClientId` varchar(255);--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioClientSecret` text;--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioAccessToken` text;--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioRefreshToken` text;--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioRedirectUri` varchar(500);--> statement-breakpoint
ALTER TABLE `carriers` ADD `melhorEnvioSandbox` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `carriers` ADD `vehicleType` enum('moto','automovel');--> statement-breakpoint
ALTER TABLE `carriers` ADD `driverName` varchar(100);--> statement-breakpoint
ALTER TABLE `carriers` ADD `driverPhone` varchar(20);