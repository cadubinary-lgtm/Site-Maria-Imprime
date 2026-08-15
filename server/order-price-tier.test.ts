import { describe, expect, it } from "vitest";

function getOrderPriceTier(priceTier: string | null | undefined) {
  return priceTier === "reseller" ? "reseller" : "final";
}

describe("perfil comercial em novos pedidos", () => {
  it("mantém a tabela final como padrão para pedidos sem cliente autenticado", () => {
    expect(getOrderPriceTier(null)).toBe("final");
    expect(getOrderPriceTier(undefined)).toBe("final");
  });

  it("identifica pedidos de clientes revendedores", () => {
    expect(getOrderPriceTier("reseller")).toBe("reseller");
  });
});
