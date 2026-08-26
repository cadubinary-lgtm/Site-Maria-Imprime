ALTER TABLE `standaloneReceipts`
  ADD COLUMN `status` varchar(20) NOT NULL DEFAULT 'ativo';

ALTER TABLE `standaloneReceipts`
  ADD COLUMN `cancelledAt` bigint,
  ADD COLUMN `cancelledByAdminId` int,
  ADD COLUMN `cancelledByAdminName` varchar(150),
  ADD COLUMN `cancelReason` longtext,
  ADD COLUMN `whatsappPreparedAt` bigint;
