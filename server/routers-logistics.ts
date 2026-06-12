/**
 * Módulo de Logística — Melhor Envio API v2
 *
 * Sub-routers:
 *  - logistics.settings   → configurações (token, email, CEP, sandbox)
 *  - logistics.carriers   → transportadoras sincronizadas do ME
 *  - logistics.shipping   → cálculo de frete
 *  - logistics.shipments  → expedições e etiquetas
 *  - logistics.tracking   → rastreamento
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { logisticsSettings, carriers, shipments, orders, localDeliveryRules } from "../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";
import {
  getMeProfile,
  listShipmentCompanies,
  calculateShipping,
  addToCart,
  checkoutShipment,
  printLabel,
  trackShipment,
  type CalculateShippingInput,
  type MeCartItem,
} from "./melhorenvio-api";

// Middleware: apenas admin pode acessar o módulo de logística
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// Helper: garante conexão com o banco
async function requireDb(): Promise<NonNullable<Awaited<ReturnType<typeof getDb>>>> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db as NonNullable<typeof db>;
}

// Helper: busca as configurações salvas
async function getSettings() {
  const db = await requireDb();
  const rows = await db.select().from(logisticsSettings).limit(1);
  return rows[0] ?? null;
}

async function requireSettings() {
  const s = await getSettings();
  if (!s?.accessToken) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Token do Melhor Envio não configurado. Acesse Logística → Configurações.",
    });
  }
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// settings router
// ─────────────────────────────────────────────────────────────────────────────

const settingsRouter = router({
  get: adminProcedure.query(async () => {
    const s = await getSettings();
    if (!s) return null;
    return {
      ...s,
      accessToken: s.accessToken ? "***SAVED***" : null,
      hasToken: !!s.accessToken,
    };
  }),

  save: adminProcedure
    .input(
      z.object({
        accessToken: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        originCep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos").optional(),
        senderName: z.string().optional(),
        senderPhone: z.string().optional(),
        senderDocument: z.string().optional(),
        senderAddress: z.string().optional(),
        senderNumber: z.string().optional(),
        senderComplement: z.string().optional(),
        senderDistrict: z.string().optional(),
        senderCity: z.string().optional(),
        senderStateAbbr: z.string().max(2).optional(),
        sandbox: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const existing = await getSettings();

      const tokenToSave =
        input.accessToken && input.accessToken !== "***SAVED***"
          ? input.accessToken
          : existing?.accessToken ?? null;

      const data = {
        accessToken: tokenToSave,
        email: input.email || existing?.email || null,
        originCep: input.originCep ?? existing?.originCep ?? null,
        senderName: input.senderName ?? existing?.senderName ?? null,
        senderPhone: input.senderPhone ?? existing?.senderPhone ?? null,
        senderDocument: input.senderDocument ?? existing?.senderDocument ?? null,
        senderAddress: input.senderAddress ?? existing?.senderAddress ?? null,
        senderNumber: input.senderNumber ?? existing?.senderNumber ?? null,
        senderComplement: input.senderComplement ?? existing?.senderComplement ?? null,
        senderDistrict: input.senderDistrict ?? existing?.senderDistrict ?? null,
        senderCity: input.senderCity ?? existing?.senderCity ?? null,
        senderStateAbbr: input.senderStateAbbr ?? existing?.senderStateAbbr ?? null,
        sandbox: input.sandbox ?? existing?.sandbox ?? true,
      };

      if (existing) {
        await db.update(logisticsSettings).set(data).where(eq(logisticsSettings.id, existing.id));
      } else {
        await db.insert(logisticsSettings).values(data);
      }

      return { success: true };
    }),

  testConnection: adminProcedure.mutation(async () => {
    const s = await requireSettings();
    try {
      const profile = await getMeProfile(s.accessToken!, s.sandbox);
      return {
        success: true,
        user: `${profile.firstname} ${profile.lastname} (${profile.email})`,
        sandbox: s.sandbox,
      };
    } catch (err: any) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Falha na conexão: ${err.message}`,
      });
    }
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// carriers router
// ─────────────────────────────────────────────────────────────────────────────

const carriersRouter = router({
  list: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select().from(carriers).orderBy(carriers.name);
  }),

  sync: adminProcedure.mutation(async () => {
    const db = await requireDb();
    const s = await requireSettings();
    const companies = await listShipmentCompanies(s.accessToken!, s.sandbox);

    let created = 0;
    let updated = 0;

    for (const company of companies) {
      const code = company.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      const existing = await db
        .select()
        .from(carriers)
        .where(eq(carriers.companyId, company.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(carriers)
          .set({ name: company.name, logoUrl: company.picture })
          .where(eq(carriers.companyId, company.id));
        updated++;
      } else {
        await db.insert(carriers).values({
          companyId: company.id,
          name: company.name,
          code,
          logoUrl: company.picture,
          isActive: true,
        });
        created++;
      }
    }

    return { success: true, created, updated, total: companies.length };
  }),

  toggle: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db
        .update(carriers)
        .set({ isActive: input.isActive })
        .where(eq(carriers.id, input.id));
      return { success: true };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// shipping router (cálculo de frete)
// ─────────────────────────────────────────────────────────────────────────────

const shippingRouter = router({
  // Cálculo público de frete — acessível por clientes e visitantes
  calculate: publicProcedure
    .input(
      z.object({
        destinationCep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
        weight: z.number().positive().default(1),
        height: z.number().positive().default(5),
        width: z.number().positive().default(30),
        length: z.number().positive().default(40),
        insuranceValue: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      // 1. Opção fixa: Retirar na Loja (sempre disponível)
      const results: Array<{
        id: string | number;
        name: string;
        company: string;
        logoUrl: string | null;
        price: number;
        deliveryDays: number;
        isFixed: boolean;
        fixedType?: string;
      }> = [
        {
          id: "retirada",
          name: "Retirar na Loja",
          company: "Retirada Presencial",
          logoUrl: null,
          price: 0,
          deliveryDays: 0,
          isFixed: true,
          fixedType: "pickup",
        },
      ];

      // 2. Verificar regras de entrega local por faixa de CEP
      // Busca regras onde o CEP do cliente está dentro da faixa (cepStart <= cep <= cepEnd)
      try {
        const cepClean = input.destinationCep.replace(/\D/g, "");
        const cepNum = parseInt(cepClean, 10);

        // Buscar regras ativas onde o CEP está na faixa
        const localRules = await db.select().from(localDeliveryRules).where(eq(localDeliveryRules.isActive, true));

        for (const rule of localRules) {
          const ruleStart = parseInt(rule.cepStart, 10);
          const ruleEnd = parseInt(rule.cepEnd, 10);

          // Verificar se o CEP do cliente está dentro da faixa
          if (cepNum >= ruleStart && cepNum <= ruleEnd) {
            results.push({
              id: `local_${rule.id}`,
              name: rule.description || `Entrega Local - ${rule.deliveryType === "moto" ? "Moto" : "Carro"}`,
              company: "Entrega Local",
              logoUrl: null,
              price: parseFloat(rule.price as any),
              deliveryDays: rule.deliveryDays,
              isFixed: true,
              fixedType: "local",
            });
          }
        }
      } catch (_) {
        // Silencioso: falha na validação de CEP não bloqueia o cálculo
      }

      // 3. Cotações do Melhor Envio (se token configurado)
      try {
        const s = await getSettings();
        if (s?.accessToken && s.originCep) {
          const payload: CalculateShippingInput = {
            from: { postal_code: s.originCep },
            to: { postal_code: input.destinationCep },
            package: {
              height: input.height,
              width: input.width,
              length: input.length,
              weight: input.weight,
            },
            options: {
              insurance_value: input.insuranceValue ?? 0,
              receipt: false,
              own_hand: false,
            },
          };
          const quotes = await calculateShipping(s.accessToken, s.sandbox, payload);
          for (const q of quotes) {
            if (!q.error) {
              results.push({
                id: q.id,
                name: q.name,
                company: q.company.name,
                logoUrl: q.company.picture ?? null,
                price: parseFloat(q.custom_price || q.price),
                deliveryDays: q.custom_delivery_time || q.delivery_time,
                isFixed: false,
              });
            }
          }
        }
      } catch (_) {
        // Silencioso: falha no ME não bloqueia as opções fixas
      }

      return results;
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// localRules router (CRUD de regras de entrega local por cidade)
// ─────────────────────────────────────────────────────────────────────────────

const localRulesRouter = router({
  list: adminProcedure.query(async () => {
    const db = await requireDb();
    const rules = await db.select().from(localDeliveryRules).orderBy(localDeliveryRules.neighborhood);
    return rules.map((r) => ({
      id: r.id,
      neighborhood: r.neighborhood,
      stateAbbr: r.stateAbbr,
      cepStart: r.cepStart,
      cepEnd: r.cepEnd,
      deliveryType: r.deliveryType,
      price: parseFloat(r.price as any),
      deliveryDays: r.deliveryDays,
      description: r.description,
      isActive: r.isActive,
    }));
  }),

  create: adminProcedure
    .input(
      z.object({
        neighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres"),
        stateAbbr: z.string().length(2, "UF deve ter 2 caracteres"),
        // Aceita CEP com ou sem traço — limpeza feita no handler
        cepStart: z.string(),
        cepEnd: z.string(),
        deliveryType: z.enum(["moto", "carro"]),
        price: z.number().min(0, "Preço não pode ser negativo"),
        deliveryDays: z.number().int().min(0).default(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      // Limpar CEP de qualquer caractere não-numérico (traço, ponto, espaço, etc.)
      const cepStart = input.cepStart.replace(/\D/g, "");
      const cepEnd = input.cepEnd.replace(/\D/g, "");
      if (cepStart.length !== 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CEP Inicial deve ter 8 dígitos" });
      }
      if (cepEnd.length !== 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CEP Final deve ter 8 dígitos" });
      }
      if (cepStart > cepEnd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CEP Inicial deve ser menor ou igual ao CEP Final",
        });
      }
      const result = await db.insert(localDeliveryRules).values({
        neighborhood: input.neighborhood,
        stateAbbr: input.stateAbbr.toUpperCase(),
        cepStart,
        cepEnd,
        deliveryType: input.deliveryType,
        price: input.price.toFixed(2) as any,
        deliveryDays: input.deliveryDays,
        // Texto padrão só na criação, nunca sobrescreve na edição
        description: input.description || `Entrega Local - ${input.deliveryType === "moto" ? "Moto" : "Carro"}`,
        isActive: input.isActive,
      });
      return { id: (result as any).insertId, success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        neighborhood: z.string().min(2).optional(),
        stateAbbr: z.string().length(2).optional(),
        // Aceita CEP com ou sem traço — limpeza feita no handler
        cepStart: z.string().optional(),
        cepEnd: z.string().optional(),
        deliveryType: z.enum(["moto", "carro"]).optional(),
        price: z.number().min(0).optional(),
        deliveryDays: z.number().int().min(0).optional(),
        // Aceita string vazia para limpar o campo (nullable)
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const { id, ...rest } = input;
      // Limpar CEP de qualquer caractere não-numérico (traço, ponto, etc.)
      const cepStartClean = rest.cepStart ? rest.cepStart.replace(/\D/g, "") : undefined;
      const cepEndClean = rest.cepEnd ? rest.cepEnd.replace(/\D/g, "") : undefined;
      if (cepStartClean && cepStartClean.length !== 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CEP Inicial deve ter 8 dígitos" });
      }
      if (cepEndClean && cepEndClean.length !== 8) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CEP Final deve ter 8 dígitos" });
      }
      if (cepStartClean && cepEndClean && cepStartClean > cepEndClean) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CEP Inicial deve ser menor ou igual ao CEP Final",
        });
      }
      const updateData: any = {};
      if (rest.neighborhood !== undefined) updateData.neighborhood = rest.neighborhood;
      if (rest.stateAbbr !== undefined) updateData.stateAbbr = rest.stateAbbr.toUpperCase();
      if (cepStartClean !== undefined) updateData.cepStart = cepStartClean;
      if (cepEndClean !== undefined) updateData.cepEnd = cepEndClean;
      if (rest.deliveryType !== undefined) updateData.deliveryType = rest.deliveryType;
      if (rest.price !== undefined) updateData.price = rest.price.toFixed(2);
      if (rest.deliveryDays !== undefined) updateData.deliveryDays = rest.deliveryDays;
      // description: atualiza sempre que presente (inclusive string vazia para limpar)
      if (rest.description !== undefined) updateData.description = rest.description === "" ? null : rest.description;
      if (rest.isActive !== undefined) updateData.isActive = rest.isActive;
      await db.update(localDeliveryRules).set(updateData).where(eq(localDeliveryRules.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db.delete(localDeliveryRules).where(eq(localDeliveryRules.id, input.id));
      return { success: true };
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// shipments router (expedição / etiquetas)
// ─────────────────────────────────────────────────────────────────────────────

const shipmentsRouter = router({
  // Lista pedidos com status 'pronto_entrega' que ainda não têm expedição criada
  listPendingOrders: adminProcedure.query(async () => {
    const db = await requireDb();
    // Busca IDs de pedidos que já têm expedição
    const existingShipments = await db
      .select({ orderId: shipments.orderId })
      .from(shipments);
    const existingOrderIds = existingShipments
      .map((s: any) => s.orderId)
      .filter((id: any): id is number => id != null);
    // Busca pedidos prontos para entrega
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "pronto_entrega"));
    // Filtra os que ainda não têm expedição
    return pendingOrders.filter((o: any) => !existingOrderIds.includes(o.id));
  }),

  list: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(shipments)
        .orderBy(shipments.createdAt)
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);
    }),

  create: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        serviceId: z.number(),
        serviceName: z.string(),
        companyName: z.string(),
        price: z.number(),
        estimatedDelivery: z.string().optional(),
        recipientName: z.string(),
        recipientPhone: z.string(),
        recipientEmail: z.string(),
        recipientDocument: z.string(),
        recipientAddress: z.string(),
        recipientNumber: z.string(),
        recipientComplement: z.string().optional(),
        recipientDistrict: z.string(),
        recipientCity: z.string(),
        recipientStateAbbr: z.string().max(2),
        recipientCep: z.string().regex(/^\d{8}$/),
        products: z.array(
          z.object({ name: z.string(), quantity: z.number(), unitaryValue: z.number() })
        ),
        weight: z.number(),
        height: z.number(),
        width: z.number(),
        length: z.number(),
        insuranceValue: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const s = await requireSettings();

      if (!s.originCep || !s.senderName) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Dados do remetente incompletos. Configure em Logística → Configurações.",
        });
      }

      const cartItem: MeCartItem = {
        name: `Pedido #${input.orderId}`,
        service: input.serviceId,
        from: {
          name: s.senderName!,
          phone: s.senderPhone ?? "",
          email: s.email ?? "",
          document: s.senderDocument ?? "",
          address: s.senderAddress ?? "",
          number: s.senderNumber ?? "S/N",
          complement: s.senderComplement ?? "",
          district: s.senderDistrict ?? "",
          city: s.senderCity ?? "",
          country_id: "BR",
          postal_code: s.originCep,
          state_abbr: s.senderStateAbbr ?? "",
        },
        to: {
          name: input.recipientName,
          phone: input.recipientPhone,
          email: input.recipientEmail,
          document: input.recipientDocument,
          address: input.recipientAddress,
          number: input.recipientNumber,
          complement: input.recipientComplement ?? "",
          district: input.recipientDistrict,
          city: input.recipientCity,
          country_id: "BR",
          postal_code: input.recipientCep,
          state_abbr: input.recipientStateAbbr,
        },
        products: input.products.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unitary_value: p.unitaryValue,
        })),
        volumes: [
          {
            height: input.height,
            width: input.width,
            length: input.length,
            weight: input.weight,
          },
        ],
        options: {
          insurance_value: input.insuranceValue ?? 0,
          receipt: false,
          own_hand: false,
        },
      };

      const cartResponse = await addToCart(s.accessToken!, s.sandbox, cartItem);

      const [inserted] = await db.insert(shipments).values({
        orderId: input.orderId,
        meOrderId: cartResponse.id,
        serviceId: input.serviceId,
        serviceName: input.serviceName,
        companyName: input.companyName,
        price: String(input.price),
        estimatedDelivery: input.estimatedDelivery ?? null,
        status: "cart",
      });

      return {
        success: true,
        meOrderId: cartResponse.id,
        shipmentId: (inserted as any).insertId,
      };
    }),

  checkout: adminProcedure
    .input(z.object({ shipmentId: z.number() }))
        .mutation(async ({ input }) => {
      const db = await requireDb();
      const s = await requireSettings();
      const rows = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, input.shipmentId))
        .limit(1);
      if (!rows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expedição não encontrada." });
      }
      const shipment = rows[0];
      if (!shipment.meOrderId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Esta expedição não tem um pedido no Melhor Envio.",
        });
      }
      const checkoutResult = await checkoutShipment(s.accessToken!, s.sandbox, [
        shipment.meOrderId,
      ]);
      let labelUrl: string | null = null;
      try {
        const printResult = await printLabel(s.accessToken!, s.sandbox, [shipment.meOrderId]);
        labelUrl = printResult.url;
      } catch {}
      await db
        .update(shipments)
        .set({ status: "paid", labelUrl })
        .where(eq(shipments.id, input.shipmentId));
      return {
        success: true,
        labelUrl,
        purchaseId: checkoutResult.purchase?.id,
      };
    }),

  getLabel: adminProcedure
    .input(z.object({ shipmentId: z.number() }))
        .query(async ({ input }) => {
      const db = await requireDb();
      const s = await requireSettings();
      const rows = await db
        .select()
        .from(shipments)
        .where(eq(shipments.id, input.shipmentId))
        .limit(1);
      if (!rows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expedição não encontrada." });
      }
      const shipment = rows[0];
      if (!shipment.meOrderId) return { labelUrl: null };
      if (shipment.labelUrl) return { labelUrl: shipment.labelUrl };
      try {
        const printResult = await printLabel(s.accessToken!, s.sandbox, [shipment.meOrderId]);
        await db
          .update(shipments)
          .set({ labelUrl: printResult.url })
          .where(eq(shipments.id, input.shipmentId));
        return { labelUrl: printResult.url };
      } catch {
        return { labelUrl: null };
      }
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// tracking router
// ─────────────────────────────────────────────────────────────────────────────

const trackingRouter = router({
  track: adminProcedure
    .input(z.object({ trackingCode: z.string() }))
    .query(async ({ input }) => {
      const s = await requireSettings();
      return trackShipment(s.accessToken!, s.sandbox, input.trackingCode);
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Root logistics router
// ─────────────────────────────────────────────────────────────────────────────

export const logisticsRouter = router({
  settings: settingsRouter,
  carriers: carriersRouter,
  shipping: shippingRouter,
  shipments: shipmentsRouter,
  tracking: trackingRouter,
  localRules: localRulesRouter,
});
