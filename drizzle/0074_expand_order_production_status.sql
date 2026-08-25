ALTER TABLE `orders`
  MODIFY COLUMN `productionStatus` varchar(50) NULL DEFAULT 'pendente';
--> statement-breakpoint
UPDATE `orders`
  SET `productionStatus` = 'pendente'
  WHERE `status` = 'em_producao' AND `productionStatus` = 'pending';
--> statement-breakpoint
UPDATE `orders`
  SET `productionStatus` = NULL
  WHERE `status` IN ('pronto_entrega', 'pronto_retirada', 'entregue', 'cancelado');
