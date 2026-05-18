import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, orders, orderItems, orderStatusHistory, segments, categories, productCategories, variationTypes, variationOptions, orderItemVariations, fileChecks } from "../drizzle/schema";
import type { InsertVariationType, InsertVariationOption, InsertOrderItemVariation, InsertFileCheck } from "../drizzle/schema";
import type { InsertOrder } from "../drizzle/schema";
import { ENV } from './_core/env';
import { isNull } from 'drizzle-orm';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result[0];
}

// Segments queries
export async function getAllSegments() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(segments).limit(100);
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

export async function updateSegment(id: number, name: string, icon: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(segments)
    .set({ name, icon })
    .where(eq(segments.id, id));
  
  // Retornar o segmento atualizado
  const updated = await db.select().from(segments)
    .where(eq(segments.id, id))
    .limit(1);
  
  return updated[0] || { id, name, icon };
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

  const result = await db.select().from(orders).limit(1000);
  return result;
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  return result;
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(orders)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return result;
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
  const insertResult = await db.insert(variationTypes).values({
    productId,
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
      .orderBy(variationTypes.id)
      .limit(1);
    if (newVariation.length === 0) {
      throw new Error("Failed to retrieve newly inserted variation");
    }
    newVariationId = newVariation[0].id;
  }
  
  // Copy all options from the global variation
  const options = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, globalVariationId));
  
  for (const option of options) {
    await db.insert(variationOptions).values({
      variationTypeId: newVariationId,
      name: option.name,
      description: option.description,
      priceModifier: option.priceModifier,
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

// Variation Options queries
export async function getVariationOptions(variationTypeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(variationOptions)
    .where(eq(variationOptions.variationTypeId, variationTypeId));
  return result;
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
    const allMaterials = await db.select().from(variationOptions);

    // Filtrar resultados em memória
    const filteredProducts = allProducts.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 10);

    const filteredCategories = allCategories.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    const filteredMaterials = allMaterials.filter(m =>
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
