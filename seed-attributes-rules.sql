-- ========================================
-- SEED: Atributos Globais e Regras de Compatibilidade
-- ========================================
-- Cria:
-- 1. Atributos globais (Material, Acabamento, Ilhós, Bastão, Laminação, Dobra)
-- 2. Valores de atributos por tipo
-- 3. Produtos de teste (Lona, Folheto, Adesivo, Placa)
-- 4. Vinculação de atributos aos produtos
-- 5. Regras de compatibilidade por categoria

-- ========================================
-- PASSO 1: Criar Atributos Globais
-- ========================================

-- Material
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Material', 'material', 'Tipo de material (Lona, Papel, Vinil, etc)', 'select', 0, 1, TRUE, NOW(), NOW());
SET @materialAttrId = LAST_INSERT_ID();

-- Acabamento
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Acabamento', 'acabamento', 'Tipo de acabamento (Brilho, Fosco, Laminado)', 'select', 0, 2, TRUE, NOW(), NOW());
SET @acabamentoAttrId = LAST_INSERT_ID();

-- Ilhós
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Ilhós', 'ilhos', 'Adicionar ilhós nas extremidades', 'select', 0, 3, TRUE, NOW(), NOW());
SET @ilhosAttrId = LAST_INSERT_ID();

-- Bastão
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Bastão', 'bastao', 'Bastão para pendurar', 'select', 0, 4, TRUE, NOW(), NOW());
SET @bastaoAttrId = LAST_INSERT_ID();

-- Laminação
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Laminação', 'laminacao', 'Tipo de laminação (Brilho, Fosco, Matte)', 'select', 0, 5, TRUE, NOW(), NOW());
SET @laminacaoAttrId = LAST_INSERT_ID();

-- Dobra
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `basePrice`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES ('Dobra', 'dobra', 'Tipo de dobra (Simples, Dupla, Sanfona)', 'select', 0, 6, TRUE, NOW(), NOW());
SET @dobraAttrId = LAST_INSERT_ID();

-- ========================================
-- PASSO 2: Criar Valores de Atributos
-- ========================================

-- Valores para Material
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@materialAttrId, 'Lona 280g', 0, 0, 0, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@materialAttrId, 'Papel Couchê 300g', -5, 0, 0, 2, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@materialAttrId, 'Vinil Adesivo', 10, 0, 0, 3, TRUE, NOW(), NOW());

-- Valores para Acabamento
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@acabamentoAttrId, 'Brilho', 0, 0, 0, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@acabamentoAttrId, 'Fosco', 5, 0, 0, 2, TRUE, NOW(), NOW());

-- Valores para Ilhós
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@ilhosAttrId, 'Sim', 15, 2, 0, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@ilhosAttrId, 'Não', 0, 0, 0, 2, TRUE, NOW(), NOW());

-- Valores para Bastão
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@bastaoAttrId, 'Sim', 20, 1, 0.5, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@bastaoAttrId, 'Não', 0, 0, 0, 2, TRUE, NOW(), NOW());

-- Valores para Laminação
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@laminacaoAttrId, 'Brilho', 10, 1, 0, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@laminacaoAttrId, 'Fosco', 12, 1, 0, 2, TRUE, NOW(), NOW());

-- Valores para Dobra
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@dobraAttrId, 'Simples', 0, 0, 0, 1, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@dobraAttrId, 'Dupla', 5, 2, 0, 2, TRUE, NOW(), NOW());

INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `weightModifier`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@dobraAttrId, 'Sanfona', 8, 3, 0, 3, TRUE, NOW(), NOW());

-- ========================================
-- PASSO 3: Criar Produtos de Teste
-- ========================================

-- Lona
INSERT INTO `products` (`name`, `description`, `price`, `segment`, `imageUrl`, `isActive`, `requiresAreaCalculation`, `createdAt`, `updatedAt`)
VALUES ('Lona 280g Brilho', 'Lona de alta qualidade para banners e lonas', 100.00, 'varejo', 'https://via.placeholder.com/300x300?text=Lona', TRUE, TRUE, NOW(), NOW());
SET @lonaProductId = LAST_INSERT_ID();

-- Folheto
INSERT INTO `products` (`name`, `description`, `price`, `segment`, `imageUrl`, `isActive`, `requiresAreaCalculation`, `createdAt`, `updatedAt`)
VALUES ('Folheto A4 Couchê 300g', 'Folheto profissional em papel couchê', 50.00, 'varejo', 'https://via.placeholder.com/300x300?text=Folheto', TRUE, FALSE, NOW(), NOW());
SET @folhetoProductId = LAST_INSERT_ID();

