import { getDb } from "./db";
import { products, segments, productSegments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Adicionar segmento a um produto
 */
export async function addSegmentToProduct(productId: number, segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(productSegments).values({
      productId,
      segmentId,
    }).onDuplicateKeyUpdate({ set: { segmentId } });
    return { success: true };
  } catch (error) {
    console.error("Error adding segment to product:", error);
    throw error;
  }
}

/**
 * Remover segmento de um produto
 */
export async function removeSegmentFromProduct(productId: number, segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db
      .delete(productSegments)
      .where(
        and(
          eq(productSegments.productId, productId),
          eq(productSegments.segmentId, segmentId)
        )
      );
    return { success: true };
  } catch (error) {
    console.error("Error removing segment from product:", error);
    throw error;
  }
}

/**
 * Obter todos os segmentos de um produto
 */
export async function getProductSegments(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db
      .select({
        id: segments.id,
        name: segments.name,
        icon: segments.icon,
        slug: segments.slug,
      })
      .from(productSegments)
      .innerJoin(segments, eq(productSegments.segmentId, segments.id))
      .where(eq(productSegments.productId, productId));
    
    return result;
  } catch (error) {
    console.error("Error getting product segments:", error);
    throw error;
  }
}

/**
 * Atualizar múltiplos segmentos de um produto (substitui todos)
 */
export async function updateProductSegments(productId: number, segmentIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    // Remover segmentos antigos
    await db
      .delete(productSegments)
      .where(eq(productSegments.productId, productId));

    // Adicionar novos segmentos
    if (segmentIds.length > 0) {
      await db.insert(productSegments).values(
        segmentIds.map((segmentId) => ({
          productId,
          segmentId,
        }))
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating product segments:", error);
    throw error;
  }
}

/**
 * Obter todos os segmentos disponíveis
 */
export async function getAllSegments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db
      .select({
        id: segments.id,
        name: segments.name,
        icon: segments.icon,
        slug: segments.slug,
      })
      .from(segments);
    
    return result;
  } catch (error) {
    console.error("Error getting all segments:", error);
    throw error;
  }
}

/**
 * Obter produtos por segmento
 */
export async function getProductsBySegment(segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        pixPrice: products.pixPrice,
        cardPrice: products.cardPrice,
        resellerPrice: products.resellerPrice,
        pricePerM2: products.pricePerM2,
        pixPricePerM2: products.pixPricePerM2,
        cardPricePerM2: products.cardPricePerM2,
        resellerPricePerM2: products.resellerPricePerM2,
        imageUrl: products.imageUrl,
        category: products.category,
        subcategory: products.subcategory,
        calculationType: products.calculationType,
        unit: products.unit,
        minWidth: products.minWidth,
        minHeight: products.minHeight,
        allowPickup: products.allowPickup,
        allowMotoExpress: products.allowMotoExpress,
        allowedCarriers: products.allowedCarriers,
        specifications: products.specifications,
        tags: products.tags,
        tagPosition: products.tagPosition,
        cardDescription: products.cardDescription,
        isActive: products.isActive,
      })
      .from(productSegments)
      .innerJoin(products, eq(productSegments.productId, products.id))
      .where(eq(productSegments.segmentId, segmentId));
    
    return result;
  } catch (error) {
    console.error("Error getting products by segment:", error);
    throw error;
  }
}
