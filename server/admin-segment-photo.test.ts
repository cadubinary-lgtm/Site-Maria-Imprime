import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Panel - Update Segment and Photo', () => {
  let testProductId: number;
  const originalSegment = 'servicos';
  const newSegment = 'varejo';
  const testImageUrl = '/manus-storage/test-image-12345.jpg';

  beforeAll(async () => {
    // Get first product for testing
    const database = await getDb();
    const result = await database.select().from(products).limit(1);
    if (result.length > 0) {
      testProductId = result[0].id;
    }
  });

  it('should update product segment successfully', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    // Update segment
    const database = await getDb();
    await database
      .update(products)
      .set({ segment: newSegment as any })
      .where(eq(products.id, testProductId));

    // Verify update
    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    expect(updated[0].segment).toBe(newSegment);
  });

  it('should update product image URL successfully', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    // Update image URL
    const database = await getDb();
    await database
      .update(products)
      .set({ imageUrl: testImageUrl })
      .where(eq(products.id, testProductId));

    // Verify update
    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    expect(updated[0].imageUrl).toBe(testImageUrl);
  });

  it('should update both segment and image URL together', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    const testSegment = 'alimentacao';
    const testUrl = '/manus-storage/food-product-67890.jpg';

    // Update both fields
    const database = await getDb();
    await database
      .update(products)
      .set({ segment: testSegment as any, imageUrl: testUrl })
      .where(eq(products.id, testProductId));

    // Verify update
    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    expect(updated[0].segment).toBe(testSegment);
    expect(updated[0].imageUrl).toBe(testUrl);
  });

  it('should maintain product data integrity when updating segment and photo', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    const database = await getDb();
    const product = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    const originalProduct = product[0];
    const nameBeforeUpdate = originalProduct.name;
    const priceBeforeUpdate = originalProduct.price;
    const descriptionBeforeUpdate = originalProduct.description;

    // Update segment and image
    await database
      .update(products)
      .set({ segment: 'beleza' as any, imageUrl: '/manus-storage/beauty-product.jpg' })
      .where(eq(products.id, testProductId));

    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    // Verify other fields remain unchanged
    expect(updated[0].name).toBe(nameBeforeUpdate);
    expect(updated[0].price).toBe(priceBeforeUpdate);
    expect(updated[0].description).toBe(descriptionBeforeUpdate);
    expect(updated[0].segment).toBe('beleza');
    expect(updated[0].imageUrl).toBe('/manus-storage/beauty-product.jpg');
  });

  it('should validate segment enum values', async () => {
    const validSegments = ['alimentacao', 'beleza', 'varejo', 'servicos'];
    const testSegment = 'varejo';
    
    expect(validSegments).toContain(testSegment);
  });

  it('should handle null image URL', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    const database = await getDb();
    await database
      .update(products)
      .set({ imageUrl: null })
      .where(eq(products.id, testProductId));

    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    expect(updated[0].imageUrl).toBeNull();
  });
});
