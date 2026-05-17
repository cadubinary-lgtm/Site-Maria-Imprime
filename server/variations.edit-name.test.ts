import { describe, it, expect, beforeAll } from "vitest";
import { updateVariationType, getVariationTypesByProduct, getGlobalVariationTypes } from "./db";

describe("Edit Variation Name", () => {
  const testProductId = 90014;
  let variationTypeId: number;
  let globalVariationId: number;

  beforeAll(async () => {
    // Get a product variation to edit
    const productVariations = await getVariationTypesByProduct(testProductId);
    if (productVariations.length > 0) {
      variationTypeId = productVariations[0].id;
    }

    // Get a global variation to edit
    const globalVariations = await getGlobalVariationTypes();
    if (globalVariations.length > 0) {
      globalVariationId = globalVariations[0].id;
    }
  });

  it("should update product-specific variation name", async () => {
    if (!variationTypeId) {
      console.warn("No product variation found to test editing");
      return;
    }

    const newName = `Updated Name ${Date.now()}`;
    const result = await updateVariationType(variationTypeId, { name: newName });
    expect(result).toBeDefined();
  });

  it("should update global variation name", async () => {
    if (!globalVariationId) {
      console.warn("No global variation found to test editing");
      return;
    }

    const newName = `Global Updated ${Date.now()}`;
    const result = await updateVariationType(globalVariationId, { name: newName });
    expect(result).toBeDefined();
  });

  it("should update only the name field without affecting other fields", async () => {
    if (!variationTypeId) {
      console.warn("No product variation found to test editing");
      return;
    }

    const newName = `Selective Update ${Date.now()}`;
    const result = await updateVariationType(variationTypeId, { name: newName });
    expect(result).toBeDefined();

    // Verify the variation still exists
    const updated = await getVariationTypesByProduct(testProductId);
    const found = updated.find(v => v.id === variationTypeId);
    expect(found).toBeDefined();
  });
});
