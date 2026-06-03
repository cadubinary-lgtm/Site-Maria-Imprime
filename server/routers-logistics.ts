import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { carriers, shippingRules, shipments, trackingEvents } from "../drizzle/schema";
import { eq, and, asc, desc } from "drizzle-orm";

/**
 * Logistics Router - Transportadoras, Regras de Frete, Expedições e Rastreamento
 */
export const logisticsRouter = router({
  // ─── Transportadoras (Carriers) ───
  carriers: router({
    list: publicProcedure.query(async () => {
      const db = getDb() as any;
      const result = await db.query.carriers.findMany({
        where: (carriers: any, { eq }: any) => eq(carriers.isActive, true),
        orderBy: (carriers: any, { asc }: any) => asc(carriers.name),
      });
      return result;
    }),

    create: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        apiProvider: z.string().optional(),
        apiKey: z.string().optional(),
        apiUrl: z.string().optional(),
        minWeight: z.number().optional(),
        maxWeight: z.number().optional(),
        baseRate: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.insert(carriers).values({
          name: input.name,
          code: input.code,
          apiProvider: input.apiProvider,
          apiKey: input.apiKey,
          apiUrl: input.apiUrl,
          minWeight: input.minWeight ? String(input.minWeight) : undefined,
          maxWeight: input.maxWeight ? String(input.maxWeight) : undefined,
          baseRate: input.baseRate ? String(input.baseRate) : undefined,
        });
        return result;
      }),

    update: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.update(carriers)
          .set({
            ...(input.name && { name: input.name }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
          })
          .where(eq(carriers.id, input.id));
        return result;
      }),
  }),

  // ─── Regras de Frete (Shipping Rules) ───
  shippingRules: router({
    listByCarrier: publicProcedure
      .input(z.object({ carrierId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.query.shippingRules.findMany({
          where: (rules: any, { eq, and }: any) => and(
            eq(rules.carrierId, input.carrierId),
            eq(rules.isActive, true)
          ),
        });
        return result;
      }),

    create: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        carrierId: z.number(),
        name: z.string(),
        cepFrom: z.string().optional(),
        cepTo: z.string().optional(),
        basePrice: z.number(),
        estimatedDays: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.insert(shippingRules).values({
          carrierId: input.carrierId,
          name: input.name,
          cepFrom: input.cepFrom,
          cepTo: input.cepTo,
          basePrice: String(input.basePrice),
          estimatedDays: input.estimatedDays,
        });
        return result;
      }),
  }),

  // ─── Expedições (Shipments) ───
  shipments: router({
    list: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "production") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .query(async () => {
        const db = getDb() as any;
        const result = await db.query.shipments.findMany({
          orderBy: (shipments: any, { desc }: any) => desc(shipments.createdAt),
          limit: 100,
        });
        return result;
      }),

    getByOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.query.shipments.findFirst({
          where: (shipments: any, { eq }: any) => eq(shipments.orderId, input.orderId),
        });
        return result;
      }),

    create: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        orderId: z.number(),
        carrierId: z.number(),
        trackingNumber: z.string(),
        weight: z.number(),
        shippingCost: z.number(),
        estimatedDeliveryDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.insert(shipments).values({
          orderId: input.orderId,
          carrierId: input.carrierId,
          trackingNumber: input.trackingNumber,
          weight: String(input.weight),
          shippingCost: String(input.shippingCost),
          estimatedDeliveryDate: input.estimatedDeliveryDate ? new Date(input.estimatedDeliveryDate) : undefined,
        });
        return result;
      }),

    updateStatus: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin" && ctx.user?.role !== "production") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return next({ ctx });
      })
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "shipped", "in_transit", "delivered", "failed"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.update(shipments)
          .set({ status: input.status })
          .where(eq(shipments.id, input.id));
        return result;
      }),
  }),

  // ─── Rastreamento (Tracking Events) ───
  tracking: router({
    getByShipment: publicProcedure
      .input(z.object({ shipmentId: z.number() }))
      .query(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.query.trackingEvents.findMany({
          where: (events: any, { eq }: any) => eq(events.shipmentId, input.shipmentId),
          orderBy: (events: any, { desc }: any) => desc(events.eventTime),
        });
        return result;
      }),

    addEvent: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        shipmentId: z.number(),
        status: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const result = await db.insert(trackingEvents).values({
          shipmentId: input.shipmentId,
          status: input.status,
          location: input.location,
          description: input.description,
          eventTime: new Date(),
        });
        return result;
      }),
  }),

  // ─── Status de Pedidos ───
  orders: router({
    updateProductionStatus: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "in_production", "quality_check", "ready_for_shipment"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const { orders } = await import("../drizzle/schema");
        const result = await db
          .update(orders)
          .set({ productionStatus: input.status })
          .where(eq(orders.id, input.orderId));
        return result;
      }),

    updateDeliveryStatus: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return next({ ctx });
      })
      .input(z.object({
        orderId: z.number(),
        status: z.enum(["pending", "shipped", "in_transit", "delivered", "failed"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDb() as any;
        const { orders } = await import("../drizzle/schema");
        const result = await db
          .update(orders)
          .set({ deliveryStatus: input.status })
          .where(eq(orders.id, input.orderId));
        return result;
      }),
  }),
});
