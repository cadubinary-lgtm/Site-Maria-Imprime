import { getDb } from "./db";
import { attributeValues } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

/**
 * Tipos de cálculo de preço
 */
export type PriceCalculationType = "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";

/**
 * Interface para cálculo de preço
 */
export interface PricingCalculation {
  basePrice: number;
  selectedAttributeIds: number[];
  quantity?: number;
  area?: number; // Para cálculos de m²
  calculationType?: PriceCalculationType;
}

/**
 * Interface para resultado do cálculo
 */
export interface PricingResult {
  basePrice: number;
  attributeModifiers: {
    attributeValueId: number;
    value: string;
    priceModifier: number;
    calculationType: string;
  }[];
  totalModifier: number;
  finalPrice: number;
  deadlineModifier: number; // Em horas
  weightModifier: number; // Em kg
}

/**
 * Obter valores de atributos com preços
 */
export async function getAttributeValuesWithPricing(attributeValueIds: number[]) {
  if (attributeValueIds.length === 0) return [];

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: attributeValues.id,
      value: attributeValues.value,
      priceModifier: attributeValues.priceModifier,
      timeModifier: attributeValues.timeModifier,
      weightModifier: attributeValues.weightModifier,
      icon: attributeValues.icon,
      image: attributeValues.image,
    })
    .from(attributeValues)
    .where(inArray(attributeValues.id, attributeValueIds));
}

/**
 * Calcular preço final com atributos selecionados
 * Suporta múltiplos tipos de cálculo
 */
export function calculateFinalPrice(
  basePrice: number,
  attributeModifiers: number[],
  calculationType: PriceCalculationType = "fixed"
): number {
  let finalPrice = basePrice;

  switch (calculationType) {
    case "fixed":
      // Soma simples dos modificadores
      const totalFixed = attributeModifiers.reduce((sum, mod) => sum + mod, 0);
      finalPrice = basePrice + totalFixed;
      break;

    case "percentage":
      // Percentual sobre o preço base
      const percentageModifier = attributeModifiers.reduce((sum, mod) => sum + mod, 0);
      finalPrice = basePrice * (1 + percentageModifier / 100);
      break;

    case "multiplier":
      // Multiplicador do preço base
      const multiplier = attributeModifiers.reduce((product, mod) => product * mod, 1);
      finalPrice = basePrice * multiplier;
      break;

    case "per_sqm":
      // Preço por metro quadrado
      // Esperado: attributeModifiers contém [area, pricePerSqm]
      if (attributeModifiers.length >= 2) {
        const area = attributeModifiers[0];
        const pricePerSqm = attributeModifiers[1];
        finalPrice = area * pricePerSqm;
      }
      break;

    case "per_quantity":
      // Preço por quantidade (desconto progressivo)
      // Esperado: attributeModifiers contém [quantity, pricePerUnit]
      if (attributeModifiers.length >= 2) {
        const quantity = attributeModifiers[0];
        const pricePerUnit = attributeModifiers[1];
        finalPrice = quantity * pricePerUnit;
      }
      break;

    default:
      finalPrice = basePrice + attributeModifiers.reduce((sum, mod) => sum + mod, 0);
  }

  // Garantir que o preço nunca seja negativo
  return Math.max(finalPrice, 0);
}

/**
 * Calcular prazo total com modificadores de atributos
 */
export function calculateDeadline(
  baseDeadlineHours: number,
  timeModifiers: number[]
): number {
  const totalModifier = timeModifiers.reduce((sum, mod) => sum + mod, 0);
  return Math.max(baseDeadlineHours + totalModifier, 0);
}

/**
 * Calcular peso total com modificadores de atributos
 */
export function calculateWeight(
  baseWeight: number,
  weightModifiers: number[]
): number {
  const totalModifier = weightModifiers.reduce((sum, mod) => sum + mod, 0);
  return Math.max(baseWeight + totalModifier, 0);
}

/**
 * Processar cálculo completo de preço com atributos
 */
export async function processPricingCalculation(
  input: PricingCalculation
): Promise<PricingResult> {
  const attributeValues = await getAttributeValuesWithPricing(input.selectedAttributeIds);

  const priceModifiers = attributeValues.map((av: any) => ({
    attributeValueId: av.id,
    value: av.value,
    priceModifier: parseFloat(av.priceModifier.toString()),
    calculationType: input.calculationType || "fixed",
  }));

  const totalModifier = priceModifiers.reduce((sum: number, mod: any) => sum + mod.priceModifier, 0);
  const finalPrice = calculateFinalPrice(
    input.basePrice,
    priceModifiers.map((m: any) => m.priceModifier),
    input.calculationType || "fixed"
  );

  const deadlineModifier = attributeValues.reduce((sum: number, av: any) => sum + av.timeModifier, 0);
  const weightModifier = parseFloat(
    attributeValues.reduce((sum: number, av: any) => sum + parseFloat(av.weightModifier.toString()), 0).toFixed(4)
  );

  return {
    basePrice: input.basePrice,
    attributeModifiers: priceModifiers,
    totalModifier,
    finalPrice,
    deadlineModifier,
    weightModifier,
  };
}

/**
 * Validar se combinação de atributos é válida
 */
export async function validateAttributeCombination(
  productId: number,
  selectedAttributeIds: number[]
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validar se todos os atributos selecionados pertencem ao produto
  // Esta é uma validação básica - pode ser expandida com regras mais complexas

  if (selectedAttributeIds.length === 0) {
    errors.push("Nenhum atributo foi selecionado");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calcular preço com desconto por volume
 */
export function applyVolumeDiscount(
  finalPrice: number,
  quantity: number
): { discountPercentage: number; discountAmount: number; finalPriceWithDiscount: number } {
  let discountPercentage = 0;

  // Tabela de descontos progressivos
  if (quantity >= 1000) discountPercentage = 15;
  else if (quantity >= 500) discountPercentage = 12;
  else if (quantity >= 250) discountPercentage = 10;
  else if (quantity >= 100) discountPercentage = 7;
  else if (quantity >= 50) discountPercentage = 5;
  else if (quantity >= 20) discountPercentage = 2;

  const discountAmount = finalPrice * (discountPercentage / 100);
  const finalPriceWithDiscount = finalPrice - discountAmount;

  return {
    discountPercentage,
    discountAmount,
    finalPriceWithDiscount,
  };
}

/**
 * Calcular impostos (ICMS + IPI)
 */
export function calculateTaxes(
  finalPrice: number,
  taxPercentage: number = 18
): { taxAmount: number; priceWithTax: number } {
  const taxAmount = finalPrice * (taxPercentage / 100);
  const priceWithTax = finalPrice + taxAmount;

  return {
    taxAmount,
    priceWithTax,
  };
}