-- Adesivo
INSERT INTO `products` (`name`, `description`, `price`, `segment`, `imageUrl`, `isActive`, `requiresAreaCalculation`, `createdAt`, `updatedAt`)
VALUES ('Adesivo Vinil 10x10cm', 'Adesivo de vinil para personalizações', 25.00, 'varejo', 'https://via.placeholder.com/300x300?text=Adesivo', TRUE, TRUE, NOW(), NOW());
SET @adesivoProductId = LAST_INSERT_ID();

-- Placa
INSERT INTO `products` (`name`, `description`, `price`, `segment`, `imageUrl`, `isActive`, `requiresAreaCalculation`, `createdAt`, `updatedAt`)
VALUES ('Placa PVC 20x30cm', 'Placa de PVC para sinalização', 75.00, 'varejo', 'https://via.placeholder.com/300x300?text=Placa', TRUE, FALSE, NOW(), NOW());
SET @placaProductId = LAST_INSERT_ID();

-- ========================================
-- PASSO 4: Vincular Atributos aos Produtos
-- ========================================

-- Material para Lona
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, @materialAttrId, TRUE, FALSE, 1, 0, 'fixed', 0, 0, TRUE, 1, NOW(), NOW());
SET @lonaMatAttrId = LAST_INSERT_ID();

-- Acabamento para Lona
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, @acabamentoAttrId, FALSE, FALSE, 2, 0, 'fixed', 0, 0, TRUE, 2, NOW(), NOW());
SET @lonaAcabAttrId = LAST_INSERT_ID();

-- Ilhós para Lona
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, @ilhosAttrId, FALSE, FALSE, 3, 0, 'fixed', 0, 0, TRUE, 3, NOW(), NOW());
SET @lonaIlhosAttrId = LAST_INSERT_ID();

-- Bastão para Lona
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, @bastaoAttrId, FALSE, FALSE, 4, 0, 'fixed', 0, 0, TRUE, 4, NOW(), NOW());
SET @lonaBastaoAttrId = LAST_INSERT_ID();

-- Material para Folheto
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, @materialAttrId, TRUE, FALSE, 1, 0, 'fixed', 0, 0, TRUE, 1, NOW(), NOW());
SET @folhetoMatAttrId = LAST_INSERT_ID();

-- Acabamento para Folheto
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, @acabamentoAttrId, FALSE, FALSE, 2, 0, 'fixed', 0, 0, TRUE, 2, NOW(), NOW());
SET @folhetoAcabAttrId = LAST_INSERT_ID();

-- Laminação para Folheto
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, @laminacaoAttrId, FALSE, FALSE, 3, 0, 'fixed', 0, 0, TRUE, 3, NOW(), NOW());
SET @folhetoLaminacaoAttrId = LAST_INSERT_ID();

-- Dobra para Folheto
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, @dobraAttrId, FALSE, FALSE, 4, 0, 'fixed', 0, 0, TRUE, 4, NOW(), NOW());
SET @folhetoDobraAttrId = LAST_INSERT_ID();

-- Material para Adesivo
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@adesivoProductId, @materialAttrId, TRUE, FALSE, 1, 0, 'fixed', 0, 0, TRUE, 1, NOW(), NOW());
SET @adesivoMatAttrId = LAST_INSERT_ID();

-- Acabamento para Adesivo
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@adesivoProductId, @acabamentoAttrId, FALSE, FALSE, 2, 0, 'fixed', 0, 0, TRUE, 2, NOW(), NOW());
SET @adesivoAcabAttrId = LAST_INSERT_ID();

-- Laminação para Adesivo
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@adesivoProductId, @laminacaoAttrId, FALSE, FALSE, 3, 0, 'fixed', 0, 0, TRUE, 3, NOW(), NOW());
SET @adesivoLaminacaoAttrId = LAST_INSERT_ID();

-- Material para Placa
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@placaProductId, @materialAttrId, TRUE, FALSE, 1, 0, 'fixed', 0, 0, TRUE, 1, NOW(), NOW());
SET @placaMatAttrId = LAST_INSERT_ID();

-- Acabamento para Placa
INSERT INTO `productAttributes` (`productId`, `attributeId`, `isRequired`, `allowMultiple`, `displayOrder`, `priceModifier`, `calculationType`, `timeModifier`, `weightModifier`, `isActive`, `priority`, `createdAt`, `updatedAt`)
VALUES (@placaProductId, @acabamentoAttrId, FALSE, FALSE, 2, 0, 'fixed', 0, 0, TRUE, 2, NOW(), NOW());
SET @placaAcabAttrId = LAST_INSERT_ID();

-- ========================================
-- PASSO 5: Criar Regras de Compatibilidade
-- ========================================

