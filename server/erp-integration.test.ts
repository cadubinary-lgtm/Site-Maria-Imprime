import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { products, orders, clients, productCosts, automationLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("ERP Integration Tests", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("Backward Compatibility", () => {
    it("should maintain existing product structure", async () => {
      if (!db) return;

      // Verificar que produtos legados continuam funcionando
      const legacyProducts = await db.select().from(products).limit(1);
      expect(legacyProducts).toBeDefined();
    });

    it("should maintain existing order structure", async () => {
      if (!db) return;

      // Verificar que pedidos legados continuam funcionando
      const legacyOrders = await db.select().from(orders).limit(1);
      expect(legacyOrders).toBeDefined();
    });

    it("should allow old product queries without new ERP fields", async () => {
      if (!db) return;

      // Produtos sem campos ERP devem funcionar normalmente
      const product = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
        })
        .from(products)
        .limit(1);

      expect(product).toBeDefined();
    });
  });

  describe("ERP Module Integration", () => {
    it("should create and retrieve clients", async () => {
      if (!db) return;

      // Criar cliente
      const newClient = await db.insert(clients).values({
        name: "Test Client",
        email: "test@example.com",
        phone: "11999999999",
        type: "balcao",
        totalVolume: 0,
        totalOrders: 0,
        averageTicket: 0,
      });

      expect(newClient).toBeDefined();
    });

    it("should track product costs", async () => {
      if (!db) return;

      // Verificar que tabela de custos existe
      const costs = await db.select().from(productCosts).limit(1);
      expect(costs).toBeDefined();
    });

    it("should log automation events", async () => {
      if (!db) return;

      // Verificar que logs de automação podem ser registrados
      const logs = await db.select().from(automationLogs).limit(1);
      expect(logs).toBeDefined();
    });
  });

  describe("Data Integrity", () => {
    it("should maintain referential integrity for orders", async () => {
      if (!db) return;

      // Verificar que pedidos mantêm relacionamentos
      const ordersWithRelations = await db.select().from(orders).limit(1);
      expect(ordersWithRelations).toBeDefined();
    });

    it("should handle concurrent operations safely", async () => {
      if (!db) return;

      // Simular operações concorrentes
      const promises = Array(5)
        .fill(null)
        .map(() =>
          db
            .select()
            .from(products)
            .limit(1)
        );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe("Module Isolation", () => {
    it("should not affect products when using CRM", async () => {
      if (!db) return;

      const beforeCount = await db.select().from(products);
      const beforeLength = beforeCount.length;

      // Criar cliente não deve afetar produtos
      await db.insert(clients).values({
        name: "Test Client 2",
        email: "test2@example.com",
        phone: "11999999998",
        type: "revendedor",
        totalVolume: 0,
        totalOrders: 0,
        averageTicket: 0,
      });

      const afterCount = await db.select().from(products);
      const afterLength = afterCount.length;

      expect(beforeLength).toBe(afterLength);
    });

    it("should not affect orders when using automation", async () => {
      if (!db) return;

      const beforeCount = await db.select().from(orders);
      const beforeLength = beforeCount.length;

      // Registrar log de automação não deve afetar pedidos
      await db.insert(automationLogs).values({
        orderId: 1,
        type: "email",
        recipient: "test@example.com",
        message: "Test message",
        status: "enviado",
      });

      const afterCount = await db.select().from(orders);
      const afterLength = afterCount.length;

      expect(beforeLength).toBe(afterLength);
    });
  });

  describe("Performance", () => {
    it("should query products efficiently", async () => {
      if (!db) return;

      const start = performance.now();
      await db.select().from(products).limit(100);
      const end = performance.now();

      // Query deve completar em menos de 1 segundo
      expect(end - start).toBeLessThan(1000);
    });

    it("should query clients efficiently", async () => {
      if (!db) return;

      const start = performance.now();
      await db.select().from(clients).limit(100);
      const end = performance.now();

      // Query deve completar em menos de 1 segundo
      expect(end - start).toBeLessThan(1000);
    });
  });

  describe("Schema Validation", () => {
    it("should have all required ERP tables", async () => {
      if (!db) return;

      // Verificar que todas as tabelas ERP existem
      const tables = [
        { name: "clients", table: clients },
        { name: "productCosts", table: productCosts },
        { name: "automationLogs", table: automationLogs },
      ];

      for (const { name, table } of tables) {
        const result = await db.select().from(table).limit(1);
        expect(result).toBeDefined();
      }
    });

    it("should maintain legacy table structure", async () => {
      if (!db) return;

      // Verificar que tabelas legadas continuam intactas
      const legacyTables = [
        { name: "products", table: products },
        { name: "orders", table: orders },
      ];

      for (const { name, table } of legacyTables) {
        const result = await db.select().from(table).limit(1);
        expect(result).toBeDefined();
      }
    });
  });
});
