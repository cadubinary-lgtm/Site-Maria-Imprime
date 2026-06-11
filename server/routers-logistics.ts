import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { carriers, shippingRules, shipments, trackingEvents } from "../drizzle/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import {
  generateAuthorizationUrl,
  getConnectionStatus,
  refreshAccessToken,
  saveTokensToCarrier,
} from "./melhorenvio-oauth";

/**
 * Logistics Router - Transportadoras, Regras de Frete, Expedições e Rastreamento
 */
export const logisticsRouter = router({
  // ─── Transportadoras (Carriers) ───
  carriers: router({
    list: publicProcedure.query(async () => {
      const db = await getDb() as any;
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
        // Correios
        cwsUser: z.string().optional(),
        cwsPassword: z.string().optional(),
        contractNumber: z.string().optional(),
        postalCardNumber: z.string().optional(),
        originCep: z.string().optional(),
        // Jadlog
        jadlogCnpj: z.string().optional(),
        jadlogToken: z.string().optional(),
        jadlogContaCorrente: z.string().optional(),
        jadlogCodigoFranquia: z.string().optional(),
        // Melhor Envio
        melhorEnvioClientId: z.string().optional(),
        melhorEnvioClientSecret: z.string().optional(),
        melhorEnvioAccessToken: z.string().optional(),
        melhorEnvioRefreshToken: z.string().optional(),
        melhorEnvioRedirectUri: z.string().optional(),
        melhorEnvioSandbox: z.boolean().optional(),
        // Frete Alternativo
        vehicleType: z.enum(["moto", "automovel"]).optional(),
        driverName: z.string().optional(),
        driverPhone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb() as any;
        // Construir apenas os campos com valores definidos e válidos
        const values: Record<string, any> = {
          name: input.name,
          code: input.code,
        };
        // Campos opcionais de texto — só incluir se definidos
        if (input.apiProvider !== undefined) values.apiProvider = input.apiProvider;
        if (input.apiKey !== undefined) values.apiKey = input.apiKey;
        if (input.apiUrl !== undefined) values.apiUrl = input.apiUrl;
        // Campos numéricos armazenados como string decimal
        if (input.minWeight !== undefined && input.minWeight !== null) values.minWeight = String(input.minWeight);
        if (input.maxWeight !== undefined && input.maxWeight !== null) values.maxWeight = String(input.maxWeight);
        if (input.baseRate !== undefined && input.baseRate !== null) values.baseRate = String(input.baseRate);
        // Correios
        if (input.cwsUser !== undefined) values.cwsUser = input.cwsUser;
        if (input.cwsPassword !== undefined) values.cwsPassword = input.cwsPassword;
        if (input.contractNumber !== undefined) values.contractNumber = input.contractNumber;
        if (input.postalCardNumber !== undefined) values.postalCardNumber = input.postalCardNumber;
        if (input.originCep !== undefined) values.originCep = input.originCep;
        // Jadlog
        if (input.jadlogCnpj !== undefined) values.jadlogCnpj = input.jadlogCnpj;
        if (input.jadlogToken !== undefined) values.jadlogToken = input.jadlogToken;
        if (input.jadlogContaCorrente !== undefined) values.jadlogContaCorrente = input.jadlogContaCorrente;
        if (input.jadlogCodigoFranquia !== undefined) values.jadlogCodigoFranquia = input.jadlogCodigoFranquia;
        // Melhor Envio — apenas campos de texto e boolean; NUNCA incluir campos bigint (expiresAt, connectedAt)
        if (input.melhorEnvioClientId !== undefined) values.melhorEnvioClientId = input.melhorEnvioClientId;
        if (input.melhorEnvioClientSecret !== undefined) values.melhorEnvioClientSecret = input.melhorEnvioClientSecret;
        if (input.melhorEnvioRedirectUri !== undefined) values.melhorEnvioRedirectUri = input.melhorEnvioRedirectUri;
        // boolean → tinyint(1): converter explicitamente para 0 ou 1
        if (input.melhorEnvioSandbox !== undefined) values.melhorEnvioSandbox = input.melhorEnvioSandbox ? 1 : 0;
        // Frete Alternativo
        if (input.vehicleType !== undefined) values.vehicleType = input.vehicleType;
        if (input.driverName !== undefined) values.driverName = input.driverName;
        if (input.driverPhone !== undefined) values.driverPhone = input.driverPhone;
        try {
          const result = await db.insert(carriers).values(values);
          return result;
        } catch (err: any) {
          if (err?.errno === 1062 || err?.message?.includes('Duplicate entry')) {
            throw new TRPCError({ code: "CONFLICT", message: `Já existe uma transportadora com o código "${input.code}". Use outro código ou edite a existente.` });
          }
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Erro ao criar transportadora" });
        }
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
        apiProvider: z.string().optional(),
        apiKey: z.string().optional(),
        apiUrl: z.string().optional(),
        minWeight: z.number().optional(),
        maxWeight: z.number().optional(),
        baseRate: z.number().optional(),
        cwsUser: z.string().optional(),
        cwsPassword: z.string().optional(),
        contractNumber: z.string().optional(),
        postalCardNumber: z.string().optional(),
        originCep: z.string().optional(),
        jadlogCnpj: z.string().optional(),
        jadlogToken: z.string().optional(),
        jadlogContaCorrente: z.string().optional(),
        jadlogCodigoFranquia: z.string().optional(),
        melhorEnvioClientId: z.string().optional(),
        melhorEnvioClientSecret: z.string().optional(),
        melhorEnvioAccessToken: z.string().optional(),
        melhorEnvioRefreshToken: z.string().optional(),
        melhorEnvioRedirectUri: z.string().optional(),
        melhorEnvioSandbox: z.boolean().optional(),
        vehicleType: z.enum(["moto", "automovel"]).optional(),
        driverName: z.string().optional(),
        driverPhone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb() as any;
        const { id, ...fields } = input;
        const updateData: Record<string, any> = {};
        if (fields.name !== undefined) updateData.name = fields.name;
        if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
        if (fields.apiProvider !== undefined) updateData.apiProvider = fields.apiProvider;
        if (fields.apiKey !== undefined) updateData.apiKey = fields.apiKey;
        if (fields.apiUrl !== undefined) updateData.apiUrl = fields.apiUrl;
        if (fields.minWeight !== undefined) updateData.minWeight = String(fields.minWeight);
        if (fields.maxWeight !== undefined) updateData.maxWeight = String(fields.maxWeight);
        if (fields.baseRate !== undefined) updateData.baseRate = String(fields.baseRate);
        if (fields.cwsUser !== undefined) updateData.cwsUser = fields.cwsUser;
        if (fields.cwsPassword !== undefined) updateData.cwsPassword = fields.cwsPassword;
        if (fields.contractNumber !== undefined) updateData.contractNumber = fields.contractNumber;
        if (fields.postalCardNumber !== undefined) updateData.postalCardNumber = fields.postalCardNumber;
        if (fields.originCep !== undefined) updateData.originCep = fields.originCep;
        if (fields.jadlogCnpj !== undefined) updateData.jadlogCnpj = fields.jadlogCnpj;
        if (fields.jadlogToken !== undefined) updateData.jadlogToken = fields.jadlogToken;
        if (fields.jadlogContaCorrente !== undefined) updateData.jadlogContaCorrente = fields.jadlogContaCorrente;
        if (fields.jadlogCodigoFranquia !== undefined) updateData.jadlogCodigoFranquia = fields.jadlogCodigoFranquia;
        if (fields.melhorEnvioClientId !== undefined) updateData.melhorEnvioClientId = fields.melhorEnvioClientId;
        if (fields.melhorEnvioClientSecret !== undefined) updateData.melhorEnvioClientSecret = fields.melhorEnvioClientSecret;
        if (fields.melhorEnvioAccessToken !== undefined) updateData.melhorEnvioAccessToken = fields.melhorEnvioAccessToken;
        if (fields.melhorEnvioRefreshToken !== undefined) updateData.melhorEnvioRefreshToken = fields.melhorEnvioRefreshToken;
        if (fields.melhorEnvioRedirectUri !== undefined) updateData.melhorEnvioRedirectUri = fields.melhorEnvioRedirectUri;
        if (fields.melhorEnvioSandbox !== undefined) updateData.melhorEnvioSandbox = fields.melhorEnvioSandbox ? 1 : 0;
        if (fields.vehicleType !== undefined) updateData.vehicleType = fields.vehicleType;
        if (fields.driverName !== undefined) updateData.driverName = fields.driverName;
        if (fields.driverPhone !== undefined) updateData.driverPhone = fields.driverPhone;
        const result = await db.update(carriers)
          .set(updateData)
          .where(eq(carriers.id, id));
        return result;
      }),
  }),

  // ─── Regras de Frete (Shipping Rules) ───
  shippingRules: router({
    listByCarrier: publicProcedure
      .input(z.object({ carrierId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
        const result = await db.query.shipments.findMany({
          orderBy: (shipments: any, { desc }: any) => desc(shipments.createdAt),
          limit: 100,
        });
        return result;
      }),

    getByOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
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
        const db = await getDb() as any;
        const { orders } = await import("../drizzle/schema");
        const result = await db
          .update(orders)
          .set({ deliveryStatus: input.status })
          .where(eq(orders.id, input.orderId));
        return result;
      }),
  }),

  // ─── Melhor Envio OAuth2 ───
  melhorEnvio: router({
    /**
     * Gera a URL de autorização OAuth2 para redirecionar o usuário ao Melhor Envio
     */
    getAuthUrl: adminOrManusAuthProcedure
      .input(z.object({ carrierId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb() as any;
        const carrier = await db.query.carriers.findFirst({
          where: eq(carriers.id, input.carrierId),
        });
        if (!carrier) throw new TRPCError({ code: "NOT_FOUND", message: "Transportadora não encontrada" });
        if (!carrier.melhorEnvioClientId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID não configurado. Salve a transportadora primeiro." });
        }
        const state = Buffer.from(JSON.stringify({ carrierId: input.carrierId })).toString('base64');
        // Sempre usar a URL fixa de produção — nunca depender de req.host ou valor corrompido do banco
        const FIXED_REDIRECT_URI = 'https://www.mariaimprime.com.br/api/melhorenvio/callback';
        const redirectUri = (carrier.melhorEnvioRedirectUri && carrier.melhorEnvioRedirectUri.startsWith('https://www.mariaimprime.com.br'))
          ? carrier.melhorEnvioRedirectUri
          : FIXED_REDIRECT_URI;
        const authUrl = generateAuthorizationUrl({
          clientId: carrier.melhorEnvioClientId,
          redirectUri,
          sandbox: false, // Sempre produção
          state,
        });
        return { authUrl, redirectUri };
      }),

    /**
     * Verifica o status da conexão com o Melhor Envio
     */
    getStatus: adminOrManusAuthProcedure
      .input(z.object({ carrierId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb() as any;
        const carrier = await db.query.carriers.findFirst({
          where: eq(carriers.id, input.carrierId),
        });
        if (!carrier) throw new TRPCError({ code: "NOT_FOUND", message: "Transportadora não encontrada" });
        return getConnectionStatus(carrier);
      }),

    /**
     * Renova manualmente o Access Token usando o Refresh Token
     */
    refreshToken: adminOrManusAuthProcedure
      .input(z.object({ carrierId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb() as any;
        const carrier = await db.query.carriers.findFirst({
          where: eq(carriers.id, input.carrierId),
        });
        if (!carrier) throw new TRPCError({ code: "NOT_FOUND", message: "Transportadora não encontrada" });
        if (!carrier.melhorEnvioRefreshToken) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Refresh Token não disponível. Reconecte ao Melhor Envio." });
        }
        try {
          const newTokens = await refreshAccessToken({
            refreshToken: carrier.melhorEnvioRefreshToken,
            clientId: carrier.melhorEnvioClientId ?? "",
            clientSecret: carrier.melhorEnvioClientSecret ?? "",
            redirectUri: carrier.melhorEnvioRedirectUri ?? "",
            sandbox: carrier.melhorEnvioSandbox ?? false,
          });
          await saveTokensToCarrier(input.carrierId, newTokens);
          return { success: true, message: "Token renovado com sucesso!" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido";
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Falha ao renovar token: ${msg}` });
        }
      }),

    /**
     * Desconecta o Melhor Envio removendo os tokens
     */
    disconnect: adminOrManusAuthProcedure
      .input(z.object({ carrierId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb() as any;
        await db
          .update(carriers)
          .set({
            melhorEnvioAccessToken: null,
            melhorEnvioRefreshToken: null,
            melhorEnvioAccessTokenExpiresAt: null,
            melhorEnvioRefreshTokenExpiresAt: null,
            melhorEnvioConnectedAt: null,
          })
          .where(eq(carriers.id, input.carrierId));
        return { success: true, message: "Desconectado do Melhor Envio com sucesso." };
      }),
  }),
});
