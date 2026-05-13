-- Limpar dados existentes
DELETE FROM `attributeValues`;
DELETE FROM `attributes`;

-- MATERIAIS - PAPÉIS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Couchê 90g', 'couche-90g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 1, true, NOW(), NOW()),
('Couchê 115g', 'couche-115g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 2, true, NOW(), NOW()),
('Couchê 150g', 'couche-150g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 3, true, NOW(), NOW()),
('Couchê 170g', 'couche-170g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 4, true, NOW(), NOW()),
('Couchê 210g', 'couche-210g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 5, true, NOW(), NOW()),
('Couchê 250g', 'couche-250g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 6, true, NOW(), NOW()),
('Couchê 300g', 'couche-300g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 7, true, NOW(), NOW()),
('Couchê 350g', 'couche-350g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 8, true, NOW(), NOW()),
('Offset 75g', 'offset-75g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 9, true, NOW(), NOW()),
('Offset 90g', 'offset-90g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 10, true, NOW(), NOW()),
('Offset 120g', 'offset-120g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 11, true, NOW(), NOW()),
('Offset 180g', 'offset-180g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 12, true, NOW(), NOW()),
('Supremo 250g', 'supremo-250g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 13, true, NOW(), NOW()),
('Supremo 300g', 'supremo-300g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 14, true, NOW(), NOW()),
('Kraft 240g', 'kraft-240g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 15, true, NOW(), NOW()),
('Kraft 300g', 'kraft-300g', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 16, true, NOW(), NOW()),
('Reciclato', 'reciclato', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 17, true, NOW(), NOW()),
('Sulfite', 'sulfite', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 18, true, NOW(), NOW()),
('Duplex', 'duplex', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 19, true, NOW(), NOW()),
('Triplex', 'triplex', 'MATERIAIS — PAPÉIS', 'checkbox', NULL, 20, true, NOW(), NOW());

-- MATERIAIS - VINIL
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Vinil brilho', 'vinil-brilho', 'MATERIAIS — VINIL', 'checkbox', NULL, 21, true, NOW(), NOW()),
('Vinil fosco', 'vinil-fosco', 'MATERIAIS — VINIL', 'checkbox', NULL, 22, true, NOW(), NOW()),
('Vinil transparente', 'vinil-transparente', 'MATERIAIS — VINIL', 'checkbox', NULL, 23, true, NOW(), NOW()),
('Vinil perfurado', 'vinil-perfurado', 'MATERIAIS — VINIL', 'checkbox', NULL, 24, true, NOW(), NOW()),
('Vinil blackout', 'vinil-blackout', 'MATERIAIS — VINIL', 'checkbox', NULL, 25, true, NOW(), NOW()),
('Vinil automotivo', 'vinil-automotivo', 'MATERIAIS — VINIL', 'checkbox', NULL, 26, true, NOW(), NOW());

-- MATERIAIS - CHAPAS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('PVC 1mm', 'pvc-1mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 27, true, NOW(), NOW()),
('PVC 2mm', 'pvc-2mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 28, true, NOW(), NOW()),
('PVC 3mm', 'pvc-3mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 29, true, NOW(), NOW()),
('PVC expandido', 'pvc-expandido', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 30, true, NOW(), NOW()),
('PS 1mm', 'ps-1mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 31, true, NOW(), NOW()),
('PS 2mm', 'ps-2mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 32, true, NOW(), NOW()),
('Acrílico 2mm', 'acrilico-2mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 33, true, NOW(), NOW()),
('Acrílico 3mm', 'acrilico-3mm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 34, true, NOW(), NOW()),
('ACM', 'acm', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 35, true, NOW(), NOW()),
('MDF', 'mdf', 'MATERIAIS — CHAPAS', 'checkbox', NULL, 36, true, NOW(), NOW());

-- MATERIAIS - LONAS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Lona 280g', 'lona-280g', 'MATERIAIS — LONAS', 'checkbox', NULL, 37, true, NOW(), NOW()),
('Lona 340g', 'lona-340g', 'MATERIAIS — LONAS', 'checkbox', NULL, 38, true, NOW(), NOW()),
('Lona 440g', 'lona-440g', 'MATERIAIS — LONAS', 'checkbox', NULL, 39, true, NOW(), NOW()),
('Lona blackout', 'lona-blackout', 'MATERIAIS — LONAS', 'checkbox', NULL, 40, true, NOW(), NOW());

-- REVESTIMENTOS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Sem revestimento', 'sem-revestimento', 'REVESTIMENTOS', 'checkbox', NULL, 41, true, NOW(), NOW()),
('Laminação brilho', 'laminacao-brilho', 'REVESTIMENTOS', 'checkbox', NULL, 42, true, NOW(), NOW()),
('Laminação fosca', 'laminacao-fosca', 'REVESTIMENTOS', 'checkbox', NULL, 43, true, NOW(), NOW()),
('Laminação holográfica', 'laminacao-holografica', 'REVESTIMENTOS', 'checkbox', NULL, 44, true, NOW(), NOW()),
('Verniz total brilho', 'verniz-total-brilho', 'REVESTIMENTOS', 'checkbox', NULL, 45, true, NOW(), NOW()),
('Verniz UV local', 'verniz-uv-local', 'REVESTIMENTOS', 'checkbox', NULL, 46, true, NOW(), NOW()),
('Soft touch', 'soft-touch', 'REVESTIMENTOS', 'checkbox', NULL, 47, true, NOW(), NOW()),
('Plastificação', 'plastificacao', 'REVESTIMENTOS', 'checkbox', NULL, 48, true, NOW(), NOW()),
('Proteção UV', 'protecao-uv', 'REVESTIMENTOS', 'checkbox', NULL, 49, true, NOW(), NOW());

-- ACABAMENTOS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Corte reto', 'corte-reto', 'ACABAMENTOS', 'checkbox', NULL, 50, true, NOW(), NOW()),
('Refile', 'refile', 'ACABAMENTOS', 'checkbox', NULL, 51, true, NOW(), NOW()),
('Meio corte', 'meio-corte', 'ACABAMENTOS', 'checkbox', NULL, 52, true, NOW(), NOW()),
('Corte especial', 'corte-especial', 'ACABAMENTOS', 'checkbox', NULL, 53, true, NOW(), NOW()),
('Corte eletrônico', 'corte-eletronico', 'ACABAMENTOS', 'checkbox', NULL, 54, true, NOW(), NOW()),
('Vinco', 'vinco', 'ACABAMENTOS', 'checkbox', NULL, 55, true, NOW(), NOW()),
('Dobra central', 'dobra-central', 'ACABAMENTOS', 'checkbox', NULL, 56, true, NOW(), NOW()),
('Dobra sanfona', 'dobra-sanfona', 'ACABAMENTOS', 'checkbox', NULL, 57, true, NOW(), NOW()),
('Dobra janela', 'dobra-janela', 'ACABAMENTOS', 'checkbox', NULL, 58, true, NOW(), NOW()),
('Dobra carteira', 'dobra-carteira', 'ACABAMENTOS', 'checkbox', NULL, 59, true, NOW(), NOW()),
('Serrilha', 'serrilha', 'ACABAMENTOS', 'checkbox', NULL, 60, true, NOW(), NOW()),
('Furo', 'furo', 'ACABAMENTOS', 'checkbox', NULL, 61, true, NOW(), NOW()),
('Ilhós', 'ilhos', 'ACABAMENTOS', 'checkbox', NULL, 62, true, NOW(), NOW()),
('Solda', 'solda', 'ACABAMENTOS', 'checkbox', NULL, 63, true, NOW(), NOW()),
('Bastão', 'bastao', 'ACABAMENTOS', 'checkbox', NULL, 64, true, NOW(), NOW()),
('Hot stamping', 'hot-stamping', 'ACABAMENTOS', 'checkbox', NULL, 65, true, NOW(), NOW()),
('Relevo americano', 'relevo-americano', 'ACABAMENTOS', 'checkbox', NULL, 66, true, NOW(), NOW()),
('Cantos arredondados', 'cantos-arredondados', 'ACABAMENTOS', 'checkbox', NULL, 67, true, NOW(), NOW()),
('Faca especial', 'faca-especial', 'ACABAMENTOS', 'checkbox', NULL, 68, true, NOW(), NOW()),
('Espiral', 'espiral', 'ACABAMENTOS', 'checkbox', NULL, 69, true, NOW(), NOW()),
('Wire-o', 'wire-o', 'ACABAMENTOS', 'checkbox', NULL, 70, true, NOW(), NOW()),
('Cola', 'cola', 'ACABAMENTOS', 'checkbox', NULL, 71, true, NOW(), NOW()),
('Encadernação', 'encadernacao', 'ACABAMENTOS', 'checkbox', NULL, 72, true, NOW(), NOW());

-- PRAZOS
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Normal', 'prazo-normal', 'PRAZOS', 'radio', NULL, 73, true, NOW(), NOW()),
('Urgente', 'prazo-urgente', 'PRAZOS', 'radio', NULL, 74, true, NOW(), NOW()),
('Expresso', 'prazo-expresso', 'PRAZOS', 'radio', NULL, 75, true, NOW(), NOW()),
('Super Expresso', 'prazo-super-expresso', 'PRAZOS', 'radio', NULL, 76, true, NOW(), NOW());

-- OPÇÕES DE ARTE
INSERT INTO `attributes` (`name`, `slug`, `description`, `type`, `icon`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('Tenho minha arte pronta', 'arte-pronta', 'OPÇÕES DE ARTE', 'radio', NULL, 77, true, NOW(), NOW()),
('Preciso criar arte / contratar designer', 'arte-criar', 'OPÇÕES DE ARTE', 'radio', NULL, 78, true, NOW(), NOW()),
('Conferência profissional', 'arte-conferencia', 'OPÇÕES DE ARTE', 'radio', NULL, 79, true, NOW(), NOW());

-- Inserir valores dos atributos (um valor por atributo com modificadores)
INSERT INTO `attributeValues` (`attributeId`, `value`, `priceModifier`, `timeModifier`, `isActive`, `createdAt`, `updatedAt`)
SELECT `id`, `name`, 
  CASE `slug`
    WHEN 'couche-90g' THEN 0.50
    WHEN 'couche-115g' THEN 0.75
    WHEN 'couche-150g' THEN 1.00
    WHEN 'couche-170g' THEN 1.25
    WHEN 'couche-210g' THEN 1.50
    WHEN 'couche-250g' THEN 1.75
    WHEN 'couche-300g' THEN 2.00
    WHEN 'couche-350g' THEN 2.25
    WHEN 'offset-75g' THEN 0.25
    WHEN 'offset-90g' THEN 0.35
    WHEN 'offset-120g' THEN 0.50
    WHEN 'offset-180g' THEN 0.75
    WHEN 'supremo-250g' THEN 1.50
    WHEN 'supremo-300g' THEN 1.75
    WHEN 'kraft-240g' THEN 1.00
    WHEN 'kraft-300g' THEN 1.25
    WHEN 'reciclato' THEN 0.80
    WHEN 'sulfite' THEN 0.30
    WHEN 'duplex' THEN 1.20
    WHEN 'triplex' THEN 1.50
    WHEN 'vinil-brilho' THEN 2.00
    WHEN 'vinil-fosco' THEN 2.00
    WHEN 'vinil-transparente' THEN 2.50
    WHEN 'vinil-perfurado' THEN 3.00
    WHEN 'vinil-blackout' THEN 3.50
    WHEN 'vinil-automotivo' THEN 4.00
    WHEN 'pvc-1mm' THEN 3.00
    WHEN 'pvc-2mm' THEN 5.00
    WHEN 'pvc-3mm' THEN 7.00
    WHEN 'pvc-expandido' THEN 8.00
    WHEN 'ps-1mm' THEN 2.50
    WHEN 'ps-2mm' THEN 4.00
    WHEN 'acrilico-2mm' THEN 6.00
    WHEN 'acrilico-3mm' THEN 8.00
    WHEN 'acm' THEN 10.00
    WHEN 'mdf' THEN 5.00
    WHEN 'lona-280g' THEN 1.50
    WHEN 'lona-340g' THEN 2.00
    WHEN 'lona-440g' THEN 2.50
    WHEN 'lona-blackout' THEN 3.50
    WHEN 'sem-revestimento' THEN 0
    WHEN 'laminacao-brilho' THEN 0.50
    WHEN 'laminacao-fosca' THEN 0.50
    WHEN 'laminacao-holografica' THEN 1.50
    WHEN 'verniz-total-brilho' THEN 0.75
    WHEN 'verniz-uv-local' THEN 1.00
    WHEN 'soft-touch' THEN 1.25
    WHEN 'plastificacao' THEN 0.60
    WHEN 'protecao-uv' THEN 0.80
    WHEN 'corte-reto' THEN 0
    WHEN 'refile' THEN 0.25
    WHEN 'meio-corte' THEN 0.50
    WHEN 'corte-especial' THEN 1.50
    WHEN 'corte-eletronico' THEN 2.00
    WHEN 'vinco' THEN 0.30
    WHEN 'dobra-central' THEN 0.40
    WHEN 'dobra-sanfona' THEN 0.60
    WHEN 'dobra-janela' THEN 0.50
    WHEN 'dobra-carteira' THEN 0.50
    WHEN 'serrilha' THEN 0.35
    WHEN 'furo' THEN 0.25
    WHEN 'ilhos' THEN 0.50
    WHEN 'solda' THEN 0.75
    WHEN 'bastao' THEN 1.00
    WHEN 'hot-stamping' THEN 2.00
    WHEN 'relevo-americano' THEN 1.50
    WHEN 'cantos-arredondados' THEN 0.40
    WHEN 'faca-especial' THEN 1.50
    WHEN 'espiral' THEN 1.00
    WHEN 'wire-o' THEN 1.00
    WHEN 'cola' THEN 0.50
    WHEN 'encadernacao' THEN 2.00
    WHEN 'prazo-normal' THEN 0
    WHEN 'prazo-urgente' THEN 5.00
    WHEN 'prazo-expresso' THEN 10.00
    WHEN 'prazo-super-expresso' THEN 20.00
    WHEN 'arte-pronta' THEN 0
    WHEN 'arte-criar' THEN 50.00
    WHEN 'arte-conferencia' THEN 25.00
    ELSE 0
  END,
  CASE `slug`
    WHEN 'vinil-brilho' THEN 1
    WHEN 'vinil-fosco' THEN 1
    WHEN 'vinil-transparente' THEN 1
    WHEN 'vinil-perfurado' THEN 1
    WHEN 'vinil-blackout' THEN 1
    WHEN 'vinil-automotivo' THEN 2
    WHEN 'pvc-1mm' THEN 1
    WHEN 'pvc-2mm' THEN 1
    WHEN 'pvc-3mm' THEN 1
    WHEN 'pvc-expandido' THEN 2
    WHEN 'ps-1mm' THEN 1
    WHEN 'ps-2mm' THEN 1
    WHEN 'acrilico-2mm' THEN 2
    WHEN 'acrilico-3mm' THEN 2
    WHEN 'acm' THEN 2
    WHEN 'mdf' THEN 2
    WHEN 'lona-blackout' THEN 1
    WHEN 'laminacao-brilho' THEN 1
    WHEN 'laminacao-fosca' THEN 1
    WHEN 'laminacao-holografica' THEN 2
    WHEN 'verniz-total-brilho' THEN 1
    WHEN 'verniz-uv-local' THEN 1
    WHEN 'soft-touch' THEN 1
    WHEN 'plastificacao' THEN 1
    WHEN 'protecao-uv' THEN 1
    WHEN 'meio-corte' THEN 1
    WHEN 'corte-especial' THEN 2
    WHEN 'corte-eletronico' THEN 2
    WHEN 'dobra-sanfona' THEN 1
    WHEN 'dobra-janela' THEN 1
    WHEN 'dobra-carteira' THEN 1
    WHEN 'solda' THEN 1
    WHEN 'bastao' THEN 1
    WHEN 'hot-stamping' THEN 2
    WHEN 'relevo-americano' THEN 2
    WHEN 'faca-especial' THEN 2
    WHEN 'espiral' THEN 1
    WHEN 'wire-o' THEN 1
    WHEN 'cola' THEN 1
    WHEN 'encadernacao' THEN 2
    WHEN 'prazo-urgente' THEN -2
    WHEN 'prazo-expresso' THEN -3
    WHEN 'prazo-super-expresso' THEN -5
    WHEN 'arte-criar' THEN 5
    WHEN 'arte-conferencia' THEN 2
    ELSE 0
  END,
  true,
  NOW(),
  NOW()
FROM `attributes`;
