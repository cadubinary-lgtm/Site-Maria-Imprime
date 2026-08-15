import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { InsertUser, users, products, orders, orderItems, orderStatusHistory, segments, categories, productCategories, variationTypes, variationOptions, orderItemVariations, fileChecks, customerAccounts } from "../drizzle/schema";
import { productSegments } from "../drizzle/schema";
import type { InsertVariationType, InsertVariationOption, InsertOrderItemVariation, InsertFileCheck } from "../drizzle/schema";
import type { InsertOrder } from "../drizzle/schema";
import { ENV } from './_core/env';
import { isNull, desc, eq, sql, asc, and, getTableColumns } from 'drizzle-orm';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Products queries
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(products).limit(1000);
  return result;
}

export async function getProductsBySegment(segment: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(products)
    .where(eq(products.segment, segment as any))
    .limit(100);
  return result;
}

export async function getProductIdsBySegmentId(segmentId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ productId: productSegments.productId })
    .from(productSegments)
    .where(eq(productSegments.segmentId, segmentId));
  return rows.map(r => r.productId);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result[0];
}

export async function getProductByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.execute(
    sql`SELECT * FROM products WHERE name = ${name} LIMIT 1`
  ) as any;
  return result[0]?.[0];
}

// Segments queries
export async function getAllSegments() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(segments).orderBy(asc(segments.position)).limit(100);
  return result;
}

export async function getSegmentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(segments)
    .where(eq(segments.slug, slug))
    .limit(1);
  return result[0];
}

export async function createSegment(name: string, icon: string, slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(segments).values({
    name,
    icon,
    slug,
  });
  
  // Retornar o segmento criado
  const created = await db.select().from(segments)
    .where(eq(segments.slug, slug))
    .limit(1);
  
  return created[0] || { name, icon, slug };
}

export async function updateSegment(id: number, name: string, icon: string, slug?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { name, icon };
  if (slug) updateData.slug = slug;

  await db.update(segments)
    .set(updateData as any)
    .where(eq(segments.id, id));
  
  // Retornar o segmento atualizado
  const updated = await db.select().from(segments)
    .where(eq(segments.id, id))
    .limit(1);
  
  return updated[0] || { id, name, icon, slug };
}

export async function deleteSegment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar segmento antes de deletar
  const toDelete = await db.select().from(segments)
    .where(eq(segments.id, id))
    .limit(1);
  
  await db.delete(segments)
    .where(eq(segments.id, id));
  
  return toDelete[0] || { id };
}

export async function reorderSegment(id: number, direction: 'up' | 'down') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os segmentos ordenados por position
  const allSegments = await db.select().from(segments).orderBy(asc(segments.position)).limit(100);
  
  const currentIndex = allSegments.findIndex(s => s.id === id);
  if (currentIndex === -1) throw new Error("Segmento não encontrado");
  
  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (swapIndex < 0 || swapIndex >= allSegments.length) {
    return { success: false, message: 'Já está na posição limite' };
  }
  
  const current = allSegments[currentIndex];
  const swap = allSegments[swapIndex];
  
  // Trocar as posições
  await db.update(segments).set({ position: swap.position }).where(eq(segments.id, current.id));
  await db.update(segments).set({ position: current.position }).where(eq(segments.id, swap.id));
  
  return { success: true };
}

// Categories queries
export async function getCategoriesBySegment(segmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(categories)
    .where(eq(categories.segmentId, segmentId))
    .limit(100);
  return result;
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    .where(eq(productCategories.categoryId, categoryId))
    .limit(100);

  return result.map(row => row.products);
}

// Orders queries
export async function getOrdersByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(orders)
    .where(eq(orders.clientId, clientId))
    .limit(100);
  return result;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return result[0];
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      ...getTableColumns(orders),
      customerPriceTier: customerAccounts.priceTier,
    })
    .from(orders)
    .leftJoin(customerAccounts, eq(orders.customerId, customerAccounts.id))
    .limit(1000);
  return result;
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  return result;
}

export async function updateOrderStatus(orderId: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Buscar status atual + dados do pedido para notificação
  const currentOrderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const currentOrder = currentOrderRows[0] ?? null;
  const previousStatus = currentOrder?.status ?? null;
  // Atualizar status do pedido
  await db.update(orders)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  // Registrar no histórico
  await db.insert(orderStatusHistory).values({
    orderId,
    previousStatus: previousStatus as any,
    newStatus: status as any,
    notes: notes ?? `Status alterado para ${status}`,
  });
  // Enviar notificação por e-mail ao cliente (não bloqueia o fluxo)
  if (currentOrder) {
    try {
      const { sendOrderStatusUpdateEmail } = await import("./emailService");
      const statusLabels: Record<string, string> = {
        pagamento_aprovado: "Pagamento Aprovado ✅",
        pagamento_retirada: "Aguardando Pagamento na Retirada 🏪",
        analisando: "Analisando 🔍",
        com_problemas: "Pedido com Problemas ⚠️",
        em_producao: "Em Produção 🚧",
        pronto_entrega: "Pronto para Entrega 📦",
        pronto_retirada: "Pronto para Retirada 🏪",
        saiu_entrega: "Saiu para Entrega 🚚",
        em_transporte: "Em Transporte 🚚",
        entregue: "Entregue com Sucesso 🎉",
        cancelado: "Pedido Cancelado ❌",
      };
      const statusLabel = statusLabels[status] ?? status;
      // Buscar e-mail do cliente
      let emailTo: string | null = (currentOrder as any).guestEmail ?? null;
      let firstName = ((currentOrder as any).guestName ?? "Cliente").split(" ")[0];
      if (!emailTo && (currentOrder as any).customerId) {
        const [ca] = await db.select({ email: customerAccounts.email, firstName: customerAccounts.firstName })
          .from(customerAccounts)
          .where(eq(customerAccounts.id, (currentOrder as any).customerId))
          .limit(1);
        if (ca?.email) {
          emailTo = ca.email;
          firstName = ca.firstName || firstName;
        }
      }
      if (emailTo) {
        const orderNumber = (currentOrder as any).orderNumber ?? String(orderId);
        const guestToken = (currentOrder as any).guestToken;
        const SITE_URL = process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space";
        const trackUrl = guestToken
          ? `${SITE_URL}/pedido/acompanhar/${guestToken}`
          : `${SITE_URL}/pedido/${orderId}`;
        await sendOrderStatusUpdateEmail(emailTo, firstName, orderNumber, statusLabel, trackUrl);
        console.log(`[STATUS] E-mail de status enviado para ${emailTo}: ${statusLabel}`);
      }
    } catch (e) {
      console.error("[STATUS] Erro ao enviar e-mail de status:", e);
    }
  }
  return { success: true, orderId, newStatus: status };
}

