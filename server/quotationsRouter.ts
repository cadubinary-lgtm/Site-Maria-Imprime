import { router, publicProcedure } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { eq, desc, like, and, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const adminAnyProcedure = adminOrManusAuthProcedure;

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateQuotationNumber(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ORC-${ts}-${rand}`;
}

function calcDiscount(
  subtotal: number,
  discountType: "percentual" | "fixo",
  discountValue: number,
): number {
  if (discountType === "percentual") {
    return Math.round((subtotal * discountValue) / 100 * 100) / 100;
  }
  return Math.min(discountValue, subtotal);
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const quotationsRouter = router({

  // ── Listagem com filtros e indicadores ──────────────────────────────────
  list: adminAnyProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, clients } = await import("../drizzle/schema.js");

      const offset = (input.page - 1) * input.limit;

      // Build where conditions
      const conditions: any[] = [];
      if (input.status) {
        conditions.push(eq(quotations.status, input.status as any));
      }
      if (input.search) {
        conditions.push(
          or(
            like(quotations.quotationNumber, `%${input.search}%`),
            like(clients.name, `%${input.search}%`),
            like(clients.email, `%${input.search}%`),
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: quotations.id,
          quotationNumber: quotations.quotationNumber,
          status: quotations.status,
          subtotal: quotations.subtotal,
          discountAmount: quotations.discountAmount,
          shippingPrice: quotations.shippingPrice,
          total: quotations.total,
          paymentMethod: quotations.paymentMethod,
          productionDeadline: quotations.productionDeadline,
          quotationValidity: quotations.quotationValidity,
          convertedOrderId: quotations.convertedOrderId,
          sentAt: quotations.sentAt,
          approvedAt: quotations.approvedAt,
          expiresAt: quotations.expiresAt,
          createdAt: quotations.createdAt,
          updatedAt: quotations.updatedAt,
          clientId: quotations.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
        })
        .from(quotations)
        .leftJoin(clients, eq(quotations.clientId, clients.id))
        .where(where)
        .orderBy(desc(quotations.createdAt))
        .limit(input.limit)
        .offset(offset);

      // KPIs
      const kpiRows = await db.execute(sql`
        SELECT
          COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as rascunhos,
          COUNT(CASE WHEN status = 'enviado' THEN 1 END) as enviados,
          COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
          COUNT(CASE WHEN status = 'expirado' THEN 1 END) as expirados,
          COALESCE(SUM(CASE WHEN status IN ('enviado','em_negociacao') THEN total ELSE 0 END), 0) as valorNegociacao,
          COALESCE(SUM(CASE WHEN status = 'aprovado' THEN total ELSE 0 END), 0) as valorAprovado,
          COUNT(CASE WHEN convertedOrderId IS NOT NULL THEN 1 END) as convertidos,
          COUNT(*) as totalOrcamentos
        FROM quotations
      `);

      const kpi = (kpiRows as any)[0] ?? {};
      const taxaConversao = kpi.totalOrcamentos > 0
        ? Math.round((kpi.convertidos / kpi.totalOrcamentos) * 100)
        : 0;

      return {
        rows,
        kpis: {
          rascunhos: Number(kpi.rascunhos ?? 0),
          enviados: Number(kpi.enviados ?? 0),
          aprovados: Number(kpi.aprovados ?? 0),
          expirados: Number(kpi.expirados ?? 0),
          valorNegociacao: Number(kpi.valorNegociacao ?? 0),
          valorAprovado: Number(kpi.valorAprovado ?? 0),
          taxaConversao,
        },
        total: rows.length,
      };
    }),

  // ── Buscar orçamento por ID ─────────────────────────────────────────────
  getById: adminAnyProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems, clients } = await import("../drizzle/schema.js");

      const [quotation] = await db
        .select({
          id: quotations.id,
          quotationNumber: quotations.quotationNumber,
          status: quotations.status,
          subtotal: quotations.subtotal,
          discountType: quotations.discountType,
          discountValue: quotations.discountValue,
          discountAmount: quotations.discountAmount,
          shippingPrice: quotations.shippingPrice,
          shippingMethod: quotations.shippingMethod,
          shippingLabel: quotations.shippingLabel,
          shippingEstimatedDays: quotations.shippingEstimatedDays,
          deliveryAddress: quotations.deliveryAddress,
          total: quotations.total,
          paymentMethod: quotations.paymentMethod,
          productionDeadline: quotations.productionDeadline,
          quotationValidity: quotations.quotationValidity,
          commercialNotes: quotations.commercialNotes,
          itemsSnapshot: quotations.itemsSnapshot,
          convertedOrderId: quotations.convertedOrderId,
          operatorId: quotations.operatorId,
          sentAt: quotations.sentAt,
          approvedAt: quotations.approvedAt,
          expiresAt: quotations.expiresAt,
          canceledAt: quotations.canceledAt,
          createdAt: quotations.createdAt,
          updatedAt: quotations.updatedAt,
          clientId: quotations.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientWhatsapp: clients.whatsapp,
        })
        .from(quotations)
        .leftJoin(clients, eq(quotations.clientId, clients.id))
        .where(eq(quotations.id, input.id));

      if (!quotation) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });

      const items = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, input.id))
        .orderBy(quotationItems.id);

      return { ...quotation, items };
    }),

  // ── Criar orçamento ─────────────────────────────────────────────────────
  create: adminAnyProcedure
    .input(z.object({
      clientId: z.number(),
      items: z.array(z.object({
        productId: z.number().nullable(),
        productName: z.string(),
        productImage: z.string().optional(),
        specifications: z.string(), // JSON
        artFileUrl: z.string().optional(),
        artFileKey: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        totalPrice: z.number().min(0),
      })),
      discountType: z.enum(["percentual", "fixo"]).default("fixo"),
      discountValue: z.number().min(0).default(0),
      shippingPrice: z.number().min(0).default(0),
      shippingMethod: z.string().optional(),
      shippingLabel: z.string().optional(),
      shippingEstimatedDays: z.number().default(0),
      deliveryAddress: z.string().optional(),
      paymentMethod: z.string().optional(),
      productionDeadline: z.number().default(0),
      quotationValidity: z.number().default(30),
      commercialNotes: z.string().optional(),
      saveAsDraft: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems } = await import("../drizzle/schema.js");

      const operatorId = (ctx as any).user?.id ?? (ctx as any).adminUser?.id ?? 1;
      const quotationNumber = generateQuotationNumber();

      const subtotal = input.items.reduce((acc, i) => acc + i.totalPrice, 0);
      const discountAmount = calcDiscount(subtotal, input.discountType, input.discountValue);
      const total = Math.max(0, subtotal - discountAmount + input.shippingPrice);

      // Calcular expiresAt
      const expiresAt = new Date(Date.now() + input.quotationValidity * 24 * 60 * 60 * 1000);

      const [result] = await db.insert(quotations).values({
        quotationNumber,
        clientId: input.clientId,
        operatorId,
        status: input.saveAsDraft ? "rascunho" : "enviado",
        subtotal: subtotal.toFixed(2) as any,
        discountType: input.discountType,
        discountValue: input.discountValue.toFixed(2) as any,
        discountAmount: discountAmount.toFixed(2) as any,
        shippingPrice: input.shippingPrice.toFixed(2) as any,
        total: total.toFixed(2) as any,
        shippingMethod: input.shippingMethod,
        shippingLabel: input.shippingLabel,
        shippingEstimatedDays: input.shippingEstimatedDays,
        deliveryAddress: input.deliveryAddress,
        paymentMethod: input.paymentMethod,
        productionDeadline: input.productionDeadline,
        quotationValidity: input.quotationValidity,
        commercialNotes: input.commercialNotes,
        itemsSnapshot: JSON.stringify(input.items),
        expiresAt,
        sentAt: input.saveAsDraft ? null : new Date(),
      } as any);

      const quotationId = (result as any).insertId;

      // Inserir itens
      for (const item of input.items) {
        await db.insert(quotationItems).values({
          quotationId,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          specifications: item.specifications,
          artFileUrl: item.artFileUrl,
          artFileKey: item.artFileKey,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2) as any,
          totalPrice: item.totalPrice.toFixed(2) as any,
        } as any);
      }

      return { success: true, quotationId, quotationNumber };
    }),

  // ── Atualizar orçamento ─────────────────────────────────────────────────
  update: adminAnyProcedure
    .input(z.object({
      id: z.number(),
      clientId: z.number().optional(),
      items: z.array(z.object({
        productId: z.number().nullable(),
        productName: z.string(),
        productImage: z.string().optional(),
        specifications: z.string(),
        artFileUrl: z.string().optional(),
        artFileKey: z.string().optional(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        totalPrice: z.number().min(0),
      })).optional(),
      discountType: z.enum(["percentual", "fixo"]).optional(),
      discountValue: z.number().min(0).optional(),
      shippingPrice: z.number().min(0).optional(),
      shippingMethod: z.string().optional(),
      shippingLabel: z.string().optional(),
      shippingEstimatedDays: z.number().optional(),
      deliveryAddress: z.string().optional(),
      paymentMethod: z.string().optional(),
      productionDeadline: z.number().optional(),
      quotationValidity: z.number().optional(),
      commercialNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems } = await import("../drizzle/schema.js");

      const [existing] = await db.select({ status: quotations.status }).from(quotations).where(eq(quotations.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      const updates: Record<string, any> = {};
      if (input.clientId !== undefined) updates.clientId = input.clientId;
      if (input.discountType !== undefined) updates.discountType = input.discountType;
      if (input.shippingMethod !== undefined) updates.shippingMethod = input.shippingMethod;
      if (input.shippingLabel !== undefined) updates.shippingLabel = input.shippingLabel;
      if (input.shippingEstimatedDays !== undefined) updates.shippingEstimatedDays = input.shippingEstimatedDays;
      if (input.deliveryAddress !== undefined) updates.deliveryAddress = input.deliveryAddress;
      if (input.paymentMethod !== undefined) updates.paymentMethod = input.paymentMethod;
      if (input.productionDeadline !== undefined) updates.productionDeadline = input.productionDeadline;
      if (input.quotationValidity !== undefined) {
        updates.quotationValidity = input.quotationValidity;
        updates.expiresAt = new Date(Date.now() + input.quotationValidity * 24 * 60 * 60 * 1000);
      }
      if (input.commercialNotes !== undefined) updates.commercialNotes = input.commercialNotes;

      if (input.items) {
        const subtotal = input.items.reduce((acc, i) => acc + i.totalPrice, 0);
        const discountType = input.discountType ?? "fixo";
        const discountValue = input.discountValue ?? 0;
        const discountAmount = calcDiscount(subtotal, discountType, discountValue);
        const shippingPrice = input.shippingPrice ?? 0;
        const total = Math.max(0, subtotal - discountAmount + shippingPrice);

        updates.subtotal = subtotal.toFixed(2);
        updates.discountValue = discountValue.toFixed(2);
        updates.discountAmount = discountAmount.toFixed(2);
        updates.shippingPrice = shippingPrice.toFixed(2);
        updates.total = total.toFixed(2);
        updates.itemsSnapshot = JSON.stringify(input.items);

        // Recriar itens
        await db.delete(quotationItems).where(eq(quotationItems.quotationId, input.id));
        for (const item of input.items) {
          await db.insert(quotationItems).values({
            quotationId: input.id,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            specifications: item.specifications,
            artFileUrl: item.artFileUrl,
            artFileKey: item.artFileKey,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2) as any,
            totalPrice: item.totalPrice.toFixed(2) as any,
          } as any);
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.update(quotations).set(updates).where(eq(quotations.id, input.id));
      }

      return { success: true };
    }),

  // ── Mudar status ────────────────────────────────────────────────────────
  updateStatus: adminAnyProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["rascunho", "enviado", "em_negociacao", "aprovado", "recusado", "expirado", "cancelado"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationHistory } = await import("../drizzle/schema.js");

      const [existing] = await db.select({ status: quotations.status }).from(quotations).where(eq(quotations.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });

      const operatorId = (ctx as any).user?.id ?? (ctx as any).adminUser?.id ?? 1;
      const now = new Date();

      const statusUpdates: Record<string, any> = { status: input.status };
      if (input.status === "enviado") statusUpdates.sentAt = now;
      if (input.status === "aprovado") statusUpdates.approvedAt = now;
      if (input.status === "cancelado") statusUpdates.canceledAt = now;

      await db.update(quotations).set(statusUpdates).where(eq(quotations.id, input.id));

      await db.insert(quotationHistory).values({
        quotationId: input.id,
        previousStatus: existing.status,
        newStatus: input.status,
        operatorId,
        notes: input.notes,
      } as any);

      return { success: true };
    }),

  // ── Duplicar orçamento ──────────────────────────────────────────────────
  duplicate: adminAnyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems } = await import("../drizzle/schema.js");

      const [original] = await db.select().from(quotations).where(eq(quotations.id, input.id));
      if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });

      const originalItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, input.id));

      const operatorId = (ctx as any).user?.id ?? (ctx as any).adminUser?.id ?? 1;
      const newNumber = generateQuotationNumber();
      const expiresAt = new Date(Date.now() + (original.quotationValidity ?? 30) * 24 * 60 * 60 * 1000);

      const [result] = await db.insert(quotations).values({
        ...original,
        id: undefined as any,
        quotationNumber: newNumber,
        operatorId,
        status: "rascunho",
        convertedOrderId: null,
        sentAt: null,
        approvedAt: null,
        canceledAt: null,
        expiresAt,
        createdAt: undefined as any,
        updatedAt: undefined as any,
      } as any);

      const newId = (result as any).insertId;

      for (const item of originalItems) {
        await db.insert(quotationItems).values({
          ...item,
          id: undefined as any,
          quotationId: newId,
          createdAt: undefined as any,
        } as any);
      }

      return { success: true, newId, newNumber };
    }),

  // ── Converter em pedido ─────────────────────────────────────────────────
  convertToOrder: adminAnyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems, orders, orderItems, clients } = await import("../drizzle/schema.js");

      const [quotation] = await db
        .select()
        .from(quotations)
        .leftJoin(clients, eq(quotations.clientId, clients.id))
        .where(eq(quotations.id, input.id));

      if (!quotation) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      if ((quotation as any).quotations?.status !== "aprovado") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Apenas orçamentos aprovados podem ser convertidos em pedido." });
      }

      const q = (quotation as any).quotations;
      const c = (quotation as any).clients;

      const orderNumber = `PD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const operatorId = (ctx as any).user?.id ?? (ctx as any).adminUser?.id ?? 1;

      const [orderResult] = await db.insert(orders).values({
        clientId: q.clientId,
        userId: operatorId,
        orderNumber,
        status: "analisando",
        totalPrice: q.total,
        paymentMethod: q.paymentMethod,
        notes: `Convertido do orçamento ${q.quotationNumber}. ${q.commercialNotes ?? ""}`,
        shippingMethod: q.shippingMethod,
        shippingPrice: q.shippingPrice,
        shippingLabel: q.shippingLabel,
        shippingEstimatedDays: q.shippingEstimatedDays,
        paymentStatus: "pendente",
      } as any);

      const orderId = (orderResult as any).insertId;

      // Inserir itens do pedido a partir do snapshot
      const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, input.id));
      for (const item of items) {
        const specs = JSON.parse(item.specifications ?? "{}");
        await db.insert(orderItems).values({
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          priceAtOrder: item.unitPrice ?? "0",
          artFileUrl: item.artFileUrl,
          customDimensions: (specs.width && specs.height) ? `${specs.width}x${specs.height}` : null,
          selectedAttributes: item.specifications,
          preProductionStatus: "liberado_analise",
        } as any);
      }

      // Vincular orçamento ao pedido
      await db.update(quotations)
        .set({ convertedOrderId: orderId } as any)
        .where(eq(quotations.id, input.id));

      return { success: true, orderId, orderNumber };
    }),

  // ── Excluir orçamento ──────────────────────────────────────────────────
  delete: adminAnyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { quotations, quotationItems, quotationHistory } = await import("../drizzle/schema.js");

      const [existing] = await db.select({ status: quotations.status }).from(quotations).where(eq(quotations.id, input.id));
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });

      await db.delete(quotationHistory).where(eq(quotationHistory.quotationId, input.id));
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, input.id));
      await db.delete(quotations).where(eq(quotations.id, input.id));

      return { success: true };
    }),

  // ── Buscar opções de variações e atributos de um produto ──────────────
  // ── Buscar dados de precificação do produto (pricePerM2, calculationType, modifiers) ──
  getProductPricing: adminAnyProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { products } = await import("../drizzle/schema.js");
      const { getVariationTypesByProduct, getVariationOptionsByType } = await import("./db.js");
      const { getProductAttributes } = await import("./db-attributes.js");

      // Dados base do produto
      const [product] = await db.select({
        id: products.id,
        price: products.price,
        pricePerM2: products.pricePerM2,
        calculationType: products.calculationType,
      }).from(products).where(eq(products.id, input.productId)).limit(1);

      if (!product) return null;

      // Variações com priceModifier e calculationType
      const varTypes = await getVariationTypesByProduct(input.productId);
      const variationsWithPricing = await Promise.all(
        varTypes.map(async (vt) => {
          const options = await getVariationOptionsByType(vt.id);
          return {
            id: vt.id,
            name: vt.name,
            options: options.map((o: any) => ({
              id: o.id,
              name: o.name,
              priceModifier: parseFloat(o.priceModifier?.toString() ?? "0"),
              calculationType: o.calculationType ?? "unit",
            })),
          };
        })
      );

      // Atributos com priceModifier
      const attrs = await getProductAttributes(input.productId);
      const attributesWithPricing = attrs.map((pa: any) => ({
        attributeId: pa.attributeId,
        name: pa.attribute?.name ?? "",
        values: (pa.values ?? []).map((v: any) => ({
          id: v.id,
          value: v.value,
          priceModifier: parseFloat(v.priceModifier?.toString() ?? "0"),
        })),
      }));

      return {
        id: product.id,
        price: parseFloat(product.price?.toString() ?? "0"),
        pricePerM2: parseFloat(product.pricePerM2?.toString() ?? "0"),
        calculationType: product.calculationType,
        variations: variationsWithPricing,
        attributes: attributesWithPricing,
      };
    }),

  getProductOptions: adminAnyProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const { getVariationTypesByProduct, getVariationOptionsByType } = await import("./db.js");
      const { getProductAttributes } = await import("./db-attributes.js");

      // Variações (material, acabamento) - sistema variationTypes
      const varTypes = await getVariationTypesByProduct(input.productId);
      const variationsWithOptions = await Promise.all(
        varTypes.map(async (vt) => ({
          id: vt.id,
          name: vt.name,
          type: vt.type,
          options: await getVariationOptionsByType(vt.id),
        }))
      );

      // Atributos (impressão, etc.) - sistema productAttributes
      const attrs = await getProductAttributes(input.productId);
      const attributesWithValues = attrs.map((pa: any) => ({
        attributeId: pa.attributeId,
        name: pa.attribute?.name ?? "",
        values: (pa.values ?? []).map((v: any) => ({ id: v.id, value: v.value })),
      }));

      return { variations: variationsWithOptions, attributes: attributesWithValues };
    }),

  // ── Criar cliente rapidamente inline (sem sair do formulário de orçamento) ──
  quickCreateClient: adminAnyProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      clientType: z.enum(["balcao", "site", "revendedor", "agencia", "corporativo"]),
      notes: z.string().optional(),
      cpfCnpj: z.string().optional(),
      addressZipCode: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { clients } = await import("../drizzle/schema.js");
      const result = await db.insert(clients).values({
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        whatsapp: input.whatsapp || null,
        clientType: input.clientType as any,
        notes: input.notes || null,
        isActive: true,
        cpfCnpj: input.cpfCnpj || null,
        addressZipCode: input.addressZipCode || null,
        addressStreet: input.addressStreet || null,
        addressNumber: input.addressNumber || null,
        addressComplement: input.addressComplement || null,
        addressNeighborhood: input.addressNeighborhood || null,
        addressCity: input.addressCity || null,
        addressState: input.addressState || null,
      });
      const newId = (result as any).insertId ?? (result as any)[0]?.insertId;
      // Buscar o cliente recém-criado
      const [newClient] = await db.select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        whatsapp: clients.whatsapp,
        clientType: clients.clientType,
      }).from(clients).where(eq(clients.id, Number(newId))).limit(1);
      return newClient;
    }),

  // ── Buscar clientes para autocomplete ──────────────────────────────────
  searchClients: adminAnyProcedure
    .input(z.object({ search: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { clients, customerAccounts, users } = await import("../drizzle/schema.js");
      const s = `%${input.search}%`;

      // 1. Buscar na tabela clients (CRM)
      const crmRows = await db
        .select({
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          whatsapp: clients.whatsapp,
          cpfCnpj: clients.cpfCnpj,
          addressZipCode: clients.addressZipCode,
          addressStreet: clients.addressStreet,
          addressNumber: clients.addressNumber,
          addressComplement: clients.addressComplement,
          addressNeighborhood: clients.addressNeighborhood,
          addressCity: clients.addressCity,
          addressState: clients.addressState,
          clientType: clients.clientType,
          source: sql<string>`'crm'`,
        })
        .from(clients)
        .where(or(like(clients.name, s), like(clients.email, s), like(clients.phone, s)))
        .limit(8);

      // 2. Buscar na tabela customer_accounts (clientes da loja)
      const caRows = await db
        .select({
          id: customerAccounts.id,
          name: sql<string>`CONCAT(${customerAccounts.firstName}, ' ', ${customerAccounts.lastName})`,
          email: customerAccounts.email,
          phone: customerAccounts.phone,
          whatsapp: sql<string | null>`NULL`,
          clientType: sql<string>`'site'`,
          source: sql<string>`'customer_accounts'`,
        })
        .from(customerAccounts)
        .where(
          or(
            like(sql`CONCAT(${customerAccounts.firstName}, ' ', ${customerAccounts.lastName})`, s),
            like(customerAccounts.email, s),
            like(customerAccounts.phone, s),
          )
        )
        .limit(8);

      // 3. Buscar na tabela users (usuários Manus OAuth com role=user)
      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: sql<string | null>`NULL`,
          whatsapp: sql<string | null>`NULL`,
          clientType: sql<string>`'site'`,
          source: sql<string>`'users'`,
        })
        .from(users)
        .where(
          and(
            or(like(users.name, s), like(users.email, s)),
            sql`${users.role} = 'user'`
          )
        )
        .limit(5);

      // Combinar e deduplicar por email
      const seen = new Set<string>();
      const combined: Array<{
        id: number;
        name: string | null;
        email: string | null;
        phone: string | null;
        whatsapp: string | null;
        clientType: string;
        source: string;
      }> = [];

      for (const row of [...crmRows, ...caRows, ...userRows]) {
        const key = row.email ?? `${row.source}-${row.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(row as any);
        }
        if (combined.length >= 10) break;
      }

      return combined;
    }),
});
