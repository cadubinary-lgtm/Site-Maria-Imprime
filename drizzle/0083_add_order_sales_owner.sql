-- Mantém a autoria comercial no pedido para documentos operacionais e histórico.
ALTER TABLE orders ADD COLUMN salesOwnerType VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN salesOwnerName VARCHAR(255) NULL;
