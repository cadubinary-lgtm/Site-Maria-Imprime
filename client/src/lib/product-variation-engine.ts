/**
 * Engine de Variações de Produtos - Categorias Fixas com Variáveis Dinâmicas
 * 
 * Estrutura:
 * - 8 Categorias Fixas (sempre na mesma ordem)
 * - Variáveis dinâmicas vinculadas por produto
 * - Calculadora específica por produto
 */

export type AttributeCategory =
  | 'print_type'      // Tipo de impressão
  | 'material'        // Material
  | 'weight'          // Gramatura
  | 'finishing'       // Acabamento
  | 'format'          // Formato
  | 'color'           // Cor de impressão
  | 'quantity'        // Quantidade
  | 'lead_time';      // Prazo de produção

// Ordem fixa das categorias
export const FIXED_CATEGORIES: AttributeCategory[] = [
  'print_type',
  'material',
  'weight',
  'finishing',
  'format',
  'color',
  'quantity',
  'lead_time',
];

// Labels das categorias
export const CATEGORY_LABELS: Record<AttributeCategory, string> = {
  print_type: 'Tipo de Impressão',
  material: 'Material',
  weight: 'Gramatura',
  finishing: 'Acabamento',
  format: 'Formato',
  color: 'Cor de Impressão',
  quantity: 'Quantidade',
  lead_time: 'Prazo de Produção',
};

export interface VariableValue {
  id: number;
  name: string;
  priceModifier: number; // em centavos
  leadTimeModifier?: number; // em dias
}

export interface ProductVariable {
  id: number;
  category: AttributeCategory;
  name: string;
  values: VariableValue[];
  required: boolean;
}

export interface ProductVariationData {
  productId: number;
  basePrice: number; // em centavos
  variables: ProductVariable[]; // Variáveis vinculadas ao produto
  marginPercentage: number; // Ex: 1.5 = 150%
}

export interface ProductSelection {
  [variableId: number]: number; // variableId -> valueId
}

/**
 * Obtém as variáveis de uma categoria específica para um produto
 */
export const getCategoryVariables = (
  data: ProductVariationData,
  category: AttributeCategory
): ProductVariable[] => {
  return data.variables.filter((v) => v.category === category);
};

/**
 * Obtém todas as categorias com variáveis para um produto
 * Retorna apenas as categorias que têm variáveis vinculadas
 */
export const getProductCategories = (data: ProductVariationData): AttributeCategory[] => {
  const categoriesWithVariables = new Set<AttributeCategory>();
  
  data.variables.forEach((v) => {
    categoriesWithVariables.add(v.category);
  });

  // Retornar na ordem fixa, mas apenas as que têm variáveis
  return FIXED_CATEGORIES.filter((cat) => categoriesWithVariables.has(cat));
};

/**
 * Calcula o preço final baseado nas seleções do produto
 */
export const calculateProductPrice = (
  data: ProductVariationData,
  selections: ProductSelection,
  area?: number // Área em m² para cálculo de preço por m²
): number => {
  let price = data.basePrice;

  // Aplicar modificadores de variáveis selecionadas
  data.variables.forEach((variable) => {
    const selectedValueId = selections[variable.id];
    if (!selectedValueId) return;

    const value = variable.values.find((v) => v.id === selectedValueId);
    if (value) {
      price += value.priceModifier;
    }
  });

  // Aplicar cálculo por área se fornecido
  if (area && area > 0) {
    price = Math.round(price * area);
  }

  // Aplicar margem
  price = Math.round(price * data.marginPercentage);

  return price;
};

/**
 * Calcula o prazo de produção baseado nas seleções
 */
export const calculateProductLeadTime = (
  data: ProductVariationData,
  selections: ProductSelection
): number => {
  let leadTime = 5; // Prazo padrão em dias

  // Aplicar modificadores de variáveis selecionadas
  data.variables.forEach((variable) => {
    const selectedValueId = selections[variable.id];
    if (!selectedValueId) return;

    const value = variable.values.find((v) => v.id === selectedValueId);
    if (value?.leadTimeModifier) {
      leadTime += value.leadTimeModifier;
    }
  });

  return Math.max(1, leadTime); // Mínimo 1 dia
};

/**
 * Valida se todas as variáveis obrigatórias foram selecionadas
 */
export const validateProductSelections = (
  data: ProductVariationData,
  selections: ProductSelection
): { valid: boolean; missingVariables: string[] } => {
  const missingVariables: string[] = [];

  data.variables.forEach((variable) => {
    if (variable.required && !selections[variable.id]) {
      missingVariables.push(variable.name);
    }
  });

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  };
};

/**
 * Obtém os valores disponíveis para uma variável
 */
export const getVariableValues = (
  data: ProductVariationData,
  variableId: number
): VariableValue[] => {
  const variable = data.variables.find((v) => v.id === variableId);
  return variable?.values || [];
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

/**
 * Obtém o percentual de conclusão da configuração
 */
export const getCompletionPercentage = (
  data: ProductVariationData,
  selections: ProductSelection
): number => {
  const requiredVariables = data.variables.filter((v) => v.required);
  if (requiredVariables.length === 0) return 100;

  const completedCount = requiredVariables.filter((v) => selections[v.id]).length;
  return Math.round((completedCount / requiredVariables.length) * 100);
};
