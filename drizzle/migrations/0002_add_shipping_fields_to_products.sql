-- Adicionar campos de logística na tabela products
ALTER TABLE products ADD COLUMN weight DECIMAL(8, 3) DEFAULT 0 NOT NULL COMMENT 'Peso em kg';
ALTER TABLE products ADD COLUMN height DECIMAL(8, 3) DEFAULT 0 NOT NULL COMMENT 'Altura em cm';
ALTER TABLE products ADD COLUMN width DECIMAL(8, 3) DEFAULT 0 NOT NULL COMMENT 'Largura em cm';
ALTER TABLE products ADD COLUMN length DECIMAL(8, 3) DEFAULT 0 NOT NULL COMMENT 'Comprimento em cm';
ALTER TABLE products ADD COLUMN allowPickup BOOLEAN DEFAULT true NOT NULL COMMENT 'Permite retirada na loja';
ALTER TABLE products ADD COLUMN allowMotoExpress BOOLEAN DEFAULT true NOT NULL COMMENT 'Permite moto express';
ALTER TABLE products ADD COLUMN allowedCarriers LONGTEXT DEFAULT '[]' NOT NULL COMMENT 'JSON array de IDs de transportadoras permitidas';
