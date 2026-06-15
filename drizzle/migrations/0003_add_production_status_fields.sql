-- Add preProductionStatus and productionStatus fields to orders table
ALTER TABLE `orders` 
ADD COLUMN `preProductionStatus` ENUM('liberado_analise', 'arte_final_aprovada') DEFAULT 'liberado_analise' AFTER `shippingCarrierId`,
ADD COLUMN `productionStatus` ENUM('pendente', 'impresso', 'acabamento_finalizado') DEFAULT 'pendente' AFTER `preProductionStatus`;
