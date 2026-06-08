CREATE TABLE `financeiro` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pedidoId` int,
	`orderNumber` varchar(50),
	`cliente` varchar(255),
	`telefone` varchar(30),
	`email` varchar(255),
	`valor` decimal(10,2) NOT NULL,
	`formaPagamento` enum('dinheiro','pix','cartao_credito','cartao_debito','boleto','transferencia','pagar_na_retirada','outro') DEFAULT 'outro',
	`formaEntrega` enum('retirada_loja','moto_express','transportadora','correios','outro') DEFAULT 'outro',
	`status` enum('a_receber','aguardando_producao','pronto_retirada','pago','retirado_cliente','retirado_terceiros','cancelado') NOT NULL DEFAULT 'a_receber',
	`dataVencimento` bigint,
	`dataPagamento` bigint,
	`dataRetiradaPrevista` bigint,
	`observacoes` text,
	`pixQrCode` text,
	`pixCopiaECola` text,
	`cobrancaEnviada` boolean DEFAULT false,
	`dataCobranca` bigint,
	`criadoPor` int,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeiro_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeiroNotificacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`financeiroId` int NOT NULL,
	`tipo` enum('aguardando_pagamento','aguardando_retirada','retirada_atrasada','cobranca_vencida','pagamento_pendente_7dias') NOT NULL,
	`mensagem` text,
	`lida` boolean DEFAULT false,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financeiroNotificacoes_id` PRIMARY KEY(`id`)
);
