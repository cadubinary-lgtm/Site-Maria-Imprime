import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createClient,
  getClientById,
  listClients,
  updateClient,
  deleteClient,
  getClientStats,
  getTopClients,
  getClientsByType,
  getOperationalCrmDashboard,
  getTopCustomersLastTwoMonths,
  updateClientStats,
} from "./db-crm";
import { getDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";

/**
 * CRM Router - Gestão de Clientes
 */
export const crmRouter = router({
  /**
   * Criar novo cliente (admin only)
   */
  createClient: adminOrManusAuthProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        cpfCnpj: z.string().optional(),
        addressZipCode: z.string().optional(),
        addressStreet: z.string().optional(),
        addressNumber: z.string().optional(),
        addressComplement: z.string().optional(),
        addressNeighborhood: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().max(2).optional(),
        clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo", "site"]),
        priceTier: z.enum(["final", "reseller"]).optional(),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await createClient({ ...input, email: input.email?.trim() || undefined });
      return result;
    }),

  /**
   * Obter cliente por ID
   */
  getClientById: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await getClientById(input.clientId);
    }),

  /**
   * Listar clientes com paginação
   */
  listClients: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        clientType: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listClients(input);
    }),

  getOperationalDashboard: adminOrManusAuthProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        clientType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getOperationalCrmDashboard(input);
    }),

  getTopCustomersLastTwoMonths: adminOrManusAuthProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(30) }))
    .query(async ({ input }) => {
      return await getTopCustomersLastTwoMonths(input.limit);
    }),

  /**
   * Atualizar cliente (admin only)
   */
  updateClient: adminOrManusAuthProcedure
    .input(
      z.object({
        clientId: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo", "site"]).optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await updateClient(input.clientId, input.data);
    }),

  /**
   * Deletar cliente (soft delete - admin only)
   */
  deleteClient: adminOrManusAuthProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteClient(input.clientId);
    }),

  /**
   * Obter estatísticas de cliente
   */
  getClientStats: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await getClientStats(input.clientId);
    }),

  /**
   * Obter top clientes por volume
   */
  getTopClients: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return await getTopClients(input.limit);
    }),

  /**
   * Obter clientes por tipo
   */
  getClientsByType: protectedProcedure
    .input(
      z.object({
        clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo"]),
      })
    )
    .query(async ({ input }) => {
      return await getClientsByType(input.clientType);
    }),

  /**
   * Atualizar estatísticas do cliente (chamado internamente após novo pedido)
   */
  updateClientStats: adminOrManusAuthProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      return await updateClientStats(input.clientId);
    }),

  adminListBalcaoClients: adminOrManusAuthProcedure
    .input(z.object({
      search: z.string().optional(),
      clientType: z.string().optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const { clients } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const conditions: any[] = [eq(clients.isActive, true)];
      if (input.clientType) conditions.push(eq(clients.clientType, input.clientType as any));
      let rows = await db
        .select()
        .from(clients)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(clients.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      if (input.search) {
        const s = input.search.toLowerCase();
        rows = rows.filter((c: any) =>
          c.name?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.phone?.includes(s) ||
          c.cpfCnpj?.includes(s)
        );
      }
      return { clients: rows, total: rows.length };
    }),

  adminGetBalcaoClientDetail: adminOrManusAuthProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const { clients, orders } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const [client] = await db.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      const orderRows = await db
        .select()
        .from(orders)
        .where(eq(orders.clientId, input.clientId))
        .orderBy(desc(orders.createdAt))
        .limit(20);
      return { client, orders: orderRows };
    }),

  adminUpdateBalcaoClient: adminOrManusAuthProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().min(2),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      cpfCnpj: z.string().optional(),
      priceTier: z.enum(["final", "reseller"]),
      clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo"]),
      addressZipCode: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().max(2).optional(),
    }))
    .mutation(async ({ input }) => {
      const { clients } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      await db.update(clients).set({
        name: input.name.trim(),
        email: input.email?.trim().toLowerCase() || null,
        phone: input.phone?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
        cpfCnpj: input.cpfCnpj?.replace(/\D/g, "") || null,
        priceTier: input.priceTier,
        clientType: input.clientType,
        addressZipCode: input.addressZipCode?.replace(/\D/g, "") || null,
        addressStreet: input.addressStreet?.trim() || null,
        addressNumber: input.addressNumber?.trim() || null,
        addressComplement: input.addressComplement?.trim() || null,
        addressNeighborhood: input.addressNeighborhood?.trim() || null,
        addressCity: input.addressCity?.trim() || null,
        addressState: input.addressState?.trim().toUpperCase() || null,
      } as any).where(eq(clients.id, input.clientId));
      return { success: true };
    }),

  adminDeleteBalcaoClient: adminOrManusAuthProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      const { clients } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      await db.update(clients).set({ isActive: false } as any).where(eq(clients.id, input.clientId));
      return { success: true };
    }),

  adminToggleBalcaoPickup: adminOrManusAuthProcedure
    .input(z.object({ clientId: z.number(), allow: z.boolean() }))
    .mutation(async ({ input }) => {
      const { clients } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      await db.update(clients).set({ allowStorePickup: input.allow } as any).where(eq(clients.id, input.clientId));
      return { success: true };
    }),
});
