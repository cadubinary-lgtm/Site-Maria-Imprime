/**
 * ========================================
 * CALCULADORA DE PREÇO EM TEMPO REAL
 * ========================================
 * Calcula preço final baseado em atributos selecionados
 * Suporta modificadores de quantidade, tamanho e combinações
 */

export interface PriceCalculationInput {
  basePrice: number;
  selectedAttributes: Map<number, { value: any; priceModifier: number }>;
  quantity: number;
  area?: number; // Para cálculo por m²
  hasVolumeDiscount?: boolean;
}

export interface PriceCalculationResult {
  basePrice: number;
  attributeModifiers: number;
  quantityDiscount: number;
  areaModifier: number;
  subtotal: number;
  tax: number;
  total: number;
  pricePerUnit: number;
  breakdown: PriceBreakdown[];
}

export interface PriceBreakdown {
  label: string;
  value: number;
  percentage?: number;
}

/**
 * Calcular preço final com todos os modificadores
 */
export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  let total = input.basePrice;

  // Aplicar modificadores de atributos
  let attributeModifiers = 0;
  input.selectedAttributes.forEach((attr) => {
    attributeModifiers += attr.priceModifier;
  });

  // Aplicar modificador de área (para materiais como lona, adesivo)
  let areaModifier = 0;
  if (input.area && input.area > 0) {
    areaModifier = input.area * 0.5; // R$ 0.50 por m²
  }

  // Subtotal por unidade
  const subtotalPerUnit = input.basePrice + attributeModifiers + areaModifier;

  // Aplicar quantidade
  let subtotal = subtotalPerUnit * input.quantity;

  // Aplicar desconto por volume
  let quantityDiscount = 0;
  if (input.hasVolumeDiscount && input.quantity >= 1000) {
    quantityDiscount = subtotal * 0.1; // 10% desconto acima de 1000 unidades
  } else if (input.hasVolumeDiscount && input.quantity >= 500) {
    quantityDiscount = subtotal * 0.05; // 5% desconto acima de 500 unidades
  }

  subtotal -= quantityDiscount;

  // Calcular impostos (18% ICMS)
  const tax = subtotal * 0.18;

  // Total final
  const finalTotal = subtotal + tax;

  return {
    basePrice: input.basePrice,
    attributeModifiers,
    quantityDiscount,
    areaModifier,
    subtotal,
    tax,
    total: finalTotal,
    pricePerUnit: finalTotal / input.quantity,
    breakdown: [
      { label: "Preço Base", value: input.basePrice },
      { label: "Modificadores de Atributos", value: attributeModifiers },
      { label: "Modificador de Área", value: areaModifier },
      { label: "Subtotal (por unidade)", value: subtotalPerUnit },
      { label: "Quantidade", value: input.quantity, percentage: 0 },
      { label: "Subtotal", value: subtotal + quantityDiscount },
      { label: "Desconto por Volume", value: -quantityDiscount },
      { label: "Subtotal com Desconto", value: subtotal },
      { label: "ICMS (18%)", value: tax },
      { label: "Total", value: finalTotal },
    ],
  };
}

/**
 * Formatar valor em moeda brasileira
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Calcular prazo de entrega baseado em atributos
 */
export interface DeadlineCalculationInput {
  baseDeadline: number; // em dias
  selectedAttributes: Map<number, { value: any; timeModifier: number }>;
  quantity: number;
  hasRushService?: boolean;
}

export interface DeadlineCalculationResult {
  baseDeadline: number;
  attributeModifiers: number;
  quantityModifier: number;
  rushModifier: number;
  totalDeadline: number;
  deliveryDate: Date;
  businessDays: number;
}

/**
 * Calcular prazo de entrega
 */
export function calculateDeadline(
  input: DeadlineCalculationInput
): DeadlineCalculationResult {
  let totalDays = input.baseDeadline;

  // Aplicar modificadores de atributos
  let attributeModifiers = 0;
  input.selectedAttributes.forEach((attr) => {
    attributeModifiers += attr.timeModifier;
  });

  // Modificador por quantidade
  let quantityModifier = 0;
  if (input.quantity > 5000) {
    quantityModifier = 2; // +2 dias para grandes volumes
  } else if (input.quantity > 2000) {
    quantityModifier = 1; // +1 dia para volumes médios
  }

  // Modificador de serviço expresso
  let rushModifier = 0;
  if (input.hasRushService) {
    rushModifier = -2; // -2 dias com serviço expresso
  }

  totalDays += attributeModifiers + quantityModifier + rushModifier;

  // Garantir mínimo de 1 dia
  totalDays = Math.max(1, totalDays);

  // Calcular data de entrega (pulando fins de semana)
  const deliveryDate = addBusinessDays(new Date(), totalDays);

  return {
    baseDeadline: input.baseDeadline,
    attributeModifiers,
    quantityModifier,
    rushModifier,
    totalDeadline: totalDays,
    deliveryDate,
    businessDays: totalDays,
  };
}

/**
 * Adicionar dias úteis a uma data
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let count = 0;

  while (count < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    // Pular sábado (6) e domingo (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return result;
}

/**
 * Formatar data de entrega
 */
export function formatDeliveryDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Calcular desconto por volume
 */
export function getVolumeDiscount(quantity: number): number {
  if (quantity >= 5000) return 15;
  if (quantity >= 2000) return 10;
  if (quantity >= 1000) return 5;
  if (quantity >= 500) return 2;
  return 0;
}

/**
 * Validar combinação de atributos
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAttributeCombination(
  selectedAttributes: Map<number, any>,
  rules?: any[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar campos obrigatórios
  if (selectedAttributes.size === 0) {
    errors.push("Selecione pelo menos um atributo");
  }

  // Validar combinações inválidas baseado em regras
  if (rules) {
    for (const rule of rules) {
      if (rule.action === "hide" || rule.action === "disable") {
        const selectedValue = selectedAttributes.get(rule.targetAttributeId);
        if (selectedValue !== undefined) {
          errors.push(`Combinação inválida: ${rule.name}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gerar resumo técnico do produto
 */
export interface TechnicalSummary {
  material?: string;
  acabamento?: string;
  revestimento?: string;
  medidas?: string;
  quantidade: number;
  prazo: number;
  preco: number;
  observacoes?: string;
}

export function generateTechnicalSummary(
  selectedAttributes: Map<number, any>,
  quantity: number,
  deadline: number,
  price: number
): TechnicalSummary {
  return {
    quantidade: quantity,
    prazo: deadline,
    preco: price,
  };
}
