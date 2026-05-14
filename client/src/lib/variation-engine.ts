/**
 * Engine de Variações - Sistema para gerenciar atributos de produtos
 * Suporta 8 tipos de atributos:
 * 1. Tipo de impressão
 * 2. Material
 * 3. Gramatura
 * 4. Acabamento
 * 5. Formato
 * 6. Cor de impressão
 * 7. Quantidade
 * 8. Prazo de produção
 */

export type AttributeType =
  | 'print_type'
  | 'material'
  | 'weight'
  | 'finishing'
  | 'format'
  | 'color'
  | 'quantity'
  | 'lead_time';

export interface AttributeValue {
  id: number;
  name: string;
  priceModifier: number; // Modificador de preço em centavos
  leadTimeModifier?: number; // Modificador de prazo em dias
}

export interface ProductAttribute {
  id: number;
  type: AttributeType;
  name: string;
  values: AttributeValue[];
  required: boolean;
}

export interface VariationSelection {
  [key: string]: number | number[]; // ID do atributo -> ID(s) do(s) valor(es)
}

export interface PricingRule {
  id: number;
  name: string;
  conditions: {
    attributeId: number;
    valueIds: number[];
  }[];
  priceModifier: number;
  leadTimeModifier?: number;
}

export interface ProductVariationConfig {
  basePrice: number; // Preço base em centavos
  attributes: ProductAttribute[];
  rules: PricingRule[];
  marginPercentage: number; // Margem em percentual (ex: 1.5 = 150%)
}

/**
 * Calcula o preço final baseado nas seleções
 */
export const calculatePrice = (
  config: ProductVariationConfig,
  selections: VariationSelection,
  area?: number // Área em m² para cálculo de preço por m²
): number => {
  let price = config.basePrice;

  // Aplicar modificadores de atributos selecionados
  config.attributes.forEach((attr) => {
    const selectedValueIds = selections[attr.id];
    if (!selectedValueIds) return;

    const valueIds = Array.isArray(selectedValueIds) ? selectedValueIds : [selectedValueIds];

    valueIds.forEach((valueId) => {
      const value = attr.values.find((v) => v.id === valueId);
      if (value) {
        price += value.priceModifier;
      }
    });
  });

  // Aplicar regras comerciais
  config.rules.forEach((rule) => {
    const ruleMatches = rule.conditions.every((condition) => {
      const selectedValueIds = selections[condition.attributeId];
      if (!selectedValueIds) return false;

      const valueIds = Array.isArray(selectedValueIds)
        ? selectedValueIds
        : [selectedValueIds];

      return condition.valueIds.some((vid) => valueIds.includes(vid));
    });

    if (ruleMatches) {
      price += rule.priceModifier;
    }
  });

  // Aplicar cálculo por área se fornecido
  if (area && area > 0) {
    price = Math.round(price * area);
  }

  // Aplicar margem
  price = Math.round(price * config.marginPercentage);

  return price;
};

/**
 * Calcula o prazo de produção baseado nas seleções
 */
export const calculateLeadTime = (
  config: ProductVariationConfig,
  selections: VariationSelection
): number => {
  let leadTime = 5; // Prazo padrão em dias

  // Aplicar modificadores de atributos selecionados
  config.attributes.forEach((attr) => {
    const selectedValueIds = selections[attr.id];
    if (!selectedValueIds) return;

    const valueIds = Array.isArray(selectedValueIds) ? selectedValueIds : [selectedValueIds];

    valueIds.forEach((valueId) => {
      const value = attr.values.find((v) => v.id === valueId);
      if (value?.leadTimeModifier) {
        leadTime += value.leadTimeModifier;
      }
    });
  });

  // Aplicar regras de produção
  config.rules.forEach((rule) => {
    const ruleMatches = rule.conditions.every((condition) => {
      const selectedValueIds = selections[condition.attributeId];
      if (!selectedValueIds) return false;

      const valueIds = Array.isArray(selectedValueIds)
        ? selectedValueIds
        : [selectedValueIds];

      return condition.valueIds.some((vid) => valueIds.includes(vid));
    });

    if (ruleMatches && rule.leadTimeModifier) {
      leadTime += rule.leadTimeModifier;
    }
  });

  return Math.max(1, leadTime); // Mínimo 1 dia
};

/**
 * Valida se todas as seleções obrigatórias foram feitas
 */
export const validateSelections = (
  config: ProductVariationConfig,
  selections: VariationSelection
): { valid: boolean; missingAttributes: string[] } => {
  const missingAttributes: string[] = [];

  config.attributes.forEach((attr) => {
    if (attr.required && !selections[attr.id]) {
      missingAttributes.push(attr.name);
    }
  });

  return {
    valid: missingAttributes.length === 0,
    missingAttributes,
  };
};

/**
 * Obtém as opções disponíveis para um atributo
 */
export const getAttributeOptions = (
  config: ProductVariationConfig,
  attributeId: number
): AttributeValue[] => {
  const attr = config.attributes.find((a) => a.id === attributeId);
  return attr?.values || [];
};

/**
 * Formata um preço em centavos para formato monetário
 */
export const formatPrice = (priceInCents: number, currency = 'R$'): string => {
  const priceInReais = priceInCents / 100;
  return `${currency} ${priceInReais.toFixed(2).replace('.', ',')}`;
};

/**
 * Calcula a área em m² baseado em largura e altura em cm
 */
export const calculateArea = (widthCm: number, heightCm: number): number => {
  if (widthCm <= 0 || heightCm <= 0) return 0;
  // Converter cm² para m²: (cm * cm) / 10000
  return (widthCm * heightCm) / 10000;
};
