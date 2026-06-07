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

  // ─── Cálculo de Frete no Checkout ───
  checkout: router({
    calculateShippingMethods: publicProcedure
      .input(z.object({
        zipCode: z.string(),
        cartItems: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
        })),
      }))
      .query(async ({ input }) => {
        console.log("[calculateShippingMethods] Input:", input);
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        const db = dbInstance as any;
        
        // Buscar produtos do carrinho com informações logísticas
        console.log("[calculateShippingMethods] Buscando produtos com IDs:", input.cartItems.map((item: any) => item.productId));
        const cartProducts = await (db as any).query.products.findMany({
          where: (products: any, { inArray }: any) => 
            inArray(products.id, input.cartItems.map((item: any) => item.productId)),
        });

        console.log("[calculateShippingMethods] Produtos encontrados:", cartProducts?.length);
        if (!cartProducts || cartProducts.length === 0) {
          console.error("[calculateShippingMethods] ERRO: Nenhum produto encontrado");
          // Retornar lista vazia ao invés de erro
          return {
            zipCode: input.zipCode,
            totalWeight: 0,
            totalVolume: 0,
            shippingMethods: [],
          };
        }

        // Calcular peso e volume totais
        let totalWeight = 0;
        let totalVolume = 0;
        let allowedCarriers = new Set<number>();
        let allowPickup = true;
        let allowMotoExpress = true;

        for (const cartItem of input.cartItems) {
          const product = cartProducts.find((p: any) => p.id === cartItem.productId);
          if (!product) continue;

          // Somar peso (em kg)
          const weight = product.weight ? parseFloat(String(product.weight)) : 0;
          totalWeight += weight * cartItem.quantity;

          // Somar volume (em cm³)
          const height = product.height ? parseFloat(String(product.height)) : 0;
          const width = product.width ? parseFloat(String(product.width)) : 0;
          const length = product.length ? parseFloat(String(product.length)) : 0;
          totalVolume += (height * width * length) * cartItem.quantity;

          // Verificar transportadoras permitidas
          if (product.allowedCarriers) {
            const carriers = JSON.parse(String(product.allowedCarriers));
            if (allowedCarriers.size === 0) {
              carriers.forEach((c: number) => allowedCarriers.add(c));
            } else {
              // Interseção: apenas transportadoras permitidas em TODOS os produtos
              const intersection = new Set<number>();
              carriers.forEach((c: number) => {
                if (allowedCarriers.has(c)) intersection.add(c);
              });
              allowedCarriers = intersection;
            }
          }

          // Verificar se permite retirada
          if (product.allowPickup === false) allowPickup = false;
          if (product.allowMotoExpress === false) allowMotoExpress = false;
        }

        // Construir lista de métodos de entrega
        const shippingMethods: any[] = [];

        // 1. Retirada na Loja (sempre disponível se permitido)
        if (allowPickup) {
          shippingMethods.push({
            id: "pickup",
            name: "Retirada na Loja",
            description: "Retire na nossa loja",
            price: 0,
            estimatedDays: 0,
            estimatedHours: 0,
            initialStatus: "awaiting_pickup",
          });
        }

        // 2. Moto Express (se permitido e CEP válido)
        if (allowMotoExpress) {
          // Buscar regras de frete para Moto Express
          const motoRules = await (db as any).query.shippingRules.findMany({
            where: (rules: any, { eq }: any) => eq(rules.carrierId, 0), // 0 = Moto Express
          });

          if (motoRules && motoRules.length > 0) {
            // Calcular distância baseada no CEP (simplificado: usar primeira regra)
            const rule = motoRules[0];
            const price = rule.basePrice ? parseFloat(String(rule.basePrice)) : 10;
            const estimatedHours = rule.estimatedDays ? parseInt(String(rule.estimatedDays)) : 2;

            shippingMethods.push({
              id: "moto_express",
              name: "Moto Express",
              description: `Entrega em até ${estimatedHours} horas`,
              price: price,
              estimatedDays: 0,
              estimatedHours: estimatedHours,
              initialStatus: "awaiting_pickup",
            });
          }
        }

        // 3. Transportadoras (se houver permitidas)
        if (allowedCarriers.size > 0) {
          const activeCarriers = await (db as any).query.carriers.findMany({
            where: (carriers: any, { inArray }: any) => 
              inArray(carriers.id, Array.from(allowedCarriers)),
          });

          for (const carrier of activeCarriers) {
            // Buscar regras de frete para esta transportadora
            const carrierRules = await (db as any).query.shippingRules.findMany({
              where: (rules: any, { eq }: any) => eq(rules.carrierId, carrier.id),
            });

            if (carrierRules && carrierRules.length > 0) {
              const rule = carrierRules[0];
              const price = rule.basePrice ? parseFloat(String(rule.basePrice)) : 0;
              const estimatedDays = rule.estimatedDays ? parseInt(String(rule.estimatedDays)) : 5;

              shippingMethods.push({
                id: `carrier_${carrier.id}`,
                carrierId: carrier.id,
                name: carrier.name,
                description: `Entrega em até ${estimatedDays} dias úteis`,
                price: price,
                estimatedDays: estimatedDays,
                estimatedHours: 0,
                initialStatus: "awaiting_pickup",
              });
            }
          }
        }

        console.log("[calculateShippingMethods] Retornando:", {
          zipCode: input.zipCode,
          totalWeight,
          totalVolume,
          shippingMethodsCount: shippingMethods.length,
          shippingMethods: shippingMethods.map(m => ({ id: m.id, name: m.name, price: m.price })),
        });
        return {
          zipCode: input.zipCode,
          totalWeight,
          totalVolume,
          shippingMethods,
        };
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