// Variation Types queries
export async function getVariationTypesByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(variationTypes)
    .where(eq(variationTypes.productId, productId))
    .orderBy(variationTypes.order);
  return result;
}

// Variações globais filtradas por scope (null = comunicação visual, "offset" = offset)
export async function getGlobalVariationTypesByScope(scope: string | null) {
  const db = await getDb();
  if (!db) return [];
  const whereClause = scope === null
    ? and(isNull(variationTypes.productId), isNull(variationTypes.scope))
    : and(isNull(variationTypes.productId), eq(variationTypes.scope as any, scope));
  const result = await db.select().from(variationTypes)
    .where(whereClause)
    .orderBy(variationTypes.order);
  return result;
}

export async function createVariationTypeWithScope(data: any, scope: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(variationTypes).values({ ...data, scope } as any);
  return result;
}

export async function getGlobalVariationTypes() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(variationTypes)
    .where(isNull(variationTypes.productId))
    .orderBy(variationTypes.order);
  return result;
}

export async function linkGlobalVariationToProduct(globalVariationId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the global variation
  const globalVariation = await db.select().from(variationTypes)
    .where(eq(variationTypes.id, globalVariationId))
    .limit(1);
  
  if (globalVariation.length === 0) {
    throw new Error("Global variation not found");
  }
  
  const gv = globalVariation[0];
  
  // Create a new variation for this product based on the global one
  // Save globalVariationId to track the link for future sync
  const insertResult = await db.insert(variationTypes).values({
    productId,
    globalVariationId,
    type: gv.type,
    name: gv.name,
    slug: gv.slug,
    description: gv.description,
    selectionType: gv.selectionType,
    visualType: gv.visualType,
    order: gv.order,
    isRequired: gv.isRequired,
    isActive: gv.isActive,
  });
  
  // Get the new variation ID from the insert result
  // With Drizzle + MySQL, we need to query the newly inserted row
  let newVariationId: number;
  
  // Try to get insertId from the result
  if ((insertResult as any).insertId) {
    newVariationId = (insertResult as any).insertId;
  } else {
    // Fallback: query the newly inserted row by product and get the latest
    const newVariation = await db.select().from(variationTypes)
      .where(eq(variationTypes.productId, productId))
      .orderBy(desc(variationTypes.id))
      .limit(1);
    if (newVariation.length === 0) {
      throw new Error("Failed to retrieve newly inserted variation");
    }
    newVariationId = newVariation[0].id;
  }
  
  // Copy all options from the global variation (ordenadas por order)
  const options = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, globalVariationId))
    .orderBy(asc(variationOptions.order), asc(variationOptions.id));
  
  for (const option of options) {
    await db.insert(variationOptions).values({
      variationTypeId: newVariationId,
      name: option.name,
      description: option.description,
      priceModifier: option.priceModifier,
      calculationType: option.calculationType ?? "unit",
      order: option.order ?? 0,
    });
  }
  
  return { success: true, variationId: newVariationId };
}

export async function createVariationType(data: InsertVariationType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(variationTypes).values(data);
  return result;
}

// Delivery Options queries will be added after schema is properly loaded

export async function getVariationOptionsByType(typeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, typeId))
    .orderBy(asc(variationOptions.order), asc(variationOptions.id));
  return result;
}

export async function reorderVariationOptions(updates: { id: number; order: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await Promise.all(
    updates.map(({ id, order }) =>
      db.update(variationOptions).set({ order }).where(eq(variationOptions.id, id))
    )
  );
}

export async function createVariationOption(data: InsertVariationOption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(variationOptions).values(data);
  return result;
}

// Order Item Variations queries
export async function getOrderItemVariations(orderItemId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(orderItemVariations)
    .innerJoin(variationOptions, eq(orderItemVariations.variationOptionId, variationOptions.id))
    .where(eq(orderItemVariations.orderItemId, orderItemId));
  
  return result.map(row => ({
    variation: row.orderItemVariations,
    option: row.variationOptions,
  }));
}

export async function updateVariationOption(id: number, data: Partial<InsertVariationOption>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(variationOptions)
    .set(data)
    .where(eq(variationOptions.id, id));
  return result;
}

export async function deleteVariationOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete order item variations first (cascade)
  await db.delete(orderItemVariations)
    .where(eq(orderItemVariations.variationOptionId, id));
  
  // Then delete the option
  const result = await db.delete(variationOptions)
    .where(eq(variationOptions.id, id));
  return result;
}

export async function deleteVariationType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all options for this type
  const options = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, id));
  
  // Delete order item variations for all options
  for (const option of options) {
    await db.delete(orderItemVariations)
      .where(eq(orderItemVariations.variationOptionId, option.id));
  }
  
  // Delete all options
  await db.delete(variationOptions)
    .where(eq(variationOptions.variationTypeId, id));
  
  // Delete the type
  const result = await db.delete(variationTypes)
    .where(eq(variationTypes.id, id));
  return result;
}

/**
 * Sincroniza o nome de uma variação global para todas as cópias vinculadas.
 * Chamada após editar o nome de uma variação global.
 */
export async function syncGlobalVariationName(globalVariationId: number, newName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Atualizar o nome em todas as cópias vinculadas
  await db.update(variationTypes)
    .set({ name: newName, updatedAt: new Date() })
    .where(eq(variationTypes.globalVariationId, globalVariationId));

  return { success: true };
}

/**
 * Sincroniza as opções de uma variação global para todas as cópias vinculadas (globalVariationId).
 * Chamada após criar, editar ou excluir uma opção na variação global.
 */
