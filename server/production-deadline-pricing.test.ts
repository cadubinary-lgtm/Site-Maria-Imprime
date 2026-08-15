import { describe, expect, it } from "vitest";
import { getProductionDeadlineSurcharge } from "../client/src/lib/production-deadline-pricing";

describe("taxa de urgência por tipo de cobrança", () => {
  it("cobra a urgência por m² faturável", () => {
    expect(getProductionDeadlineSurcharge({ rate: 20, calculationType: "m2", billedArea: 3 })).toBe(60);
  });

  it("cobra a urgência por metro linear", () => {
    expect(getProductionDeadlineSurcharge({ rate: 20, calculationType: "metro_linear", linearMeters: 3 })).toBe(60);
  });

  it("mantém a taxa fixa por unidade e pacote", () => {
    expect(getProductionDeadlineSurcharge({ rate: 20, calculationType: "unidade" })).toBe(20);
    expect(getProductionDeadlineSurcharge({ rate: 20, calculationType: "pacote" })).toBe(20);
  });
});
