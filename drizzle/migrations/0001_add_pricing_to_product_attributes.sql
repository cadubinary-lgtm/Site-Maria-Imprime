-- Migration: Add Pricing to Product Attributes
-- Date: 2026-05-13
-- Description: Centraliza precificação no vínculo produto↔atributo

-- ============================================
-- FASE 1: Adicionar colunas a productAttributes
-- ============================================

ALTER TABLE productAttributes ADD COLUMN (
  -- Precificação do atributo para este produto
  priceModifier DECIMAL(10,2) DEFAULT 0 NOT NULL COMMENT 'Valor adicional (ex: +R$15)',
  
  -- Tipo de cálculo
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity') 
    DEFAULT 'fixed' NOT NULL COMMENT 'Tipo de cálculo do preço',
  
  -- Impacto no prazo
  timeModifier INT DEFAULT 0 NOT NULL COMMENT 'Impacto no prazo em horas',
  
  -- Impacto no peso
  weightModifier DECIMAL(10,4) DEFAULT 0 NOT NULL COMMENT 'Impacto no peso em kg',
  
  -- Controle de ativação
  isActive BOOLEAN DEFAULT true NOT NULL COMMENT 'Se este atributo está ativo para o produto',
  
  -- Prioridade de exibição
  priority INT DEFAULT 0 NOT NULL COMMENT 'Ordem de exibição (0 = primeiro)',
  
  -- Regras específicas do vínculo (JSON)
  rules JSON COMMENT 'Regras adicionais em formato JSON'
);

-- ============================================
-- FASE 2: Criar índices para performance
-- ============================================

ALTER TABLE productAttributes 
ADD INDEX idx_product (productId),
ADD INDEX idx_attribute (attributeId),
ADD INDEX idx_active (isActive),
ADD INDEX idx_priority (priority);

-- ============================================
-- FASE 3: Garantir unicidade do vínculo
-- ============================================

-- Remover índice antigo se existir
ALTER TABLE productAttributes 
DROP INDEX IF EXISTS unique_product_attribute;

-- Criar novo índice único
ALTER TABLE productAttributes 
ADD UNIQUE KEY unique_product_attribute (productId, attributeId);

-- ============================================
-- FASE 4: Migrar dados de attributeValues
-- ============================================

-- Copiar preços de attributeValues para productAttributes
-- Estratégia: Usar o primeiro valor do atributo como preço padrão
UPDATE productAttributes pa
SET pa.priceModifier = (
  SELECT COALESCE(av.priceModifier, 0)
  FROM attributeValues av
  WHERE av.attributeId = pa.attributeId
  ORDER BY av.displayOrder ASC
  LIMIT 1
)
WHERE pa.priceModifier = 0;

-- Copiar timeModifier
UPDATE productAttributes pa
SET pa.timeModifier = (
  SELECT COALESCE(av.timeModifier, 0)
  FROM attributeValues av
  WHERE av.attributeId = pa.attributeId
  ORDER BY av.displayOrder ASC
  LIMIT 1
)
WHERE pa.timeModifier = 0;

-- Copiar weightModifier
UPDATE productAttributes pa
SET pa.weightModifier = (
  SELECT COALESCE(av.weightModifier, 0)
  FROM attributeValues av
  WHERE av.attributeId = pa.attributeId
  ORDER BY av.displayOrder ASC
  LIMIT 1
)
WHERE pa.weightModifier = 0;

-- ============================================
-- FASE 5: Adicionar colunas a productAttributeValues
-- ============================================

ALTER TABLE productAttributeValues ADD COLUMN (
  -- Preço pode variar por valor também (opcional)
  priceModifier DECIMAL(10,2) COMMENT 'Override do preço para este valor específico',
  
  -- Tipo de cálculo pode variar por valor
  calculationType ENUM('fixed', 'percentage', 'multiplier', 'per_sqm', 'per_quantity') 
    COMMENT 'Override do tipo de cálculo para este valor específico'
);

-- ============================================
-- FASE 6: Criar índices em productAttributeValues
-- ============================================

ALTER TABLE productAttributeValues 
ADD INDEX idx_product_attribute (productAttributeId),
ADD INDEX idx_attribute_value (attributeValueId),
ADD INDEX idx_enabled (isEnabled);

-- ============================================
-- FASE 7: Remover colunas de attributeValues (OPCIONAL)
-- ============================================

-- Comentário: Manter por enquanto para compatibilidade
-- Remover apenas após validação completa e testes
-- ALTER TABLE attributeValues DROP COLUMN priceModifier;
-- ALTER TABLE attributeValues DROP COLUMN timeModifier;
-- ALTER TABLE attributeValues DROP COLUMN weightModifier;

-- ============================================
-- FASE 8: Validação
-- ============================================

-- Verificar integridade dos dados
SELECT 
  COUNT(*) as total_vinculos,
  SUM(CASE WHEN priceModifier > 0 THEN 1 ELSE 0 END) as com_preco,
  SUM(CASE WHEN timeModifier > 0 THEN 1 ELSE 0 END) as com_prazo,
  SUM(CASE WHEN weightModifier > 0 THEN 1 ELSE 0 END) as com_peso,
  SUM(CASE WHEN isActive = true THEN 1 ELSE 0 END) as ativos
FROM productAttributes;

-- ============================================
-- Fim da Migration
-- ============================================