export async function syncGlobalVariationOptions(globalVariationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todas as cópias de produto vinculadas a esta variação global
  const linkedCopies = await db.select({ id: variationTypes.id })
    .from(variationTypes)
    .where(eq(variationTypes.globalVariationId, globalVariationId));

  if (linkedCopies.length === 0) return { synced: 0 };

  // Buscar as opções atuais da variação global (ordenadas por order)
  const globalOptions = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, globalVariationId))
    .orderBy(asc(variationOptions.order), asc(variationOptions.id));

  for (const copy of linkedCopies) {
    // Remover todas as opções atuais da cópia
    const existingOptions = await db.select({ id: variationOptions.id })
      .from(variationOptions)
      .where(eq(variationOptions.variationTypeId, copy.id));

    for (const opt of existingOptions) {
      await db.delete(orderItemVariations)
        .where(eq(orderItemVariations.variationOptionId, opt.id));
    }
    await db.delete(variationOptions)
      .where(eq(variationOptions.variationTypeId, copy.id));

    // Recriar as opções a partir da variação global (mantendo calculationType e order)
    for (const option of globalOptions) {
      await db.insert(variationOptions).values({
        variationTypeId: copy.id,
        name: option.name,
        description: option.description,
        priceModifier: option.priceModifier,
        calculationType: option.calculationType ?? "unit",
        order: option.order ?? 0,
      });
    }
  }

  return { synced: linkedCopies.length };
}

export async function updateVariationType(id: number, data: Partial<InsertVariationType>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(variationTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(variationTypes.id, id));
  return result;
}

export async function getProductsUsingVariationType(variationTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({ productId: variationTypes.productId })
    .from(variationTypes)
    .where(eq(variationTypes.id, variationTypeId));
  
  return result;
}

// Order Item Variations queries
export async function addOrderItemVariation(data: InsertOrderItemVariation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orderItemVariations).values(data);
  return result;
}

// File Checks queries
export async function createFileCheck(data: InsertFileCheck) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fileChecks).values(data);
  return result;
}

export async function getFileCheckByOrderItem(orderItemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(fileChecks)
    .where(eq(fileChecks.orderItemId, orderItemId))
    .limit(1);
  
  return result[0];
}

export async function updateFileCheckStatus(fileCheckId: number, status: string, issues?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(fileChecks)
    .set({ 
      status: status as any, 
      issues: issues || null,
      checkedAt: new Date(),
    })
    .where(eq(fileChecks.id, fileCheckId));
  
  return result;
}

// Search queries
export async function searchGlobal(query: string) {
  const db = await getDb();
  if (!db) return { products: [], categories: [], materials: [] };

  try {
    if (query.length === 0) {
      return { products: [], categories: [], materials: [] };
    }

    // Buscar TODOS os produtos, categorias e variações (sem limite)
    const allProducts = await db.select().from(products);
    const allCategories = await db.select().from(categories);
    // Usar apenas variationOptions do sistema global (sem filtro de productId)
    const allVariationOptions = await db.select().from(variationOptions);

    // Filtrar resultados em memória
    const filteredProducts = allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);

    const filteredCategories = allCategories.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    const filteredMaterials = allVariationOptions.filter(m =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);

    return {
      products: filteredProducts,
      categories: filteredCategories,
      materials: filteredMaterials,
    };
  } catch (error) {
    console.error("Search error:", error);
    return { products: [], categories: [], materials: [] };
  }
}


// Reorder variation types
export async function reorderVariationTypes(updates: Array<{ id: number; order: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    for (const update of updates) {
      await db.update(variationTypes)
        .set({ order: update.order, updatedAt: new Date() })
        .where(eq(variationTypes.id, update.id));
    }
    return true;
  } catch (error) {
    console.error("Error reordering variation types:", error);
    throw error;
  }
}

// Delivery Options queries - usando raw SQL para evitar problemas de tipo
export async function getDeliveryOptionsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.execute(
      sql`SELECT * FROM productDeliveryOptions WHERE productId = ${productId} ORDER BY \`order\` ASC`
    ) as any;
    const options = result[0] || [];
    // Converter tipos de dados para garantir que sejam números
    return options.map((opt: any) => ({
      ...opt,
      daysToDeliver: parseInt(opt.daysToDeliver) || 0,
      pricePerM2: parseFloat(opt.pricePerM2) || 0,
      isActive: opt.isActive === 1 || opt.isActive === true,
      order: parseInt(opt.order) || 0,
    }));
  } catch (error) {
    console.error("Error fetching delivery options:", error);
    return [];
  }
}

export async function copyDeliveryOptionsFromProduct(sourceProductId: number, targetProductId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Buscar prazos do produto de origem
    const sourceOptions = await getDeliveryOptionsByProduct(sourceProductId);
    
    // Copiar cada prazo para o novo produto
    for (const option of sourceOptions) {
      await createDeliveryOption({
        productId: targetProductId,
        name: option.name,
        daysToDeliver: option.daysToDeliver,
        pricePerM2: option.pricePerM2,
        isActive: option.isActive,
        order: option.order,
      });
    }
    
    return { success: true, copied: sourceOptions.length };
  } catch (error) {
    console.error("Error copying delivery options:", error);
    throw error;
  }
}

export async function createDeliveryOption(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.execute(
      sql`INSERT INTO productDeliveryOptions (productId, name, daysToDeliver, pricePerM2, isActive, \`order\`) VALUES (${data.productId}, ${data.name}, ${data.daysToDeliver}, ${data.pricePerM2}, ${data.isActive ?? true}, ${data.order ?? 0})`
    ) as any;
    return result;
  } catch (error) {
    console.error("Error creating delivery option:", error);
    throw error;
  }
}

export async function updateDeliveryOption(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Build update query dynamically based on provided fields
    if (data.name !== undefined) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET name = ${data.name}, updatedAt = NOW() WHERE id = ${id}`
      );
    }
    if (data.daysToDeliver !== undefined) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET daysToDeliver = ${data.daysToDeliver}, updatedAt = NOW() WHERE id = ${id}`
      );
    }
    if (data.pricePerM2 !== undefined) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET pricePerM2 = ${data.pricePerM2}, updatedAt = NOW() WHERE id = ${id}`
      );
    }
    if (data.isActive !== undefined) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET isActive = ${data.isActive}, updatedAt = NOW() WHERE id = ${id}`
      );
    }
    if (data.order !== undefined) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET \`order\` = ${data.order}, updatedAt = NOW() WHERE id = ${id}`
      );
    }
  } catch (error) {
    console.error("Error updating delivery option:", error);
    throw error;
  }
}

export async function deleteDeliveryOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.execute(
      sql`DELETE FROM productDeliveryOptions WHERE id = ${id}`
    );
  } catch (error) {
    console.error("Error deleting delivery option:", error);
    throw error;
  }
}

