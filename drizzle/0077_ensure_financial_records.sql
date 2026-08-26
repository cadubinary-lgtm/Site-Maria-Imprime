CREATE TABLE IF NOT EXISTS `financialRecords` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `type` enum('venda','custo','lucro','devolucao') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255),
  `paymentMethod` enum('dinheiro','cartao_credito','cartao_debito','boleto','pix','transferencia','cheque'),
  `status` enum('pendente','processando','concluido','falhou') NOT NULL DEFAULT 'pendente',
  `recordedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `financialRecords_id` PRIMARY KEY(`id`)
);
