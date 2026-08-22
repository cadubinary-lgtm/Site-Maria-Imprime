-- Biblioteca de prazos globais reutilizáveis em novos produtos
CREATE TABLE IF NOT EXISTS `globalDeliveryOptions` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `name` varchar(255) NOT NULL,
  `daysToDeliver` int NOT NULL,
  `pricePerM2` decimal(10,2) NOT NULL DEFAULT '0',
  `isActive` boolean NOT NULL DEFAULT true,
  `order` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir os 3 prazos padrão iniciais
INSERT INTO `globalDeliveryOptions` (`name`, `daysToDeliver`, `pricePerM2`, `isActive`, `order`) VALUES
  ('Prazo Normal', 5, '0.00', true, 0),
  ('Mesmo Dia', 0, '20.00', true, 1),
  ('24 Horas', 1, '10.00', true, 2);
