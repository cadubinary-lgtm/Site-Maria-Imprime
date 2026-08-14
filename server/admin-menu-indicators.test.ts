import { describe, expect, it } from "vitest";
import { getAdminMenuIndicators } from "../client/src/lib/admin-menu-indicators";

describe("indicadores do menu administrativo", () => {
  it("distingue pedidos do dia, produção em andamento, catálogo e clientes com pedidos", () => {
    const indicators = getAdminMenuIndicators([
      { id: 1, createdAt: "2026-08-14T12:00:00.000Z", status: "em_producao", clientId: 10 },
      { id: 2, createdAt: "2026-08-14T15:00:00.000Z", status: "analisando", clientId: 10 },
      { id: 3, createdAt: "2026-08-13T12:00:00.000Z", status: "em_producao", clientId: 20 },
    ], 7, new Date("2026-08-14T15:00:00.000Z"));

    expect(indicators).toEqual({
      salesToday: 2,
      inProduction: 2,
      products: 7,
      customersWithOrders: 2,
    });
  });
});
