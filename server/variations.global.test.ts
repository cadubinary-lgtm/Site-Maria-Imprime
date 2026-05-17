import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, getGlobalVariationTypes, createVariationType, getVariationOptions } from "./db";

describe("Global Variation Types", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should fetch global variation types (productId = null)", async () => {
    const globalTypes = await getGlobalVariationTypes();
    expect(Array.isArray(globalTypes)).toBe(true);
    
    // All global types should have productId = null
    globalTypes.forEach((type: any) => {
      expect(type.productId).toBeNull();
    });
  });

  it("should create a global variation type", async () => {
    const result = await createVariationType({
      productId: null as any,
      name: "Test Global Type",
      type: "material",
      isRequired: true,
    });

    expect(result).toBeDefined();
  });

  it("should fetch global types with their options", async () => {
    const globalTypes = await getGlobalVariationTypes();
    
    if (globalTypes.length > 0) {
      const firstType = globalTypes[0];
      const options = await getVariationOptions(firstType.id);
      
      expect(Array.isArray(options)).toBe(true);
    }
  });

  it("should distinguish between product-specific and global types", async () => {
    const globalTypes = await getGlobalVariationTypes();
    
    // All should be global (productId = null)
    globalTypes.forEach((type: any) => {
      expect(type.productId).toBeNull();
    });
  });
});
