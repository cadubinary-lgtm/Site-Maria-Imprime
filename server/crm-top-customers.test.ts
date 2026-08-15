import { describe, expect, it } from "vitest";
import { getTwoMonthsAgo, rankTopCustomersLastTwoMonths } from "./crm-top-customers";

describe("ranking de clientes por compras recentes", () => {
  const now = new Date("2026-08-15T12:00:00.000Z");
  const customers = [
    { key: "crm:1", id: 1, source: "crm" as const, name: "Cliente Balcão", clientType: "balcao" as const },
    { key: "site:2", id: -2, source: "site" as const, externalId: 2, name: "Cliente Site", clientType: "site" as const },
    { key: "site:3", id: -3, source: "site" as const, externalId: 3, name: "Compra Antiga", clientType: "site" as const },
  ];

  it("considera apenas pedidos a partir do corte de dois meses", () => {
    expect(getTwoMonthsAgo(now).toISOString()).toBe("2026-06-15T12:00:00.000Z");
    const ranking = rankTopCustomersLastTwoMonths(customers, [
      { customerKey: "crm:1", totalPrice: "120", createdAt: "2026-07-10T12:00:00.000Z" },
      { customerKey: "site:2", totalPrice: "200", createdAt: "2026-08-10T12:00:00.000Z" },
      { customerKey: "site:3", totalPrice: "900", createdAt: "2026-05-10T12:00:00.000Z" },
    ], { now });

    expect(ranking.map((customer) => customer.name)).toEqual(["Cliente Site", "Cliente Balcão"]);
  });

  it("soma pedidos do mesmo cliente e respeita o limite solicitado", () => {
    const ranking = rankTopCustomersLastTwoMonths(customers, [
      { customerKey: "crm:1", totalPrice: "120", createdAt: "2026-07-10T12:00:00.000Z" },
      { customerKey: "crm:1", totalPrice: "150", createdAt: "2026-08-12T12:00:00.000Z" },
      { customerKey: "site:2", totalPrice: "200", createdAt: "2026-08-10T12:00:00.000Z" },
    ], { now, limit: 1 });

    expect(ranking).toHaveLength(1);
    expect(ranking[0]).toMatchObject({ name: "Cliente Balcão", totalVolume: 270, totalOrders: 2 });
  });
});
