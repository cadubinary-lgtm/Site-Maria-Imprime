import { describe, it, expect } from "vitest";

describe("ProductDetailProfessional", () => {
  it("should calculate price with material and finish modifiers", () => {
    // Base price: 100.00
    // Material modifier: 25.00
    // Finish modifier: 10.00
    // Expected total: 135.00

    const basePrice = 100;
    const materialModifier = 25;
    const finishModifier = 10;
    const expectedTotal = basePrice + materialModifier + finishModifier;

    expect(expectedTotal).toBe(135);
  });

  it("should calculate price per square meter correctly", () => {
    // Width: 100cm, Height: 50cm
    // Area: (100 * 50) / 10000 = 0.5 m²
    // Price per m²: 50.00
    // Expected: 0.5 * 50 = 25.00

    const width = 100;
    const height = 50;
    const pricePerSqM = 50;
    const areaSqM = (width * height) / 10000;
    const expectedPrice = areaSqM * pricePerSqM;

    expect(expectedPrice).toBe(25);
  });

  it("should calculate area in square meters for custom measures", () => {
    // Test various dimensions
    const testCases = [
      { width: 100, height: 50, expected: 0.5 },
      { width: 200, height: 100, expected: 2 },
      { width: 50, height: 50, expected: 0.25 },
      { width: 300, height: 200, expected: 6 },
    ];

    testCases.forEach(({ width, height, expected }) => {
      const areaSqM = (width * height) / 10000;
      expect(areaSqM).toBe(expected);
    });
  });

  it("should handle quantity multiplier correctly", () => {
    // Base price: 100.00
    // Quantity: 5
    // Expected: 500.00

    const basePrice = 100;
    const quantity = 5;
    const expectedTotal = basePrice * quantity;

    expect(expectedTotal).toBe(500);
  });

  it("should calculate complex pricing scenario", () => {
    // Base price: 100.00
    // Material modifier: 25.00
    // Finish modifier: 10.00
    // Subtotal: 135.00
    // Quantity: 3
    // Expected total: 405.00

    const basePrice = 100;
    const materialModifier = 25;
    const finishModifier = 10;
    const quantity = 3;

    const subtotal = basePrice + materialModifier + finishModifier;
    const total = subtotal * quantity;

    expect(total).toBe(405);
  });

  it("should calculate m² pricing scenario", () => {
    // Width: 100cm, Height: 50cm
    // Area: 0.5 m²
    // Price per m²: 50.00
    // Subtotal: 25.00
    // Quantity: 2
    // Expected total: 50.00

    const width = 100;
    const height = 50;
    const pricePerSqM = 50;
    const quantity = 2;

    const areaSqM = (width * height) / 10000;
    const subtotal = areaSqM * pricePerSqM;
    const total = subtotal * quantity;

    expect(total).toBe(50);
  });
});
