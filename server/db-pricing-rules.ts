import { getDb } from "./db";
import { pricingRules } from "../drizzle/schema";
import type { PricingRule, InsertPricingRule } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export type PricingRuleInput = {
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  calculationType?: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  isActive?: boolean;
  priority?: number;
};

/**
 * Criar nova regra de precificação
 */
export async function createPricingRule(input: PricingRuleInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pricingRules).values({
    name: input.name,
    category: input.category,
    description: input.description,
    basePrice: input.basePrice.toString(),
    calculationType: input.calculationType || "fixed",
    isActive: input.isActive !== false,
    priority: input.priority || 0,
  });

  return result;
}

/**
 * Listar todas as regras, opcionalmente filtradas por categoria
 */
export async function listPricingRules(category?: string, includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(pricingRules) as any;

  if (category) {
    query = query.where(eq(pricingRules.category, category));
  }

  if (!includeInactive) {
    query = query.where(eq(pricingRules.isActive, true));
  }

  return await query.orderBy(desc(pricingRules.priority), pricingRules.name);
}

/**
 * Obter regra por ID
 */
export async function getPricingRuleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
  return result[0] || null;
}

/**
 * Atualizar regra
 */
export async function updatePricingRule(id: number, input: Partial<PricingRuleInput>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.basePrice !== undefined) updateData.basePrice = input.basePrice.toString();
  if (input.calculationType !== undefined) updateData.calculationType = input.calculationType;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.priority !== undefined) updateData.priority = input.priority;

  const result = await db.update(pricingRules).set(updateData).where(eq(pricingRules.id, id));
  return result;
}

/**
 * Deletar regra
 */
export async function deletePricingRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(pricingRules).where(eq(pricingRules.id, id));
  return result;
}

/**
 * Listar categorias únicas
 */
export async function listPricingCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.selectDistinct({ category: pricingRules.category }).from(pricingRules);
  return result.map((r: any) => r.category).sort();
}

/**
 * Duplicar regra (criar cópia com nome modificado)
 */
export async function duplicatePricingRule(id: number, newName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const original = await getPricingRuleById(id);
  if (!original) throw new Error("Pricing rule not found");

  const result = await db.insert(pricingRules).values({
    name: newName,
    category: original.category,
    description: original.description,
    basePrice: original.basePrice,
    calculationType: original.calculationType,
    isActive: original.isActive,
    priority: original.priority,
  });

  return result;
}
