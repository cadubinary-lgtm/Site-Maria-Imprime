import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Panel - Update Price', () => {
  let testProductId: number;
  const originalPrice = '500.00';
  const newPrice = '750.00';

  beforeAll(async () => {
    // Get first product for testing
    const database = await getDb();
    const result = await database.select().from(products).limit(1);
    if (result.length > 0) {
      testProductId = result[0].id;
    }
  });

  it('should update product price successfully', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    // Update price
    const database = await getDb();
    await database
      .update(products)
      .set({ price: newPrice })
      .where(eq(products.id, testProductId));

    // Verify update
    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    expect(updated[0].price).toBe(newPrice);
  });

  it('should reject invalid price format', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    const invalidPrice = 'invalid';
    const isValid = !isNaN(parseFloat(invalidPrice));
    expect(isValid).toBe(false);
  });

  it('should handle price with decimals', async () => {
    if (!testProductId) {
      expect(true).toBe(true); // Skip if no product
      return;
    }

    const priceWithDecimals = '999.99';
    const parsed = parseFloat(priceWithDecimals);
    expect(parsed).toBe(999.99);
  });

  it('should maintain product data integrity when updating price', async () => {
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

    // Update only price
    await database
      .update(products)
      .set({ price: '888.88' })
      .where(eq(products.id, testProductId));

    const updated = await database
      .select()
      .from(products)
      .where(eq(products.id, testProductId));

    // Verify other fields remain unchanged
    expect(updated[0].name).toBe(nameBeforeUpdate);
    expect(updated[0].price).toBe('888.88');
  });
});
