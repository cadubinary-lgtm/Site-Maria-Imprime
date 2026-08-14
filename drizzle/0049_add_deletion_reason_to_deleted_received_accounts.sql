ALTER TABLE `deletedReceivedAccounts`
  ADD COLUMN `deletionReason` varchar(1000) NULL AFTER `deletedByAdminName`;