export async function reorderDeliveryOptions(updates: Array<{ id: number; order: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    for (const update of updates) {
      await db.execute(
        sql`UPDATE productDeliveryOptions SET \`order\` = ${update.order}, updatedAt = NOW() WHERE id = ${update.id}`
      );
    }
    return true;
  } catch (error) {
    console.error("Error reordering delivery options:", error);
    throw error;
  }
}

// ============================================================
// CART HELPERS
// ============================================================

export async function getCartByUser(userId: number | null, sessionId?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let rows: any;
  if (userId) {
    rows = await db.execute(
      sql`
        SELECT 
          ci.id, ci.userId, ci.sessionId, ci.productId, ci.quantity,
          ci.selectedAttributes, ci.customDimensions, ci.priceAtCart,
          ci.artFileUrl, ci.artFileUrls, ci.notes, ci.createdAt, ci.updatedAt,
          ci.shippingMethod, ci.shippingPrice, ci.shippingLabel,
          ci.variationSnapshot, ci.prazoName, ci.prazoHours, ci.urgencyRate, ci.urgencyMultiplier, ci.urgencyUnit, ci.urgencySurcharge,
          ci.forecastDate, ci.forecastLabel, ci.cepDestino,
          p.name as productName, p.imageUrl as productImage,
          p.calculationType, p.unit
        FROM cartItems ci
        JOIN products p ON ci.productId = p.id
        WHERE ci.userId = ${userId}
        ORDER BY ci.createdAt DESC
      `
    ) as any;
  } else if (sessionId) {
    rows = await db.execute(
      sql`
        SELECT 
          ci.id, ci.userId, ci.sessionId, ci.productId, ci.quantity,
          ci.selectedAttributes, ci.customDimensions, ci.priceAtCart,
          ci.artFileUrl, ci.artFileUrls, ci.notes, ci.createdAt, ci.updatedAt,
          ci.shippingMethod, ci.shippingPrice, ci.shippingLabel,
          ci.variationSnapshot, ci.prazoName, ci.prazoHours, ci.urgencyRate, ci.urgencyMultiplier, ci.urgencyUnit, ci.urgencySurcharge,
          ci.forecastDate, ci.forecastLabel, ci.cepDestino,
          p.name as productName, p.imageUrl as productImage,
          p.calculationType, p.unit
        FROM cartItems ci
        JOIN products p ON ci.productId = p.id
        WHERE ci.sessionId = ${sessionId}
        ORDER BY ci.createdAt DESC
      `
    ) as any;
  } else {
    return [];
  }
  return (rows[0] ?? []) as any[];
}

export async function addToCart(data: {
  userId?: number | null;
  sessionId?: string | null;
  productId: number;
  quantity: number;
  selectedAttributes?: string;
  customDimensions?: string;
  priceAtCart: number;
  artFileUrl?: string;
  artFileUrls?: string;
  notes?: string;
  shippingMethod?: string;
  shippingPrice?: number;
  shippingLabel?: string;
  variationSnapshot?: string;
  prazoName?: string;
  prazoHours?: number;
  urgencyRate?: number;
  urgencyMultiplier?: number;
  urgencyUnit?: string;
  urgencySurcharge?: number;
  forecastDate?: string;
  forecastLabel?: string;
  cepDestino?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(
    sql`
      INSERT INTO cartItems (
        userId, sessionId, productId, quantity, selectedAttributes, customDimensions,
        priceAtCart, artFileUrl, artFileUrls, notes, shippingMethod, shippingPrice, shippingLabel,
        variationSnapshot, prazoName, prazoHours, urgencyRate, urgencyMultiplier, urgencyUnit, urgencySurcharge, forecastDate, forecastLabel, cepDestino
      )
      VALUES (
        ${data.userId ?? null}, ${data.sessionId ?? null}, ${data.productId}, ${data.quantity},
        ${data.selectedAttributes ?? null}, ${data.customDimensions ?? null},
        ${data.priceAtCart}, ${data.artFileUrl ?? null}, ${data.artFileUrls ?? null}, ${data.notes ?? null},
        ${data.shippingMethod ?? "retirada"}, ${data.shippingPrice ?? 0}, ${data.shippingLabel ?? null},
        ${data.variationSnapshot ?? null}, ${data.prazoName ?? null}, ${data.prazoHours ?? 0},
        ${data.urgencyRate ?? null}, ${data.urgencyMultiplier ?? null}, ${data.urgencyUnit ?? null}, ${data.urgencySurcharge ?? null},
        ${data.forecastDate ?? null}, ${data.forecastLabel ?? null}, ${data.cepDestino ?? null}
      )
    `
  );
  return (result as any).insertId as number;
}

export async function updateCartItemQuantity(
  id: number,
  userId: number | null,
  quantity: number,
  sessionId?: string | null,
  shippingPrice?: number | null,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const hasShipping = shippingPrice !== undefined && shippingPrice !== null;
  if (userId) {
    if (hasShipping) {
      await db.execute(
        sql`UPDATE cartItems SET quantity = ${quantity}, shippingPrice = ${shippingPrice}, updatedAt = NOW() WHERE id = ${id} AND userId = ${userId}`
      );
    } else {
      await db.execute(
        sql`UPDATE cartItems SET quantity = ${quantity}, updatedAt = NOW() WHERE id = ${id} AND userId = ${userId}`
      );
    }
  } else if (sessionId) {
    if (hasShipping) {
      await db.execute(
        sql`UPDATE cartItems SET quantity = ${quantity}, shippingPrice = ${shippingPrice}, updatedAt = NOW() WHERE id = ${id} AND sessionId = ${sessionId}`
      );
    } else {
      await db.execute(
        sql`UPDATE cartItems SET quantity = ${quantity}, updatedAt = NOW() WHERE id = ${id} AND sessionId = ${sessionId}`
      );
    }
  }
}

export async function removeFromCart(id: number, userId: number | null, sessionId?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userId) {
    await db.execute(
      sql`DELETE FROM cartItems WHERE id = ${id} AND userId = ${userId}`
    );
  } else if (sessionId) {
    await db.execute(
      sql`DELETE FROM cartItems WHERE id = ${id} AND sessionId = ${sessionId}`
    );
  }
}

