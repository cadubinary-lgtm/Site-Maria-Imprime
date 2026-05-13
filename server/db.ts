import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, orders, orderItems, orderStatusHistory, segments, categories, productCategories, variationTypes, variationOptions, orderItemVariations, fileChecks } from "../drizzle/schema";
import type { InsertVariationType, InsertVariationOption, InsertOrderItemVariation, InsertFileCheck } from "../drizzle/schema";
import type { InsertOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

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
    .where(eq(variationTypes.productId, productId));
  return result;
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
