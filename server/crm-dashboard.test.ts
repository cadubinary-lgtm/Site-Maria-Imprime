import { describe, expect, it } from "vitest";
import { aggregateCrmDashboardClients, summarizeCrmDashboard, toSiteDashboardClients } from "./crm-dashboard";

describe("consolidação operacional do Dashboard de CRM", () => {
  const now = new Date("2026-08-15T12:00:00.000Z");

  it("mantém os pedidos e produtos vinculados exclusivamente ao respectivo cliente", () => {
    const clients = [{ id: 1, name: "Ana" }, { id: 2, name: "Bruno" }, { id: 3, name: "Carla" }];
    const orders = [
      { clientId: 1, totalPrice: "120.50", createdAt: new Date("2026-08-10T10:00:00.000Z") },
      { clientId: 1, totalPrice: "79.50", createdAt: new Date("2026-06-01T10:00:00.000Z") },
      { clientId: 2, totalPrice: "200.00", createdAt: new Date("2026-04-01T10:00:00.000Z") },
    ];
    const items = [
      { clientId: 1, productName: "Banner", quantity: 2 },
      { clientId: 1, productName: "Cartão", quantity: 100 },
      { clientId: 2, productName: "Adesivo", quantity: 4 },
    ];

    const result = aggregateCrmDashboardClients(clients, orders, items, now);

    expect(result[0]).toMatchObject({ totalOrders: 2, totalVolume: 200, operationalStatus: "ativo" });
    expect(result[0].products).toEqual([{ name: "Cartão", totalQuantity: 100 }, { name: "Banner", totalQuantity: 2 }]);
    expect(result[1]).toMatchObject({ totalOrders: 1, totalVolume: 200, operationalStatus: "atencao" });
    expect(result[1].products).toEqual([{ name: "Adesivo", totalQuantity: 4 }]);
    expect(result[2]).toMatchObject({ totalOrders: 0, operationalStatus: "sem_compras", products: [] });
  });

  it("resume filas operacionais sem contar compras de outro cliente", () => {
    const clients = aggregateCrmDashboardClients(
      [{ id: 1, name: "Ana" }, { id: 2, name: "Bruno" }, { id: 3, name: "Carla" }],
      [
        { clientId: 1, totalPrice: 100, createdAt: new Date("2026-08-01T10:00:00.000Z") },
        { clientId: 2, totalPrice: 50, createdAt: new Date("2026-01-01T10:00:00.000Z") },
      ],
      [],
      now,
    );

    expect(summarizeCrmDashboard(clients)).toMatchObject({
      totalClients: 3,
      clientsWithPurchases: 2,
      activeClients: 1,
      attentionQueue: 1,
      clientsWithoutPurchases: 1,
      totalVolume: 150,
    });
  });

  it("inclui Clientes Site usando customerId sem colidir com IDs do CRM legado", () => {
    const siteClients = toSiteDashboardClients([{
      id: 150001,
      firstName: "Carlos",
      lastName: "Cliente Site",
      email: "carlos@site.test",
      phone: null,
      cpfCnpj: null,
      status: "active",
      createdAt: now.getTime(),
    }]);

    const result = aggregateCrmDashboardClients(
      siteClients,
      [{ clientId: -150001, totalPrice: 266, createdAt: new Date("2026-08-14T10:00:00.000Z") }],
      [{ clientId: -150001, productName: "Banner", quantity: 2 }],
      now,
    );

    expect(result[0]).toMatchObject({ source: "site", externalId: 150001, totalOrders: 1, totalVolume: 266 });
    expect(result[0].products).toEqual([{ name: "Banner", totalQuantity: 2 }]);
  });
});