export async function clearCart(userId: number | null, sessionId?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userId) {
    await db.execute(
      sql`DELETE FROM cartItems WHERE userId = ${userId}`
    );
  } else if (sessionId) {
    await db.execute(
      sql`DELETE FROM cartItems WHERE sessionId = ${sessionId}`
    );
  }
}

export async function getCartItemCount(userId: number | null, sessionId?: string | null): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let rows: any;
  if (userId) {
    rows = await db.execute(
      sql`SELECT SUM(quantity) as total FROM cartItems WHERE userId = ${userId}`
    ) as any;
  } else if (sessionId) {
    rows = await db.execute(
      sql`SELECT SUM(quantity) as total FROM cartItems WHERE sessionId = ${sessionId}`
    ) as any;
  } else {
    return 0;
  }
  const row = (rows[0] as any[])[0];
  return Number(row?.total ?? 0);
}

export type AbandonedCartSummary = {
  cartKey: string;
  userId: number | null;
  sessionId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  emailReminderSentAt: Date | null;
  whatsappReminderOpenedAt: Date | null;
  itemCount: number;
  productCount: number;
  totalValue: number;
  products: string;
  lastActivityAt: Date;
  expiresAt: Date;
};

export type AbandonedCartItemDetail = {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedAttributes: string | null;
  variationSnapshot: string | null;
  customDimensions: string | null;
  artFileUrl: string | null;
  notes: string | null;
  updatedAt: Date;
};

export type AbandonedCartCustomerDetail = {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  cpfCnpj: string | null;
  emailVerified: boolean | null;
  status: string | null;
  allowStorePickup: boolean | null;
  addressZipCode: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  createdAt: Date | null;
};

export type AbandonedCartDetails = {
  customer: AbandonedCartCustomerDetail | null;
  items: AbandonedCartItemDetail[];
};

export type DeletedAbandonedCartHistory = {
  id: number;
  cartKey: string;
  clientName: string | null;
  clientEmail: string | null;
  products: string;
  itemCount: number;
  productCount: number;
  totalValue: number;
  deletionReason: "automatic" | "manual";
  lastActivityAt: Date;
  deletedAt: Date;
};

type AbandonedCartIdentity = { userId: number | null; sessionId: string | null };

function getAbandonedCartKey(identity: AbandonedCartIdentity) {
  return identity.userId !== null ? `user:${identity.userId}` : `session:${identity.sessionId ?? "sem-sessao"}`;
}