-- LONA: Mostrar Ilhós e Bastão quando Material = Lona
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, 'Lona requer Ilhós e Bastão', 'Quando material é Lona, mostrar opções de Ilhós e Bastão', TRUE, NOW(), NOW());
SET @lonaRule1Id = LAST_INSERT_ID();

-- Condição: Material = Lona 280g
INSERT INTO `attributeRuleConditions` (`ruleId`, `attributeId`, `operator`, `value`, `createdAt`)
VALUES (@lonaRule1Id, @materialAttrId, 'equals', 'Lona 280g', NOW());

-- Ações: Mostrar Ilhós e Bastão
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@lonaRule1Id, @ilhosAttrId, 'show', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@lonaRule1Id, @bastaoAttrId, 'show', NULL, NOW());

-- LONA: Ocultar Laminação e Dobra para Lona
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@lonaProductId, 'Lona não permite Laminação ou Dobra', 'Lona não é compatível com Laminação ou Dobra', TRUE, NOW(), NOW());
SET @lonaRule2Id = LAST_INSERT_ID();

-- Condição: Material = Lona 280g
INSERT INTO `attributeRuleConditions` (`ruleId`, `attributeId`, `operator`, `value`, `createdAt`)
VALUES (@lonaRule2Id, @materialAttrId, 'equals', 'Lona 280g', NOW());

-- Ações: Ocultar Laminação e Dobra
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@lonaRule2Id, @laminacaoAttrId, 'hide', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@lonaRule2Id, @dobraAttrId, 'hide', NULL, NOW());

-- FOLHETO: Mostrar Dobra quando Material = Papel Couchê
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, 'Folheto permite Dobra', 'Quando material é Papel Couchê, mostrar opção de Dobra', TRUE, NOW(), NOW());
SET @folhetoRule1Id = LAST_INSERT_ID();

-- Condição: Material = Papel Couchê 300g
INSERT INTO `attributeRuleConditions` (`ruleId`, `attributeId`, `operator`, `value`, `createdAt`)
VALUES (@folhetoRule1Id, @materialAttrId, 'equals', 'Papel Couchê 300g', NOW());

-- Ação: Mostrar Dobra
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@folhetoRule1Id, @dobraAttrId, 'show', NULL, NOW());

-- FOLHETO: Ocultar Ilhós e Bastão
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@folhetoProductId, 'Folheto não permite Ilhós ou Bastão', 'Folheto não é compatível com Ilhós ou Bastão', TRUE, NOW(), NOW());
SET @folhetoRule2Id = LAST_INSERT_ID();

-- Condições: Sem condições (sempre ativa)
-- Ações: Ocultar Ilhós e Bastão
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@folhetoRule2Id, @ilhosAttrId, 'hide', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@folhetoRule2Id, @bastaoAttrId, 'hide', NULL, NOW());

-- ADESIVO: Ocultar Dobra
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@adesivoProductId, 'Adesivo não permite Dobra', 'Adesivo não é compatível com Dobra', TRUE, NOW(), NOW());
SET @adesivoRule1Id = LAST_INSERT_ID();

-- Ações: Ocultar Dobra
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@adesivoRule1Id, @dobraAttrId, 'hide', NULL, NOW());

-- ADESIVO: Ocultar Ilhós e Bastão
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@adesivoProductId, 'Adesivo não permite Ilhós ou Bastão', 'Adesivo não é compatível com Ilhós ou Bastão', TRUE, NOW(), NOW());
SET @adesivoRule2Id = LAST_INSERT_ID();

-- Ações: Ocultar Ilhós e Bastão
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@adesivoRule2Id, @ilhosAttrId, 'hide', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@adesivoRule2Id, @bastaoAttrId, 'hide', NULL, NOW());

-- PLACA: Ocultar Dobra, Ilhós e Bastão
INSERT INTO `attributeRules` (`productId`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES (@placaProductId, 'Placa não permite Dobra, Ilhós ou Bastão', 'Placa não é compatível com Dobra, Ilhós ou Bastão', TRUE, NOW(), NOW());
SET @placaRule1Id = LAST_INSERT_ID();

-- Ações: Ocultar Dobra, Ilhós e Bastão
INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@placaRule1Id, @dobraAttrId, 'hide', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@placaRule1Id, @ilhosAttrId, 'hide', NULL, NOW());

INSERT INTO `attributeRuleActions` (`ruleId`, `targetAttributeId`, `action`, `value`, `createdAt`)
VALUES (@placaRule1Id, @bastaoAttrId, 'hide', NULL, NOW());

-- ========================================
-- Seed Concluído
-- ========================================
-- ✅ 6 atributos globais criados
-- ✅ 13 valores de atributos criados
-- ✅ 4 produtos de teste criados
-- ✅ Atributos vinculados aos produtos
-- ✅ Regras de compatibilidade por categoria implementadas
