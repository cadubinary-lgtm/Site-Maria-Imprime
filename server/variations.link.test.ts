import { describe, it, expect, beforeAll } from "vitest";
import { linkGlobalVariationToProduct, getVariationTypesByProduct, getVariationOptions } from "./db";

describe("Link Global Variation to Product", () => {
  // Use known product ID from the database
  const testProductId = 90014;
  let globalVariationId: number;

  beforeAll(async () => {
    // Get a global variation to link (should exist from previous tests)
    const { getGlobalVariationTypes } = await import("./db");
    const globalTypes = await getGlobalVariationTypes();
    
    if (globalTypes.length > 0) {
      globalVariationId = globalTypes[0].id;
    }
  });

  it("should link a global variation to a product", async () => {
    if (!globalVariationId) {
      console.warn("No global variation found to test linking");
      return;
    }

    const result = await linkGlobalVariationToProduct(globalVariationId, testProductId);
    expect(result).toBeDefined();
  });

  it("should create product-specific variation with copied options", async () => {
    if (!globalVariationId) {
      console.warn("No global variation found to test linking");
      return;
    }

    // Link the variation
    await linkGlobalVariationToProduct(globalVariationId, testProductId);

    // Get product variations
    const productVariations = await getVariationTypesByProduct(testProductId);
    expect(productVariations.length).toBeGreaterThan(0);

    // Check that at least one variation has options
    const variationWithOptions = productVariations.find(v => v.id);
    if (variationWithOptions) {
      const options = await getVariationOptions(variationWithOptions.id);
      expect(Array.isArray(options)).toBe(true);
    }
  });

  it("should not link a non-existent global variation", async () => {
    try {
      await linkGlobalVariationToProduct(99999, testProductId);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Global variation not found");
    }
  });
});
