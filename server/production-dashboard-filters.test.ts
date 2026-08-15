import { describe, expect, it } from "vitest";
import { filterAndSortProductionOrders } from "../client/src/lib/production-dashboard-filters";

const orders = [
  { orderNumber: "PD-100", status: "analisando", createdAt: "2026-08-01", totalPrice: "100" },
  { orderNumber: "PD-200", status: "em_producao", createdAt: "2026-08-03", totalPrice: "300" },
  { orderNumber: "PD-300", status: "analisando", createdAt: "2026-08-02", totalPrice: "200" },
];

describe("filtros do dashboard de produção", () => {
  it("filtra por número e status", () => {
    expect(filterAndSortProductionOrders(orders, { query: "300", status: "analisando", sort: "newest" }).map((order) => order.orderNumber)).toEqual(["PD-300"]);
  });

  it("ordena por maior valor sem alterar a fila selecionada", () => {
    expect(filterAndSortProductionOrders(orders, { query: "", status: "analisando", sort: "highest_value" }).map((order) => order.orderNumber)).toEqual(["PD-300", "PD-100"]);
  });
});
