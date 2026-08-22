import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc.js";
import { adminOrManusAuthProcedure } from "./routers-admin-auth.js";
import { getDb } from "./db.js";
import { globalDeliveryOptions } from "../drizzle/schema.js";
import { eq, asc } from "drizzle-orm";

export const globalDeliveryOptionsRouter = router({
  // Lista todos os prazos globais (público para uso no formulário de novo produto)
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(globalDeliveryOptions).orderBy(asc(globalDeliveryOptions.order), asc(globalDeliveryOptions.id));
  }),

  // Cria um novo prazo global
  create: adminOrManusAuthProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      daysToDeliver: z.number().int().min(0),
      pricePerM2: z.number().min(0).default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(globalDeliveryOptions).orderBy(asc(globalDeliveryOptions.order));
      const nextOrder = existing.length > 0 ? Math.max(...existing.map(r => r.order)) + 1 : 0;
      const [result] = await db.insert(globalDeliveryOptions).values({
        name: input.name,
        daysToDeliver: input.daysToDeliver,
        pricePerM2: String(input.pricePerM2),
        isActive: input.isActive,
        order: nextOrder,
      });
      return { id: (result as any).insertId };
    }),

  // Atualiza um prazo global
  update: adminOrManusAuthProcedure
    .input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      daysToDeliver: z.number().int().min(0).optional(),
      pricePerM2: z.number().min(0).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...fields } = input;
      const updateData: Record<string, any> = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.daysToDeliver !== undefined) updateData.daysToDeliver = fields.daysToDeliver;
      if (fields.pricePerM2 !== undefined) updateData.pricePerM2 = String(fields.pricePerM2);
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      await db.update(globalDeliveryOptions).set(updateData).where(eq(globalDeliveryOptions.id, id));
      return { success: true };
    }),

  // Remove um prazo global
  remove: adminOrManusAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(globalDeliveryOptions).where(eq(globalDeliveryOptions.id, input.id));
      return { success: true };
    }),

  // Reordena os prazos globais
  reorder: adminOrManusAuthProcedure
    .input(z.object({ orderedIds: z.array(z.number().int().positive()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await Promise.all(
        input.orderedIds.map((id, index) =>
          db.update(globalDeliveryOptions).set({ order: index }).where(eq(globalDeliveryOptions.id, id))
        )
      );
      return { success: true };
    }),
});
