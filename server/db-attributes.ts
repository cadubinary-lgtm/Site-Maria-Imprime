import { getDb } from "./db";
import {
  attributes,
  attributeValues,
  productAttributes,
  productAttributeValues,
  attributeRules,
  attributeRuleConditions,
  attributeRuleActions,
  orderItemAttributes,
} from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * ========================================
 * ATRIBUTOS GLOBAIS
 * ========================================
 */

/**
 * Criar novo atributo global
 */
export async function createAttribute(data: {
  name: string;
  slug: string;
  description?: string;
  type: "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures";
  icon?: string;
  displayOrder?: number;
  basePrice?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attributes).values({
    name: data.name,
    slug: data.slug,
    description: data.description,
    type: data.type,
    icon: data.icon,
    displayOrder: data.displayOrder || 0,
    basePrice: String(data.basePrice || 0),
    isActive: true,
  } as any);

  return result;
}

/**
 * Listar todos os atributos
 */
export async function listAttributes(includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(attributes) as any;
  if (!includeInactive) {
    query = query.where(eq(attributes.isActive, true));
  }
  return await query.orderBy(attributes.displayOrder);
}

/**
 * Obter atributo por ID
 */
export async function getAttributeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(attributes).where(eq(attributes.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Atualizar atributo
 */
export async function updateAttribute(id: number, data: Partial<Omit<typeof attributes.$inferInsert, 'basePrice'> & { basePrice?: number | string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Construir objeto de update com apenas campos definidos
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.basePrice !== undefined) updateData.basePrice = String(data.basePrice);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  return await db.update(attributes).set(updateData).where(eq(attributes.id, id));
}

/**
 * Deletar atributo (soft delete)
 */
export async function deleteAttribute(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(attributes).set({ isActive: false }).where(eq(attributes.id, id));
}

/**
 * ========================================
 * VALORES DE ATRIBUTOS
 * ========================================
 */

/**
 * Criar valor de atributo
 */
export async function createAttributeValue(data: {
  attributeId: number;
  value: string;
  description?: string;
  priceModifier?: number;
  timeModifier?: number;
  weightModifier?: number;
  icon?: string;
  image?: string;
  displayOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(attributeValues).values({
    attributeId: data.attributeId,
    value: data.value,
    description: data.description,
    priceModifier: (data.priceModifier || 0) as any,
    timeModifier: data.timeModifier || 0,
    weightModifier: (data.weightModifier || 0) as any,
    icon: data.icon,
    image: data.image,
    displayOrder: data.displayOrder || 0,
    isActive: true,
  });
}

/**
 * Listar valores de um atributo
 */
export async function listAttributeValues(attributeId: number, includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(attributeValues).where(eq(attributeValues.attributeId, attributeId)) as any;
  if (!includeInactive) {
    query = query.where(eq(attributeValues.isActive, true));
  }
  return await query.orderBy(attributeValues.displayOrder);
}

/**
 * Atualizar valor de atributo
 */
export async function updateAttributeValue(id: number, data: Partial<typeof attributeValues.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(attributeValues).set(data).where(eq(attributeValues.id, id));
}

/**
 * Deletar valor de atributo (soft delete)
 */
export async function deleteAttributeValue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(attributeValues).set({ isActive: false }).where(eq(attributeValues.id, id));
}

/**
 * ========================================
 * VINCULAÇÃO PRODUTO-ATRIBUTO
 * ========================================
 */

/**
 * Vincular atributo a produto
 */
export async function linkAttributeToProduct(data: {
  productId: number;
  attributeId: number;
  isRequired?: boolean;
  allowMultiple?: boolean;
  displayOrder?: number;
  priceModifier?: number;
  calculationType?: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  timeModifier?: number;
  weightModifier?: number;
  isActive?: boolean;
  priority?: number;
  rules?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(productAttributes).values({
    productId: data.productId,
    attributeId: data.attributeId,
    isRequired: data.isRequired ?? true,
    allowMultiple: data.allowMultiple ?? false,
    displayOrder: data.displayOrder ?? 0,
    priceModifier: data.priceModifier ?? 0,
    calculationType: data.calculationType ?? "fixed",
    timeModifier: data.timeModifier ?? 0,
    weightModifier: data.weightModifier ?? 0,
    isActive: data.isActive ?? true,
    priority: data.priority ?? 0,
    rules: data.rules ?? null,
  } as any);
}

/**
 * Listar atributos de um produto
 */
export async function getProductAttributes(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const productAttrs = await db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, productId))
    .orderBy(productAttributes.displayOrder);

  // Carregar valores habilitados para cada atributo
  const result = await Promise.all(
    productAttrs.map(async (pa) => {
      const attr = await getAttributeById(pa.attributeId);
      const enabledValues = await db
        .select({ id: attributeValues.id, value: attributeValues.value, priceModifier: attributeValues.priceModifier, timeModifier: attributeValues.timeModifier, weightModifier: attributeValues.weightModifier, icon: attributeValues.icon, image: attributeValues.image })
        .from(productAttributeValues)
        .innerJoin(attributeValues, eq(productAttributeValues.attributeValueId, attributeValues.id))
        .where(
          and(
            eq(productAttributeValues.productAttributeId, pa.id),
            eq(productAttributeValues.isEnabled, true),
            eq(attributeValues.isActive, true)
          )
        )
        .orderBy(attributeValues.displayOrder);

      return {
        ...pa,
        attribute: attr,
        values: enabledValues,
      };
    })
  );

  return result;
}

/**
 * Habilitar/desabilitar valor específico para produto
 */
export async function setProductAttributeValue(data: {
  productAttributeId: number;
  attributeValueId: number;
  isEnabled: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(productAttributeValues)
    .where(
      and(
        eq(productAttributeValues.productAttributeId, data.productAttributeId),
        eq(productAttributeValues.attributeValueId, data.attributeValueId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(productAttributeValues)
      .set({ isEnabled: data.isEnabled })
      .where(eq(productAttributeValues.id, existing[0].id));
  } else {
    return await db.insert(productAttributeValues).values({
      productAttributeId: data.productAttributeId,
      attributeValueId: data.attributeValueId,
      isEnabled: data.isEnabled,
    });
  }
}

/**
 * ========================================
 * REGRAS DINÂMICAS
 * ========================================
 */

/**
 * Criar regra dinâmica
 */
export async function createAttributeRule(data: {
  productId: number;
  name: string;
  description?: string;
  conditions: Array<{
    attributeId: number;
    operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in";
    value: string;
  }>;
  actions: Array<{
    targetAttributeId: number;
    action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice";
    value?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Criar regra
  const ruleResult = await db.insert(attributeRules).values({
    productId: data.productId,
    name: data.name,
    description: data.description,
    isActive: true,
  });

  const ruleId = (ruleResult as any).insertId || 1;

  // Criar condições
  for (const condition of data.conditions) {
    await db.insert(attributeRuleConditions).values({
      ruleId,
      attributeId: condition.attributeId,
      operator: condition.operator,
      value: condition.value,
    });
  }

  // Criar ações
  for (const action of data.actions) {
    await db.insert(attributeRuleActions).values({
      ruleId,
      targetAttributeId: action.targetAttributeId,
      action: action.action,
      value: action.value,
    });
  }

  return ruleId;
}

/**
 * Listar regras de um produto
 */
export async function getProductRules(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rules = await db
    .select()
    .from(attributeRules)
    .where(and(eq(attributeRules.productId, productId), eq(attributeRules.isActive, true)));

  const result = await Promise.all(
    rules.map(async (rule) => {
      const conditions = await db.select().from(attributeRuleConditions).where(eq(attributeRuleConditions.ruleId, rule.id));
      const actions = await db.select().from(attributeRuleActions).where(eq(attributeRuleActions.ruleId, rule.id));

      return {
        ...rule,
        conditions,
        actions,
      };
    })
  );

  return result;
}

/**
 * ========================================
 * ATRIBUTOS DO PEDIDO
 * ========================================
 */

/**
 * Registrar atributo selecionado no pedido
 */
export async function addOrderItemAttribute(data: {
  orderItemId: number;
  attributeValueId: number;
  customValue?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(orderItemAttributes).values({
    orderItemId: data.orderItemId,
    attributeValueId: data.attributeValueId,
    customValue: data.customValue,
  });
}

/**
 * Obter atributos selecionados de um item do pedido
 */
export async function getOrderItemAttributes(orderItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(orderItemAttributes)
    .innerJoin(attributeValues, eq(orderItemAttributes.attributeValueId, attributeValues.id))
    .where(eq(orderItemAttributes.orderItemId, orderItemId));
}

/**
 * ========================================
 * PRECIFICAÇÃO CENTRALIZADA NO VÍNCULO
 * ========================================
 * NOVO: Funções para gerenciar precificação no vínculo produto↔atributo
 */

/**
 * Atualizar preço e configurações de um atributo vinculado
 * NOVO: Centraliza precificação no vínculo, não no atributo global
 */
export async function updateProductAttribute(data: {
  productAttributeId: number;
  priceModifier?: number;
  calculationType?: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  timeModifier?: number;
  weightModifier?: number;
  isActive?: boolean;
  priority?: number;
  rules?: string; // JSON string
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar que o vínculo existe
  const existing = await db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.id, data.productAttributeId));

  if (!existing || existing.length === 0) {
    throw new Error(`Product attribute with id ${data.productAttributeId} not found`);
  }

  // Preparar dados para atualização (apenas campos fornecidos)
  const updateData: any = {};

  if (data.priceModifier !== undefined) {
    updateData.priceModifier = data.priceModifier;
  }

  if (data.calculationType !== undefined) {
    updateData.calculationType = data.calculationType;
  }

  if (data.timeModifier !== undefined) {
    updateData.timeModifier = data.timeModifier;
  }

  if (data.weightModifier !== undefined) {
    updateData.weightModifier = data.weightModifier;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  if (data.rules !== undefined) {
    updateData.rules = data.rules;
  }

  // Se nenhum campo foi fornecido, retornar erro
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  // Executar atualização
  return await db
    .update(productAttributes)
    .set(updateData)
    .where(eq(productAttributes.id, data.productAttributeId));
}

/**
 * Desvinc ular atributo de produto
 * NOVO: Remove o vínculo e todos os dados associados
 */
export async function unlinkAttributeFromProduct(productAttributeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar que o vínculo existe
  const existing = await db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.id, productAttributeId));

  if (!existing || existing.length === 0) {
    throw new Error(`Product attribute with id ${productAttributeId} not found`);
  }

  // Deletar valores do atributo para este produto (via cascade)
  await db
    .delete(productAttributeValues)
    .where(eq(productAttributeValues.productAttributeId, productAttributeId));

  // Deletar o vínculo
  return await db
    .delete(productAttributes)
    .where(eq(productAttributes.id, productAttributeId));
}