async function archiveCartRows(rows: any[], deletionReason: "automatic" | "manual") {
  if (rows.length === 0) return 0;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const groups = new Map<string, any[]>();
  for (const row of rows) {
    const key = getAbandonedCartKey({ userId: row.userId === null ? null : Number(row.userId), sessionId: row.sessionId ?? null });
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  for (const [cartKey, cartRows] of Array.from(groups.entries())) {
    const first = cartRows[0];
    const products = Array.from(new Set(cartRows.map((row: any) => String(row.productName ?? "Produto não identificado")))).join(", ");
    const itemCount = cartRows.reduce((total: number, row: any) => total + Number(row.quantity ?? 0), 0);
    const totalValue = cartRows.reduce((total: number, row: any) => total + (Number(row.priceAtCart ?? 0) * Number(row.quantity ?? 0)), 0);
    const lastActivityAt = new Date(Math.max(...cartRows.map((row: any) => new Date(row.updatedAt).getTime())));
    await db.execute(sql`
      INSERT INTO deletedAbandonedCarts (cartKey, userId, sessionId, clientName, clientEmail, clientPhone, products, itemCount, productCount, totalValue, snapshot, deletionReason, lastActivityAt)
      VALUES (${cartKey}, ${first.userId ?? null}, ${first.sessionId ?? null}, ${first.clientName ?? null}, ${first.clientEmail ?? null}, ${first.clientPhone ?? null}, ${products}, ${itemCount}, ${new Set(cartRows.map((row: any) => row.productId)).size}, ${totalValue.toFixed(2)}, ${JSON.stringify(cartRows)}, ${deletionReason}, ${lastActivityAt})
    `);
  }
  return groups.size;
}

async function getCartRowsForArchive(identity?: AbandonedCartIdentity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const filter = identity
    ? sql`ci.userId <=> ${identity.userId} AND ci.sessionId <=> ${identity.sessionId}`
    : sql`EXISTS (SELECT 1 FROM cartItems related WHERE related.userId <=> ci.userId AND related.sessionId <=> ci.sessionId GROUP BY related.userId, related.sessionId HAVING MAX(related.updatedAt) < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 48 HOUR))`;
  const result = await db.execute(sql`
    SELECT ci.*, p.name AS productName,
      COALESCE(NULLIF(CONCAT_WS(' ', ca.firstName, ca.lastName), ''), u.name) AS clientName,
      COALESCE(ca.email, u.email) AS clientEmail,
      ca.phone AS clientPhone
    FROM cartItems ci
    INNER JOIN products p ON p.id = ci.productId
    LEFT JOIN customer_accounts ca ON ci.sessionId = CONCAT('cust_', ca.id)
    LEFT JOIN users u ON ci.userId = u.id
    WHERE ${filter}
  `) as any;
  return (result[0] ?? []) as any[];
}

function assertAbandonedCartIdentity(identity: AbandonedCartIdentity) {
  if (identity.userId === null && !identity.sessionId) {
    throw new Error("Identificação do carrinho é obrigatória");
  }
}

/**
 * Agrupa todos os carrinhos ainda abertos para acompanhamento administrativo.
 * Um carrinho é definido pela conta do cliente ou pela sessão anônima e expira
 * 48 horas após a última movimentação de qualquer um de seus itens.
 */
export async function getAbandonedCartSummaries(): Promise<AbandonedCartSummary[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    SELECT
      CASE
        WHEN ci.userId IS NOT NULL THEN CONCAT('user:', ci.userId)
        ELSE CONCAT('session:', COALESCE(ci.sessionId, 'sem-sessao'))
      END AS cartKey,
      ci.userId,
      ci.sessionId,
      SUM(ci.quantity) AS itemCount,
      COUNT(*) AS productCount,
      COALESCE(SUM(CAST(ci.priceAtCart AS DECIMAL(12,2)) * ci.quantity), 0) AS totalValue,
      GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') AS products,
      COALESCE(NULLIF(MAX(CONCAT_WS(' ', ca.firstName, ca.lastName)), ''), MAX(u.name)) AS clientName,
      COALESCE(MAX(ca.email), MAX(u.email)) AS clientEmail,
      MAX(ca.phone) AS clientPhone,
      (SELECT MAX(r.sentAt) FROM abandonedCartReminders r WHERE r.cartKey = CASE WHEN ci.userId IS NOT NULL THEN CONCAT('user:', ci.userId) ELSE CONCAT('session:', COALESCE(ci.sessionId, 'sem-sessao')) END AND r.channel = 'email' AND r.status = 'sent') AS emailReminderSentAt,
      (SELECT MAX(r.createdAt) FROM abandonedCartReminders r WHERE r.cartKey = CASE WHEN ci.userId IS NOT NULL THEN CONCAT('user:', ci.userId) ELSE CONCAT('session:', COALESCE(ci.sessionId, 'sem-sessao')) END AND r.channel = 'whatsapp' AND r.status = 'prepared') AS whatsappReminderOpenedAt,
      MAX(ci.updatedAt) AS lastActivityAt,
      DATE_ADD(MAX(ci.updatedAt), INTERVAL 48 HOUR) AS expiresAt
    FROM cartItems ci
    INNER JOIN products p ON p.id = ci.productId
    LEFT JOIN customer_accounts ca ON ci.sessionId = CONCAT('cust_', ca.id)
    LEFT JOIN users u ON ci.userId = u.id
    GROUP BY ci.userId, ci.sessionId
    ORDER BY MAX(ci.updatedAt) ASC
  `) as any;

  const rows = (result[0] ?? []) as any[];
  return rows.map((row) => ({
    cartKey: String(row.cartKey),
    userId: row.userId === null || row.userId === undefined ? null : Number(row.userId),
    sessionId: row.sessionId ?? null,
    clientName: row.clientName ?? null,
    clientEmail: row.clientEmail ?? null,
    clientPhone: row.clientPhone ?? null,
    emailReminderSentAt: row.emailReminderSentAt ? new Date(row.emailReminderSentAt) : null,
    whatsappReminderOpenedAt: row.whatsappReminderOpenedAt ? new Date(row.whatsappReminderOpenedAt) : null,
    itemCount: Number(row.itemCount ?? 0),
    productCount: Number(row.productCount ?? 0),
    totalValue: Number(row.totalValue ?? 0),
    products: String(row.products ?? "Produto não identificado"),
    lastActivityAt: new Date(row.lastActivityAt),
    expiresAt: new Date(row.expiresAt),
  }));
}

/** Retorna produtos e dados cadastrais disponíveis de um carrinho específico. */
export async function getAbandonedCartDetails(identity: AbandonedCartIdentity): Promise<AbandonedCartDetails> {
  assertAbandonedCartIdentity(identity);
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const itemResult = await db.execute(sql`
    SELECT
      ci.id,
      ci.productId,
      p.name AS productName,
      p.imageUrl AS productImage,
      ci.quantity,
      ci.priceAtCart AS unitPrice,
      (CAST(ci.priceAtCart AS DECIMAL(12,2)) * ci.quantity) AS totalPrice,
      ci.selectedAttributes,
      ci.variationSnapshot,
      ci.customDimensions,
      ci.artFileUrl,
      ci.notes,
      ci.updatedAt
    FROM cartItems ci
    INNER JOIN products p ON p.id = ci.productId
    WHERE ci.userId <=> ${identity.userId}
      AND ci.sessionId <=> ${identity.sessionId}
    ORDER BY ci.updatedAt DESC, ci.id DESC
  `) as any;

  const rows = (itemResult[0] ?? []) as any[];
  const items = rows.map((row) => ({
    id: Number(row.id),
    productId: Number(row.productId),
    productName: String(row.productName ?? "Produto não identificado"),
    productImage: row.productImage ?? null,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unitPrice ?? 0),
    totalPrice: Number(row.totalPrice ?? 0),
    selectedAttributes: row.selectedAttributes ?? null,
    variationSnapshot: row.variationSnapshot ?? null,
    customDimensions: row.customDimensions ?? null,
    artFileUrl: row.artFileUrl ?? null,
    notes: row.notes ?? null,
    updatedAt: new Date(row.updatedAt),
  }));

  const customerResult = await db.execute(sql`
    SELECT
      ca.id,
      ca.firstName,
      ca.lastName,
      COALESCE(NULLIF(CONCAT_WS(' ', ca.firstName, ca.lastName), ''), u.name) AS name,
      COALESCE(ca.email, u.email) AS email,
      ca.phone,
      ca.cpfCnpj,
      ca.emailVerified,
      ca.status,
      ca.allowStorePickup,
      ca.addressZipCode,
      ca.addressStreet,
      ca.addressNumber,
      ca.addressComplement,
      ca.addressNeighborhood,
      ca.addressCity,
      ca.addressState,
      ca.createdAt
    FROM cartItems ci
    LEFT JOIN customer_accounts ca ON ci.sessionId = CONCAT('cust_', ca.id)
    LEFT JOIN users u ON ci.userId = u.id
    WHERE ci.userId <=> ${identity.userId}
      AND ci.sessionId <=> ${identity.sessionId}
    LIMIT 1
  `) as any;
  const customerRow = ((customerResult[0] ?? []) as any[])[0];
  const customer = customerRow && (customerRow.id || customerRow.name || customerRow.email)
    ? {
        id: customerRow.id === null || customerRow.id === undefined ? null : Number(customerRow.id),
        firstName: customerRow.firstName ?? null,
        lastName: customerRow.lastName ?? null,
        name: customerRow.name ?? null,
        email: customerRow.email ?? null,
        phone: customerRow.phone ?? null,
        cpfCnpj: customerRow.cpfCnpj ?? null,
        emailVerified: customerRow.emailVerified === null || customerRow.emailVerified === undefined ? null : Boolean(customerRow.emailVerified),
        status: customerRow.status ?? null,
        allowStorePickup: customerRow.allowStorePickup === null || customerRow.allowStorePickup === undefined ? null : Boolean(customerRow.allowStorePickup),
        addressZipCode: customerRow.addressZipCode ?? null,
        addressStreet: customerRow.addressStreet ?? null,
        addressNumber: customerRow.addressNumber ?? null,
        addressComplement: customerRow.addressComplement ?? null,
        addressNeighborhood: customerRow.addressNeighborhood ?? null,
        addressCity: customerRow.addressCity ?? null,
        addressState: customerRow.addressState ?? null,
        createdAt: customerRow.createdAt ? new Date(Number(customerRow.createdAt)) : null,
      }
    : null;

  return { customer, items };
}

/** Exclui todos os itens de um único carrinho identificado por conta ou sessão. */
export async function deleteAbandonedCart(identity: AbandonedCartIdentity): Promise<{ deletedItems: number }> {
  assertAbandonedCartIdentity(identity);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rowsToArchive = await getCartRowsForArchive(identity);
  await archiveCartRows(rowsToArchive, "manual");

  const result = await db.execute(sql`
    DELETE FROM cartItems
    WHERE userId <=> ${identity.userId}
      AND sessionId <=> ${identity.sessionId}
  `) as any;

  return { deletedItems: Number(result[0]?.affectedRows ?? result.affectedRows ?? 0) };
}

export async function getDeletedAbandonedCartHistory(limit = 100): Promise<DeletedAbandonedCartHistory[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(sql`
    SELECT id, cartKey, clientName, clientEmail, products, itemCount, productCount, totalValue, deletionReason, lastActivityAt, deletedAt
    FROM deletedAbandonedCarts
    ORDER BY deletedAt DESC
    LIMIT ${Math.min(Math.max(limit, 1), 200)}
  `) as any;
  return ((result[0] ?? []) as any[]).map((row) => ({
    id: Number(row.id), cartKey: String(row.cartKey), clientName: row.clientName ?? null, clientEmail: row.clientEmail ?? null,
    products: String(row.products), itemCount: Number(row.itemCount), productCount: Number(row.productCount), totalValue: Number(row.totalValue),
    deletionReason: row.deletionReason, lastActivityAt: new Date(row.lastActivityAt), deletedAt: new Date(row.deletedAt),
  }));
}

export async function recordAbandonedCartReminder(
  identity: AbandonedCartIdentity,
  channel: "email" | "whatsapp",
  recipient: string,
  status: "sent" | "prepared" | "failed" = "sent"
) {
  assertAbandonedCartIdentity(identity);
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(sql`
    INSERT INTO abandonedCartReminders (cartKey, channel, recipient, status, sentAt)
    VALUES (${getAbandonedCartKey(identity)}, ${channel}, ${recipient}, ${status}, ${status === "sent" ? new Date() : null})
  `);
}

/** Remove somente carrinhos cuja última atividade inteira tenha ultrapassado 48 horas. */
export async function cleanupExpiredAbandonedCarts(): Promise<{ deletedItems: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rowsToArchive = await getCartRowsForArchive();
  await archiveCartRows(rowsToArchive, "automatic");

  const result = await db.execute(sql`
    DELETE ci
    FROM cartItems ci
    INNER JOIN (
      SELECT userId, sessionId
      FROM cartItems
      GROUP BY userId, sessionId
      HAVING MAX(updatedAt) < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 48 HOUR)
    ) expiredCarts
      ON ci.userId <=> expiredCarts.userId
      AND ci.sessionId <=> expiredCarts.sessionId
  `) as any;

  return { deletedItems: Number(result[0]?.affectedRows ?? result.affectedRows ?? 0) };
}

// ============================================================
// CHECKOUT HELPERS
// ============================================================

export async function createOrderFromCart(data: {
  userId: number;
  clientId: number;
  customerId?: number | null; // ID do cliente da loja (customer auth)
  guestToken?: string | null;
  guestEmail?: string | null;
  guestName?: string | null;
  orderNumber: string;
  totalPrice: number;
  notes?: string;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement?: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  deliveryFullName: string;
  deliveryPhone: string;
  shippingMethod?: string | null;
  shippingPrice?: number;
  shippingLabel?: string | null;
  paymentMethod?: string | null;
  initialStatus?: string;
  cartItems: Array<{
    productId: number;
    productName: string;
    quantity: number;
    priceAtCart: number;
    selectedAttributes?: string;
    variationSnapshot?: string;
    customDimensions?: string;
    artFileUrl?: string;
    artFileUrls?: string;
    notes?: string;
    prazoName?: string | null;
    prazoHours?: number | null;
    urgencyRate?: number | null;
    urgencyMultiplier?: number | null;
    urgencyUnit?: string | null;
    urgencySurcharge?: number | null;
    forecastDate?: string | null;
    forecastLabel?: string | null;
    shippingMethod?: string | null;
    shippingPrice?: number | null;
    shippingLabel?: string | null;
    cepDestino?: string | null;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Criar o pedido
  let orderId: number;
  try {
    const orderResult = await db.execute(
      sql`
        INSERT INTO orders (
          clientId, userId, customerId, orderNumber, status, totalPrice, paymentStatus, notes,
          deliveryStreet, deliveryNumber, deliveryComplement, deliveryNeighborhood,
          deliveryCity, deliveryState, deliveryZipCode, deliveryFullName, deliveryPhone,
          guestToken, guestEmail, guestName, shippingMethod, shippingPrice, shippingLabel, payment_method
        ) VALUES (
          ${data.clientId}, ${data.userId}, ${data.customerId ?? null}, ${data.orderNumber},
          ${data.initialStatus ?? 'pagamento_retirada'},
          ${data.totalPrice}, 'pendente', ${data.notes ?? null},
          ${data.deliveryStreet}, ${data.deliveryNumber}, ${data.deliveryComplement ?? null},
          ${data.deliveryNeighborhood}, ${data.deliveryCity}, ${data.deliveryState},
          ${data.deliveryZipCode}, ${data.deliveryFullName}, ${data.deliveryPhone},
          ${data.guestToken ?? null}, ${data.guestEmail ?? null}, ${data.guestName ?? null},
          ${data.shippingMethod ?? null}, ${data.shippingPrice ?? 0}, ${data.shippingLabel ?? null}, ${data.paymentMethod ?? null}
        )
      `
    );
    // Logar o resultado bruto para diagnóstico

    // drizzle-orm/mysql2: db.execute() retorna [ResultSetHeader, FieldPacket[]]
    // ResultSetHeader tem insertId diretamente em result[0].insertId
    const rawId =
      (orderResult as any)[0]?.insertId ??
      (orderResult as any).insertId ??
      (orderResult as any).rows?.[0]?.id ??
      (orderResult as any).lastInsertRowid;

    orderId = Number(rawId);

    if (!orderId || isNaN(orderId) || orderId <= 0) {
      throw new Error(`orderId não foi gerado corretamente. orderResult: ${JSON.stringify(orderResult)}`);
    }
  } catch (err: any) {
    console.error("[DB] ❌ INSERT orders FALHOU:");
    console.error("[DB] tabela: orders");
    console.error("[DB] erro:", err.message);
    throw new Error(`Failed INSERT orders: ${err.message}`);
  }

  // Inserir os itens do pedido
  console.log(`[DB] Inserindo ${data.cartItems.length} itens para orderId=${orderId}`);
  for (let i = 0; i < data.cartItems.length; i++) {
    const item = data.cartItems[i];
    console.log(`[DB] Item [${i}]: productId=${item.productId}, productName=${item.productName}, qty=${item.quantity}, price=${item.priceAtCart}`);
    try {
      const productIdVal = item.productId ? Number(item.productId) : null;
      const itemResult = await db.execute(
        sql`
          INSERT INTO orderItems (orderId, productId, productName, quantity, priceAtOrder, selectedAttributes, variationSnapshot, customDimensions, artFileUrl, artFileUrls, notes, prazoName, prazoHours, urgencyRate, urgencyMultiplier, urgencyUnit, urgencySurcharge, forecastDate, forecastLabel, shippingMethod, shippingPrice, shippingLabel, cepDestino)
          VALUES (${orderId}, ${productIdVal}, ${item.productName ?? 'Produto'}, ${item.quantity}, ${item.priceAtCart},
            ${item.selectedAttributes ?? null}, ${item.variationSnapshot ?? null}, ${item.customDimensions ?? null}, ${item.artFileUrl ?? null}, ${item.artFileUrls ?? null}, ${item.notes ?? null},
            ${item.prazoName ?? null}, ${item.prazoHours ?? 0}, ${item.urgencyRate ?? null}, ${item.urgencyMultiplier ?? null}, ${item.urgencyUnit ?? null}, ${item.urgencySurcharge ?? null}, ${item.forecastDate ?? null}, ${item.forecastLabel ?? null},
            ${item.shippingMethod ?? null}, ${item.shippingPrice ?? 0}, ${item.shippingLabel ?? null}, ${item.cepDestino ?? null})
        `
      );
      const itemInsertId = (itemResult as any)[0]?.insertId ?? (itemResult as any).insertId;
      console.log(`[DB] ✅ orderItem [${i}] inserido com id=${itemInsertId}`);
    } catch (err: any) {
      console.error(`[DB] ❌ INSERT orderItems [${i}] FALHOU:`);
      console.error("[DB] tabela: orderItems");
      console.error("[DB] item:", JSON.stringify(item));
      console.error("[DB] erro:", err.message);
      // Não re-throw: salvar o pedido mesmo sem itens para não perder a venda
      // O admin pode reconciliar manualmente
    }
  }
  console.log(`[DB] Itens do pedido ${orderId} processados`);

  // Registrar histórico de status
  try {
    await db.execute(
      sql`
        INSERT INTO orderStatusHistory (orderId, newStatus, changedBy, notes)
        VALUES (${orderId}, ${data.initialStatus ?? 'pagamento_retirada'}, ${data.userId}, 'Pedido criado pelo cliente')
      `
    );
  } catch (err: any) {
    console.error("[DB] ⚠️ INSERT orderStatusHistory FALHOU (não-crítico):", err.message);
    // Não re-throw - não é crítico
  }

  return orderId;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.execute(
    sql`
      SELECT 
        o.id, o.orderNumber, o.status, o.totalPrice, o.paymentStatus,
        o.deliveryCity, o.deliveryState, o.createdAt, o.updatedAt,
        o.shippingMethod, o.payment_method as paymentMethod,
        COUNT(oi.id) as itemCount
      FROM orders o
      LEFT JOIN orderItems oi ON o.id = oi.orderId
      WHERE o.userId = ${userId}
      GROUP BY o.id
      ORDER BY o.createdAt DESC
    `
  ) as any;
  return (rows[0] ?? []) as any[];
}

export async function getOrderDetailByUser(orderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar o pedido
  const orderRows = await db.execute(
    sql`SELECT * FROM orders WHERE id = ${orderId} AND userId = ${userId}`
  ) as any;
  const order = ((orderRows[0] ?? []) as any[])[0];
  if (!order) return null;

  // Buscar os itens
  const itemRows = await db.execute(
    sql`
      SELECT oi.*, p.imageUrl as productImage
      FROM orderItems oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId = ${orderId}
    `
  ) as any;
  const items = (itemRows[0] ?? []) as any[];

  return { order, items };
}

export async function getOrderStatusHistory(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.execute(
    sql`SELECT * FROM orderStatusHistory WHERE orderId = ${orderId} ORDER BY createdAt ASC`
  ) as any;
  return (rows[0] ?? []) as any[];
}

export async function getEmailHistory(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.execute(
    sql`SELECT * FROM emailHistory WHERE orderId = ${orderId} ORDER BY sentAt DESC`
  ) as any;
  return (rows[0] ?? []) as any[];
}

export async function getEmailHistoryByOrderItem(orderItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.execute(
    sql`SELECT * FROM emailHistory WHERE orderItemId = ${orderItemId} ORDER BY sentAt DESC`
  ) as any;
  return (rows[0] ?? []) as any[];
}

export async function addEmailToHistory(data: {
  orderId: number;
  orderItemId?: number | null;
  recipientEmail: string;
  recipientName?: string | null;
  emailType: string;
  subject: string;
  templateName?: string | null;
  operatorNote?: string | null;
  proofImageUrl?: string | null;
  status?: string;
  errorMessage?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(sql`
    INSERT INTO emailHistory (
      orderId, orderItemId, recipientEmail, recipientName, emailType, subject,
      templateName, operatorNote, proofImageUrl, status, errorMessage
    ) VALUES (
      ${data.orderId},
      ${data.orderItemId ?? null},
      ${data.recipientEmail},
      ${data.recipientName ?? null},
      ${data.emailType},
      ${data.subject},
      ${data.templateName ?? null},
      ${data.operatorNote ?? null},
      ${data.proofImageUrl ?? null},
      ${data.status ?? 'sent'},
      ${data.errorMessage ?? null}
    )
  `) as any;
  return result;
}
