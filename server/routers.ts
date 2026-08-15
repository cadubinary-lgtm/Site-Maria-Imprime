import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parse as parseCookieHeader } from "cookie";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

/** Lê um cookie diretamente do header Cookie da requisição (sem cookie-parser) */
function getCookieFromReq(req: ExpressRequest, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed[name] || undefined;
}
import {
  getAllProducts,
  getProductsBySegment,
  getProductIdsBySegmentId,
  getProductById,
  getProductByName,
  getOrdersByClient,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createOrder,
  getDb,
  getAllSegments,
  getSegmentBySlug,
  getCategoriesBySegment,
  getProductsByCategory,
  getVariationTypesByProduct,
  getGlobalVariationTypes,
  linkGlobalVariationToProduct,
  getVariationOptionsByType,
  createVariationType,
  createVariationOption,
  deleteVariationType,
  updateVariationType,
  deleteVariationOption,
  getCartByUser,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartItemCount,
  updateVariationOption,
  reorderVariationTypes,
  reorderVariationOptions,
  syncGlobalVariationOptions,
  syncGlobalVariationName,
  getOrderItemVariations,
  addOrderItemVariation,
  createFileCheck,
  getFileCheckByOrderItem,
  updateFileCheckStatus,
  searchGlobal,
  createSegment,
  updateSegment,
  deleteSegment,
  reorderSegment,
  getDeliveryOptionsByProduct,
  createDeliveryOption,
  updateDeliveryOption,
  deleteDeliveryOption,
  reorderDeliveryOptions,
  copyDeliveryOptionsFromProduct,
  createOrderFromCart,
  getOrdersByUser,
  getOrderDetailByUser,
  getOrderStatusHistory,
  getEmailHistory,
  getEmailHistoryByOrderItem,
  addEmailToHistory,
} from "./db";
import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { products, orders, orderItems, segments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { crmRouter } from "./routers-crm";
import { customerAuthRouter } from "./routers/customerAuth";
import { financialRouter } from "./routers-financial";
import { web2printRouter } from "./routers-web2print";
import { automationRouter } from "./routers-automation";
import { attributesRouter } from "./routers-attributes";
import { productSegmentsRouter } from "./routers-product-segments";
import { pricingRouter } from "./routers-pricing";
import { pricingRulesRouter } from "./routers-pricing-rules";
import { logisticsRouter } from "./routers-logistics";
import { gerenciadorFinanceiroRouter, gestaoFiscalRouter } from "./routers-gerenciador";
import { financeiroRouter } from "./routers-financeiro";
import { adminAuthRouter, adminOrManusAuthProcedure } from "./routers-admin-auth";
import { paymentRouter } from "./routers-payment";
import { artUploadRouter } from "./artUploadRouter";
import { quotationsRouter } from "./quotationsRouter";
import { variationsCvRouter } from "./variationsCvRouter";
import { variationsOffsetRouter } from "./variationsOffsetRouter";
import { companySettingsRouter } from "./companySettingsRouter";
import { abandonedCartsRouter } from "./abandonedCartsRouter";
import { preImpressaoHistoryRouter } from "./preImpressaoHistoryRouter";
import { ordersTrashRouter } from "./ordersTrashRouter";

// Alias: aceita tanto admin_session (site oficial) quanto Manus OAuth
// Usado em todas as procedures do checkout/erp que o painel admin consome
const adminAnyProcedure = adminOrManusAuthProcedure;

// Procedimento protegido apenas para admin
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar" });
  }
  return next({ ctx });
});

// Procedimento protegido apenas para produção
export const productionProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "production") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas produção pode acessar" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  customerAuth: customerAuthRouter,
  adminAuth: adminAuthRouter,
  logistics: logisticsRouter,
  payment: paymentRouter,
  artUpload: artUploadRouter,
  quotations: quotationsRouter,
  variationsCv: variationsCvRouter,
  variationsOffset: variationsOffsetRouter,
  companySettings: companySettingsRouter,
  abandonedCarts: abandonedCartsRouter,
  preImpressaoHistory: preImpressaoHistoryRouter,
  ordersTrash: ordersTrashRouter,
  gerenciadorFinanceiro: gerenciadorFinanceiroRouter,
  gestaoFiscal: gestaoFiscalRouter,
  financeiro: financeiroRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Products - Público (qualquer um pode ver)
  products: router({
    getAll: publicProcedure.query(() => getAllProducts()),
    getBySegment: publicProcedure
      .input(z.object({ segment: z.string() }))
      .query(({ input }) => getProductsBySegment(input.segment)),
    getBySegmentId: publicProcedure
      .input(z.object({ segmentId: z.number() }))
      .query(({ input }) => getProductIdsBySegmentId(input.segmentId)),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProductById(input.id)),
    updatePrice: adminProcedure
      .input(z.object({
        productId: z.number(),
        price: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.update(products)
          .set({ price: input.price as any })
          .where(eq(products.id, input.productId));
        return result;
      }),
    updateProduct: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        segment: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;
        if (input.price) updateData.price = input.price;
        if (input.segment) updateData.segment = input.segment;
        if (input.imageUrl) updateData.imageUrl = input.imageUrl;
        
        const result = await db.update(products)
          .set(updateData)
          .where(eq(products.id, input.productId));
        return result;
      }),
  }),

  // Segments - Público e Admin
  segments: router({
    list: publicProcedure.query(() => getAllSegments()),
    getAll: publicProcedure.query(() => getAllSegments()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getSegmentBySlug(input.slug)),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        icon: z.string().optional(),
        slug: z.string(),
      }))
      .mutation(async ({ input }) => {
        return createSegment(input.name, input.icon || '', input.slug);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return updateSegment(input.id, input.name, input.icon || '', input.slug);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSegment(input.id);
      }),
    reorder: adminProcedure
      .input(z.object({
        id: z.number(),
        direction: z.enum(['up', 'down']),
      }))
      .mutation(async ({ input }) => {
        return reorderSegment(input.id, input.direction);
      }),
  }),

  // Categories - Público
  categories: router({
    getBySegment: publicProcedure
      .input(z.object({ segmentId: z.number() }))
      .query(({ input }) => getCategoriesBySegment(input.segmentId)),
    getProducts: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(({ input }) => getProductsByCategory(input.categoryId)),
  }),

  // Admin - Gerenciar produtos
  admin: router({
    deleteMultipleProducts: adminProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        if (input.ids.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum produto selecionado" });
        }
        
        // Deletar produtos em lotes para evitar problemas
        const result = await Promise.all(
          input.ids.map(id => 
            db.delete(products).where(eq(products.id, id))
          )
        );
        return { deletedCount: input.ids.length };
      }),
    createProduct: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        resellerPrice: z.string().optional(),
        segment: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        galleryUrls: z.string().optional(), // JSON array de URLs
        calculationType: z.enum(["m2", "metro_linear", "pacote", "unidade"]).optional(),
        pricePerM2: z.string().optional(),
        resellerPricePerM2: z.string().optional(),
        minWidth: z.string().optional(),
        maxWidth: z.string().optional(),
        minHeight: z.string().optional(),
        maxHeight: z.string().optional(),
        // Logística
        weight: z.number().optional(),
        logisticsWidth: z.number().optional(),
        logisticsHeight: z.number().optional(),
        logisticsLength: z.number().optional(),
        allowedCarrierIds: z.array(z.number()).optional(),
        specifications: z.string().optional(), // JSON array de { label, value }
        tags: z.string().optional(), // JSON array de tags
        tagPosition: z.string().optional(), // Posição das tags no card
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        try {
          // Para m2 e metro_linear, o preco base nao e obrigatorio — usar 0 como fallback
          const effectivePrice = (input.price && input.price !== '' && !isNaN(Number(input.price)))
            ? input.price
            : '0';
          // Inserir produto
          const result = await db.insert(products).values({
            name: input.name,
            description: input.description,
            price: effectivePrice as any,
            resellerPrice: input.resellerPrice ? input.resellerPrice as any : null,
            segment: input.segment as any,
            imageUrl: input.imageUrl,
            imageKey: input.imageKey,
            galleryUrls: input.galleryUrls || null,
            calculationType: (input.calculationType || "unidade") as any,
            pricePerM2: input.pricePerM2 ? input.pricePerM2 as any : null,
            resellerPricePerM2: input.resellerPricePerM2 ? input.resellerPricePerM2 as any : null,
            minWidth: input.minWidth ? input.minWidth as any : null,
            maxWidth: input.maxWidth ? input.maxWidth as any : null,
            minHeight: input.minHeight ? input.minHeight as any : null,
            maxHeight: input.maxHeight ? input.maxHeight as any : null,
            weight: input.weight ?? null,
            width: input.logisticsWidth ?? null,
            height: input.logisticsHeight ?? null,
            length: input.logisticsLength ?? null,
            allowedCarriers: input.allowedCarrierIds && input.allowedCarrierIds.length > 0 ? JSON.stringify(input.allowedCarrierIds) : '[]',
            specifications: input.specifications || null,
            tags: input.tags || null,
            tagPosition: input.tagPosition || "top-right",
            isActive: true,
          } as any);
          
          const newProductId = (result as any).insertId;
          const testProduct = await getProductByName('MODELO - Não Excluir');
          if (testProduct && testProduct.id) {
            try {
              await copyDeliveryOptionsFromProduct(testProduct.id, newProductId);
            } catch (e) {
              console.warn('Erro ao copiar prazos:', e);
            }
          }
          
          return { success: true, message: 'Produto criado com sucesso', id: newProductId as number };
        } catch (error) {
          console.error('Error creating product:', error);
          throw new Error(`Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),
    getAllOrders: adminAnyProcedure.query(() => getAllOrders()),
    getOrderWithItems: adminAnyProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orders: ordersTable, orderItems: orderItemsTable } = await import("../drizzle/schema.js");
        const { eq: eqOp, sql: sqlOp } = await import("drizzle-orm");
        const orderRows = await db.select().from(ordersTable).where(eqOp(ordersTable.id, input.orderId)).limit(1);
        const order = orderRows[0] ?? null;
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        const itemRows = await db.execute(
          sqlOp`SELECT oi.*, p.imageUrl as productImage FROM orderItems oi LEFT JOIN products p ON oi.productId = p.id WHERE oi.orderId = ${input.orderId}`
        ) as any;
        const items = (itemRows[0] ?? []) as any[];
        // Buscar dados completos do cliente (customerAccount + endereço padrão)
        let customerData: any = null;
        if (order.customerId) {
          const customerRows = await db.execute(
            sqlOp`SELECT
              ca.id, ca.firstName, ca.lastName, ca.email, ca.phone, ca.cpfCnpj,
              COALESCE(addr.fullName, CONCAT(ca.firstName, ' ', ca.lastName)) as addrFullName,
              COALESCE(addr.phone, ca.phone) as addrPhone,
              COALESCE(addr.street, ca.addressStreet) as street,
              COALESCE(addr.number, ca.addressNumber) as number,
              COALESCE(addr.complement, ca.addressComplement) as complement,
              COALESCE(addr.neighborhood, ca.addressNeighborhood) as neighborhood,
              COALESCE(addr.city, ca.addressCity) as city,
              COALESCE(addr.state, ca.addressState) as state,
              COALESCE(addr.zipCode, ca.addressZipCode) as zipCode
            FROM customer_accounts ca
            LEFT JOIN customerAddresses addr ON addr.userId = ca.id AND addr.isDefault = 1
            WHERE ca.id = ${order.customerId}
            LIMIT 1`
          ) as any;
          customerData = (customerRows[0] ?? [])[0] ?? null;
        }
        return { order, items, customerData };
      }),
    deleteOrder: adminAnyProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const { orders: ordersTable, orderItems, orderStatusHistory } = await import("../drizzle/schema.js");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, input.orderId));
        await db.delete(orderItems).where(eq(orderItems.orderId, input.orderId));
        await db.delete(ordersTable).where(eq(ordersTable.id, input.orderId));
        return { success: true };
      }),
    updateOrderStatus: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        newStatus: z.enum(["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await updateOrderStatus(input.orderId, input.newStatus, input.notes);
      }),
    updatePreProductionStatus: adminAnyProcedure
      .input(z.object({
        orderItemId: z.number(),
        preProductionStatus: z.enum(["liberado_analise", "ajustar_arte", "aguardando_reenvio_arquivo", "aguardando_aprovacao_cliente", "arte_final_aprovada", "nova_arte_reenviada", "em_producao"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems: orderItemsT, orders: ordersT } = await import("../drizzle/schema.js");
        // Atualiza o status de pré-impressão do item
        await db.update(orderItemsT)
          .set({ preProductionStatus: input.preProductionStatus } as any)
          .where(eq(orderItemsT.id, input.orderItemId));
        // Se aprovado, verifica se todos os itens do pedido foram aprovados
        // e atualiza o status do pedido para em_producao APENAS se for pedido de 1 item
        if (input.preProductionStatus === "arte_final_aprovada") {
          const [item] = await db.select({ orderId: orderItemsT.orderId })
            .from(orderItemsT)
            .where(eq(orderItemsT.id, input.orderItemId))
            .limit(1);
          if (item?.orderId) {
            const allItems = await db.select({ preProductionStatus: orderItemsT.preProductionStatus })
              .from(orderItemsT)
              .where(eq(orderItemsT.orderId, item.orderId));
            const allApproved = allItems.every((i: any) => i.preProductionStatus === "arte_final_aprovada");
            // Só muda o status global automaticamente se for pedido de 1 único item.
            // Pedidos com múltiplos itens aguardam o botão "Enviar para Produção" (sendToProduction).
            if (allApproved && allItems.length === 1) {
              await db.update(ordersT)
                .set({ status: "em_producao" } as any)
                .where(eq(ordersT.id, item.orderId));
            }
          }
        }
        return { success: true };
      }),
    // ── Gatilho de Produção: dispara os 3 status de uma vez quando operador clica em Salvar com Arte Final Aprovada ──
    triggerProductionStart: adminAnyProcedure
      .input(z.object({
        orderItemId: z.number(),
        orderId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems: orderItemsT, orders: ordersT, orderItemLogs: orderItemLogsT } = await import("../drizzle/schema.js");
        // 1. Status de pré-impressão do item → em_producao (sempre)
        await db.update(orderItemsT)
          .set({ preProductionStatus: "em_producao" } as any)
          .where(eq(orderItemsT.id, input.orderItemId));
        // 2. Status do pedido → em_producao APENAS se for pedido de 1 único item.
        // Pedidos com múltiplos itens aguardam o botão "Enviar para Produção".
        const allItemsOfOrder = await db.select({ preProductionStatus: orderItemsT.preProductionStatus })
          .from(orderItemsT)
          .where(eq(orderItemsT.orderId, input.orderId));
        if (allItemsOfOrder.length === 1) {
          await db.update(ordersT)
            .set({ status: "em_producao" } as any)
            .where(eq(ordersT.id, input.orderId));
        }
        // 3. Registrar log de auditoria
        try {
          const operatorName = (ctx as any).adminUser?.name ?? "Operador";
          await db.insert(orderItemLogsT).values({
            orderItemId: input.orderItemId,
            orderId: input.orderId,
            action: "Iniciou produção",
            operatorName,
            createdAt: Date.now(),
          } as any);
        } catch (logErr) {
          console.error("[LOG] Erro ao registrar log de produção:", logErr);
        }
        return { success: true };
      }),

    updateProductionStatus: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        productionStatus: z.enum(["pendente", "impresso", "acabamento_finalizado"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orders: ordersT, orderItems: orderItemsT, orderItemLogs: orderItemLogsT } = await import("../drizzle/schema.js");
        await db.update(ordersT)
          .set({ productionStatus: input.productionStatus } as any)
          .where(eq(ordersT.id, input.orderId));
        const [order] = await db.select({ shippingMethod: ordersT.shippingMethod }).from(ordersT).where(eq(ordersT.id, input.orderId)).limit(1);
        const [firstItem] = await db.select({ id: orderItemsT.id }).from(orderItemsT).where(eq(orderItemsT.orderId, input.orderId)).limit(1);
        const isPickup = String(order?.shippingMethod ?? "").toLowerCase().includes("retirada") || String(order?.shippingMethod ?? "").toLowerCase().includes("pickup");
        const finalStatus = isPickup ? "pronto_retirada" : "pronto_entrega";
        if (input.productionStatus === "acabamento_finalizado") {
          await db.update(ordersT).set({ status: finalStatus } as any).where(eq(ordersT.id, input.orderId));
        }
        if (firstItem) {
          await db.insert(orderItemLogsT).values({
            orderItemId: firstItem.id,
            orderId: input.orderId,
            action: input.productionStatus === "acabamento_finalizado"
              ? `Produção: Acabamento finalizado — encaminhado para ${isPickup ? "Pronto para Retirada" : "Pronto para Entrega"}`
              : `Produção: ${input.productionStatus === "impresso" ? "Impresso" : "Pendente"}`,
            operatorName: (ctx as any).adminUser?.name ?? "Operador",
            createdAt: Date.now(),
          } as any);
        }
        return { success: true };
      }),
    updateProduct: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        resellerPrice: z.string().optional(),
        segment: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        galleryUrls: z.string().optional(), // JSON array de URLs
        calculationType: z.enum(["m2", "metro_linear", "pacote", "unidade"]).optional(),
        pricePerM2: z.string().optional(),
        resellerPricePerM2: z.string().optional(),
        minWidth: z.string().optional(),
        maxWidth: z.string().optional(),
        minHeight: z.string().optional(),
        maxHeight: z.string().optional(),
        specifications: z.string().optional(), // JSON array de { label, value }
        tags: z.string().optional(), // JSON array de tags
        tagPosition: z.string().optional(), // Posição das tags no card
        // Campos de logística
        weight: z.number().optional(),
        logisticsWidth: z.number().optional(),
        logisticsHeight: z.number().optional(),
        logisticsLength: z.number().optional(),
        allowedCarrierIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {
          name: input.name,
          description: input.description,
          price: input.price as any,
          resellerPrice: input.resellerPrice !== undefined ? (input.resellerPrice ? parseFloat(input.resellerPrice) : null) : undefined,
          segment: input.segment as any,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          galleryUrls: input.galleryUrls !== undefined ? input.galleryUrls : undefined,
        };

        // Adicionar campos de m² se fornecidos
        if (input.calculationType) updateData.calculationType = input.calculationType;
        if (input.pricePerM2) updateData.pricePerM2 = parseFloat(input.pricePerM2);
        if (input.resellerPricePerM2 !== undefined) updateData.resellerPricePerM2 = input.resellerPricePerM2 ? parseFloat(input.resellerPricePerM2) : null;
        if (input.minWidth) updateData.minWidth = parseFloat(input.minWidth);
        if (input.maxWidth) updateData.maxWidth = parseFloat(input.maxWidth);
        if (input.minHeight) updateData.minHeight = parseFloat(input.minHeight);
        if (input.maxHeight) updateData.maxHeight = parseFloat(input.maxHeight);
        if (input.specifications !== undefined) updateData.specifications = input.specifications || null;
        if (input.tags !== undefined) updateData.tags = input.tags || null;
        if (input.tagPosition !== undefined) updateData.tagPosition = input.tagPosition || "top-right";
        // Campos de logística
        if (input.weight !== undefined) updateData.weight = input.weight;
        if (input.logisticsWidth !== undefined) updateData.width = input.logisticsWidth;
        if (input.logisticsHeight !== undefined) updateData.height = input.logisticsHeight;
        if (input.logisticsLength !== undefined) updateData.length = input.logisticsLength;
        if (input.allowedCarrierIds !== undefined) updateData.allowedCarriers = JSON.stringify(input.allowedCarrierIds);
        
        const result = await db.update(products)
          .set(updateData)
          .where(eq(products.id, input.id));
        return result;
      }),
    deleteProduct: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.delete(products)
          .where(eq(products.id, input.id));
        return result;
      }),
  }),

  // Orders - Cliente e Produção
  orders: router({
    getMyOrders: protectedProcedure.query(({ ctx }) => getOrdersByClient(ctx.user.id)),
    getOrderById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getOrderById(input.id)),
    // NOTA: Procedure createOrder antiga removida.
    // Use a procedure checkout.createOrder no router checkout para criar pedidos com status correto.
    // A nova procedure respeita o método de pagamento para definir o status inicial:
    // - pagamento_retirada para "Pagar na Retirada"
    // - pagamento_aprovado para PIX/Cartão
    // Sem transição automática para "analisando".
  }),

  // Variations - Procedimentos públicos para obter variações
  variations: router({
    getByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        const types = await getVariationTypesByProduct(input.productId);
        const typesWithOptions = await Promise.all(
          types.map(async (type) => ({
            ...type,
            options: await getVariationOptionsByType(type.id),
          }))
        );
        return typesWithOptions;
      }),
    getGlobal: publicProcedure
      .query(async () => {
        const types = await getGlobalVariationTypes();
        const typesWithOptions = await Promise.all(
          types.map(async (type) => ({
            ...type,
            options: await getVariationOptionsByType(type.id),
          }))
        );
        return typesWithOptions;
      }),
  }),

  // Admin - Gerenciar variações
  adminVariations: router({
    createType: adminProcedure
      .input(z.object({
        productId: z.number().nullable(),
        type: z.enum(["material", "acabamento"]),
        name: z.string(),
        isRequired: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        return await createVariationType({
          productId: input.productId as any,
          type: input.type,
          name: input.name,
          isRequired: input.isRequired,
        });
      }),
    createOption: adminProcedure
      .input(z.object({
        variationTypeId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        priceModifier: z.string().default("0"),
        calculationType: z.enum(["unit", "m2", "linear", "package"]).default("unit"),
      }))
      .mutation(async ({ input }) => {
        return await createVariationOption({
          variationTypeId: input.variationTypeId,
          name: input.name,
          description: input.description,
          priceModifier: input.priceModifier as any,
          calculationType: input.calculationType,
        });
      }),
    updateType: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        selectionType: z.enum(["radio", "checkbox", "select", "cards", "chips"]).optional(),
        visualType: z.string().optional(),
        order: z.number().optional(),
        isRequired: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateVariationType(id, data as any);
      }),
    deleteType: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVariationType(input.id);
      }),
    deleteOption: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteVariationOption(input.id);
      }),
    updateOption: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        priceModifier: z.string().optional(),
        calculationType: z.enum(["unit", "m2", "linear", "package"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateVariationOption(id, data);
      }),
    reorderTypes: adminProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number(),
          order: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        return await reorderVariationTypes(input.updates);
      }),
    reorderOptions: adminProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number(),
          order: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        return await reorderVariationOptions(input.updates);
      }),
    linkGlobal: adminProcedure
      .input(z.object({
        globalVariationId: z.number(),
        productId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await linkGlobalVariationToProduct(input.globalVariationId, input.productId);
      }),
    syncGlobalOptions: adminProcedure
      .input(z.object({
        globalVariationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await syncGlobalVariationOptions(input.globalVariationId);
      }),
    syncGlobalName: adminProcedure
      .input(z.object({
        globalVariationId: z.number(),
        newName: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await syncGlobalVariationName(input.globalVariationId, input.newName);
      }),
  }),

  // File Check - Procedimentos para checagem de arquivo
  fileCheck: router({
    create: protectedProcedure
      .input(z.object({
        orderItemId: z.number(),
        fileName: z.string(),
        fileSize: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createFileCheck({
          orderItemId: input.orderItemId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          status: "pendente",
        });
      }),
    getByOrderItem: publicProcedure
      .input(z.object({ orderItemId: z.number() }))
      .query(async ({ input }) => {
        return await getFileCheckByOrderItem(input.orderItemId);
      }),
    updateStatus: adminProcedure
      .input(z.object({
        fileCheckId: z.number(),
        status: z.enum(["pendente", "aprovado", "rejeitado"]),
        issues: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await updateFileCheckStatus(input.fileCheckId, input.status, input.issues);
      }),
  }),

  // Search - Busca global de produtos, categorias e materiais
  search: router({
    global: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await searchGlobal(input.query);
      }),
  }),
  // CRM - Gestão de Clientes
  crm: crmRouter,
  // Financial - Controle Financeiro
  financial: financialRouter,
  // Web2Print - Validação de Arquivos
  web2print: web2printRouter,
  // Automation - Automação Inteligente
  automation: automationRouter,
  // Attributes - Atributos Dinâmicos
  attributes: attributesRouter,
  // Product Segments - Múltiplos Segmentos por Produto
  productSegments: productSegmentsRouter,
  // Pricing - Precificação Dinâmica
  pricing: pricingRouter,
  // Pricing Rules - Regras de Precificação Reutilizáveis
  pricingRules: pricingRulesRouter,
  // Delivery Options - Prazos de Entrega
  deliveryOptions: router({
    getByProduct: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await getDeliveryOptionsByProduct(input.productId);
      }),
    create: adminProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string(),
        daysToDeliver: z.number(),
        pricePerM2: z.number().default(0),
        isActive: z.boolean().default(true),
        order: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await createDeliveryOption(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        daysToDeliver: z.number().optional(),
        pricePerM2: z.number().optional(),
        isActive: z.boolean().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateDeliveryOption(id, data);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteDeliveryOption(input.id);
      }),
    reorder: adminProcedure
      .input(z.object({
        updates: z.array(z.object({ id: z.number(), order: z.number() }))
      }))
      .mutation(async ({ input }) => {
        return await reorderDeliveryOptions(input.updates);
      }),
    generateShippingLabel: adminProcedure
      .input(z.object({
        orderId: z.number(),
      }))
      .query(async ({ input }) => {
        throw new TRPCError({ code: 'NOT_IMPLEMENTED', message: 'Módulo de logística em reimplementação.' });
      }),
  }),
  cart: router({
    /**
     * Retorna os itens do carrinho.
     * Funciona para:
     *  - admin logado via Manus OAuth (ctx.user)
     *  - cliente logado via email/senha (cookie customer_session → customerId)
     *  - visitante anônimo (cookie cart_session)
     */
    getItems: publicProcedure.query(async ({ ctx }) => {
      const req = ctx.req as ExpressRequest;
      const userId = ctx.user?.id ?? null;
      const customerSessionToken = getCookieFromReq(req, "customer_session");
      let sessionId: string | null = null;

      // Tentar resolver customerId via customer_session
      if (!userId && customerSessionToken) {
        try {
          const { getDb: getDbInner } = await import("./db");
          const { customerSessions, customerAccounts } = await import("../drizzle/schema");
          const { eq, gt, and } = await import("drizzle-orm");
          const db = await getDbInner();
          if (db) {
            const now = Date.now();
            const [sess] = await db
              .select({ customerId: customerSessions.customerId })
              .from(customerSessions)
              .where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now)))
              .limit(1);
            if (sess) {
              return await getCartByUser(null, `cust_${sess.customerId}`);
            }
          }
        } catch (_) {}
      }

      // Visitante anônimo via cart_session cookie
      if (!userId) {
        sessionId = getCookieFromReq(req, "cart_session") ?? null;
        return await getCartByUser(null, sessionId);
      }

      return await getCartByUser(userId);
    }),

    getCount: publicProcedure.query(async ({ ctx }) => {
      const req = ctx.req as ExpressRequest;
      const userId = ctx.user?.id ?? null;
      const customerSessionToken = getCookieFromReq(req, "customer_session");

      if (!userId && customerSessionToken) {
        try {
          const { getDb: getDbInner } = await import("./db");
          const { customerSessions } = await import("../drizzle/schema");
          const { eq, gt, and } = await import("drizzle-orm");
          const db = await getDbInner();
          if (db) {
            const now = Date.now();
            const [sess] = await db
              .select({ customerId: customerSessions.customerId })
              .from(customerSessions)
              .where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now)))
              .limit(1);
            if (sess) {
              return await getCartItemCount(null, `cust_${sess.customerId}`);
            }
          }
        } catch (_) {}
      }

      if (!userId) {
        const sessionId = getCookieFromReq(req, "cart_session") ?? null;
        return await getCartItemCount(null, sessionId);
      }

      return await getCartItemCount(userId);
    }),

    addItem: publicProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        selectedAttributes: z.string().optional(),
        customDimensions: z.string().optional(),
        priceAtCart: z.number(),
        artFileUrl: z.string().optional(),
        artFileUrls: z.string().optional(),
        notes: z.string().optional(),
        shippingMethod: z.string().optional().default("retirada"),
        shippingPrice: z.number().optional().default(0),
        shippingLabel: z.string().optional(),
        variationSnapshot: z.string().optional(),
        prazoName: z.string().optional(),
        prazoHours: z.number().optional(),
        forecastDate: z.string().optional(),
        forecastLabel: z.string().optional(),
        cepDestino: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const req = ctx.req as ExpressRequest;
        const res = ctx.res as ExpressResponse;
        const userId = ctx.user?.id ?? null;
        const customerSessionToken = getCookieFromReq(req, "customer_session");

        // Resolver customerId via customer_session
        if (!userId && customerSessionToken) {
          try {
            const { getDb: getDbInner } = await import("./db");
            const { customerSessions } = await import("../drizzle/schema");
            const { eq, gt, and } = await import("drizzle-orm");
            const db = await getDbInner();
            if (db) {
              const now = Date.now();
              const [sess] = await db
                .select({ customerId: customerSessions.customerId })
                .from(customerSessions)
                .where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now)))
                .limit(1);
              if (sess) {
                const id = await addToCart({ sessionId: `cust_${sess.customerId}`, ...input });
                return { id };
              }
            }
          } catch (_) {}
        }

        if (userId) {
          const id = await addToCart({ userId, ...input });
          return { id };
        }

        // Visitante anônimo: gerar/usar cart_session cookie
        let sessionId = getCookieFromReq(req, "cart_session");
        if (!sessionId) {
          const { nanoid: nid } = await import("nanoid");
          sessionId = nid(32);
          res.cookie("cart_session", sessionId, {
            ...getSessionCookieOptions(req),
            maxAge: 60 * 60 * 24 * 30, // 30 dias
          });
        }
        const id = await addToCart({ sessionId, ...input });
        return { id };
      }),

    updateQuantity: publicProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const req = ctx.req as ExpressRequest;
        const userId = ctx.user?.id ?? null;
        // Resolver sessionId: customer_session tem PRIORIDADE sobre cart_session
        let sessionId: string | null = null;
        if (!userId) {
          const customerSessionToken = getCookieFromReq(req, "customer_session");
          if (customerSessionToken) {
            try {
              const { getDb: getDbInner } = await import("./db");
              const { customerSessions } = await import("../drizzle/schema");
              const { eq, gt, and } = await import("drizzle-orm");
              const db = await getDbInner();
              if (db) {
                const now = Date.now();
                const [sess] = await db.select({ customerId: customerSessions.customerId }).from(customerSessions).where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now))).limit(1);
                if (sess) sessionId = `cust_${sess.customerId}`;
              }
            } catch (_) {}
          }
          // Fallback para cart_session se não há customer_session
          if (!sessionId) sessionId = getCookieFromReq(req, "cart_session") ?? null;
        }
        // Recalcular frete se o item tem CEP e método de entrega por transportadora
        let newShippingPrice: number | null = null;
        try {
          const db = await getDb();
          if (db) {
            const { sql: drizzleSql } = await import("drizzle-orm");
            // Buscar o item do carrinho para obter cepDestino, shippingMethod e dados do produto
            let cartRow: any = null;
            if (userId) {
              const rows = await db.execute(
                drizzleSql`SELECT ci.cepDestino, ci.shippingMethod, ci.shippingPrice,
                  p.weight, p.height, p.width, p.length
                  FROM cartItems ci JOIN products p ON ci.productId = p.id
                  WHERE ci.id = ${input.id} AND ci.userId = ${userId} LIMIT 1`
              ) as any;
              cartRow = (rows[0] ?? [])[0] ?? null;
            } else if (sessionId) {
              const rows = await db.execute(
                drizzleSql`SELECT ci.cepDestino, ci.shippingMethod, ci.shippingPrice,
                  p.weight, p.height, p.width, p.length
                  FROM cartItems ci JOIN products p ON ci.productId = p.id
                  WHERE ci.id = ${input.id} AND ci.sessionId = ${sessionId} LIMIT 1`
              ) as any;
              cartRow = (rows[0] ?? [])[0] ?? null;
            }
            if (cartRow && cartRow.cepDestino && cartRow.shippingMethod && cartRow.shippingMethod !== "retirada" && !String(cartRow.shippingMethod).startsWith("local_")) {
              // Recalcular frete via Melhor Envio
              const { calculateShipping: calcME } = await import("./melhorenvio-api");
              const { logisticsSettings, carriers } = await import("../drizzle/schema");
              const { eq: eqOp } = await import("drizzle-orm");
              const settingsRows = await db.select().from(logisticsSettings).limit(1);
              const settings = settingsRows[0] ?? null;
              if (settings?.accessToken && settings.originCep) {
                const baseWeight = parseFloat(cartRow.weight ?? '0') || 0.5;
                const baseH = parseFloat(cartRow.height ?? '0') || 5;
                const baseW = parseFloat(cartRow.width ?? '0') || 30;
                const baseL = parseFloat(cartRow.length ?? '0') || 40;
                const qty = input.quantity;
                const totalWeight = Math.max(0.1, baseWeight * qty);
                const stackFactor = Math.ceil(Math.sqrt(qty));
                const payload = {
                  from: { postal_code: settings.originCep },
                  to: { postal_code: cartRow.cepDestino },
                  package: {
                    height: Math.min(baseH * stackFactor, 100),
                    width: baseW,
                    length: baseL,
                    weight: Math.round(totalWeight * 1000) / 1000,
                  },
                  options: { insurance_value: 0, receipt: false, own_hand: false },
                };
                const activeCarriers = await db.select().from(carriers).where(eqOp(carriers.isActive, true));
                const activeCarrierMap = new Map(activeCarriers.map((c: any) => [c.companyId, true]));
                const quotes = await calcME(settings.accessToken, settings.sandbox, payload);
                const targetMethod = String(cartRow.shippingMethod);
                const matched = quotes.find((q: any) => !q.error && activeCarrierMap.has(q.company.id) && String(q.id) === targetMethod);
                if (matched) {
                  newShippingPrice = parseFloat((matched as any).custom_price || (matched as any).price);
                }
              }
            }
          }
        } catch (_) {
          // Silencioso: falha no recálculo não bloqueia a atualização de quantidade
        }
        await updateCartItemQuantity(input.id, userId, input.quantity, sessionId, newShippingPrice);
        return { success: true };
      }),

    removeItem: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const req = ctx.req as ExpressRequest;
        const userId = ctx.user?.id ?? null;
        // Resolver customer_session PRIMEIRO (tem prioridade sobre cart_session)
        let sessionId: string | null = null;
        if (!userId) {
          const customerSessionToken = getCookieFromReq(req, "customer_session");
          if (customerSessionToken) {
            try {
              const { getDb: getDbInner } = await import("./db");
              const { customerSessions } = await import("../drizzle/schema");
              const { eq, gt, and } = await import("drizzle-orm");
              const db = await getDbInner();
              if (db) {
                const now = Date.now();
                const [sess] = await db.select({ customerId: customerSessions.customerId }).from(customerSessions).where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now))).limit(1);
                if (sess) sessionId = `cust_${sess.customerId}`;
              }
            } catch (_) {}
          }
          // Fallback para cart_session se não há customer_session
          if (!sessionId) sessionId = getCookieFromReq(req, "cart_session") ?? null;
        } else {
          sessionId = getCookieFromReq(req, "cart_session") ?? null;
        }
        await removeFromCart(input.id, userId, sessionId);
        return { success: true };
      }),

    clear: publicProcedure.mutation(async ({ ctx }) => {
      const req = ctx.req as ExpressRequest;
      const userId = ctx.user?.id ?? null;
      // Resolver customer_session PRIMEIRO
      let sessionId: string | null = null;
      if (!userId) {
        const customerSessionToken = getCookieFromReq(req, "customer_session");
        if (customerSessionToken) {
          try {
            const { getDb: getDbInner } = await import("./db");
            const { customerSessions } = await import("../drizzle/schema");
            const { eq, gt, and } = await import("drizzle-orm");
            const db = await getDbInner();
            if (db) {
              const now = Date.now();
              const [sess] = await db.select({ customerId: customerSessions.customerId }).from(customerSessions).where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now))).limit(1);
              if (sess) sessionId = `cust_${sess.customerId}`;
            }
          } catch (_) {}
        }
        if (!sessionId) sessionId = getCookieFromReq(req, "cart_session") ?? null;
      }
      await clearCart(userId, sessionId);
      return { success: true };
    }),
  }),

  // ============================================================
  // CHECKOUT ROUTER
  // ============================================================
  checkout: router({
    createOrder: publicProcedure
      .input(z.object({
        deliveryFullName: z.string().min(3),
        deliveryPhone: z.string().min(8),
        deliveryStreet: z.string().optional().default(""),
        deliveryNumber: z.string().optional().default(""),
        deliveryComplement: z.string().optional(),
        deliveryNeighborhood: z.string().optional().default(""),
        deliveryCity: z.string().optional().default(""),
        deliveryState: z.string().optional().default(""),
        deliveryZipCode: z.string().optional().default(""),
        freteId: z.string().optional(), // "retirada" = retirada na loja
        notes: z.string().optional(),
        // Compra como convidado
        guestEmail: z.string().email().optional(),
        guestName: z.string().optional(),
        // Criação opcional de conta
        createAccount: z.boolean().optional(),
        accountPassword: z.string().min(6).optional(),
        // Método de pagamento
        paymentMethod: z.string().optional(),
        termsVersion: z.string().min(1, "É necessário aceitar os termos e condições"),
      }))
      .mutation(async ({ ctx, input }) => {
        const req = ctx.req as ExpressRequest;
        const res = ctx.res as ExpressResponse;
        const userId = ctx.user?.id ?? null;
        const customerSessionToken = getCookieFromReq(req, "customer_session");
        const cartSessionId = getCookieFromReq(req, "cart_session") ?? null;

        // Resolver customerId via customer_session
        let resolvedCustomerId: number | null = null;
        if (!userId && customerSessionToken) {
          try {
            const { getDb: getDbInner } = await import("./db");
            const { customerSessions } = await import("../drizzle/schema");
            const { eq, gt, and } = await import("drizzle-orm");
            const db = await getDbInner();
            if (db) {
              const now = Date.now();
              const [sess] = await db
                .select({ customerId: customerSessions.customerId })
                .from(customerSessions)
                .where(and(eq(customerSessions.token, customerSessionToken), gt(customerSessions.expiresAt, now)))
                .limit(1);
              if (sess) resolvedCustomerId = sess.customerId;
            }
          } catch (_) {}
        }

        // 1. Buscar itens do carrinho
        let cartItems: any[];
        if (userId) {
          cartItems = await getCartByUser(userId);
        } else if (resolvedCustomerId) {
          cartItems = await getCartByUser(null, `cust_${resolvedCustomerId}`);
        } else {
          cartItems = await getCartByUser(null, cartSessionId);
        }

        if (!cartItems || cartItems.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho vazio" });
        }

        // 2. Calcular total (incluindo frete do primeiro item)
        const subtotal = cartItems.reduce(
          (sum: number, item: any) => sum + (parseFloat(item.priceAtCart) * item.quantity),
          0
        );
        const shippingPrice = cartItems[0]?.shippingPrice ? parseFloat(cartItems[0].shippingPrice) : 0;
        const totalPrice = subtotal + shippingPrice;

        // 3. Gerar número do pedido
        const orderNumber = `PD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3b. Verificar se e-mail já está cadastrado (bloquear antes de criar pedido)
        if (!userId && !resolvedCustomerId && input.guestEmail) {
          try {
            const { customerAccounts: caCheck } = await import("../drizzle/schema");
            const { eq: eqCheck } = await import("drizzle-orm");
            const dbCheck = await (await import("./db")).getDb();
            if (dbCheck) {
              const [existingCheck] = await dbCheck.select({ id: caCheck.id }).from(caCheck).where(eqCheck(caCheck.email, input.guestEmail)).limit(1);
              if (existingCheck) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "Este e-mail já possui uma conta cadastrada. Por favor, faça login para continuar.",
                });
              }
            }
          } catch (e: any) {
            if (e instanceof TRPCError) throw e;
          }
        }

        // 3c. Criar conta opcional (se cliente não logado e forneceu senha)
        let finalCustomerId = resolvedCustomerId;
        if (!userId && !resolvedCustomerId && input.accountPassword && input.guestEmail) {
          try {
            const { customerAccounts, customerSessions } = await import("../drizzle/schema");
            const { eq: eqInner } = await import("drizzle-orm");
            const bcryptInner = await import("bcryptjs");
            const { nanoid: nanoidInner } = await import("nanoid");
            const db = await (await import("./db")).getDb();
            if (db) {
              // Verificar se email já existe
              const [existing] = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eqInner(customerAccounts.email, input.guestEmail)).limit(1);
              if (!existing) {
                const nameParts = (input.guestName ?? input.deliveryFullName).trim().split(" ");
                const firstName = nameParts[0] ?? "Cliente";
                const lastName = nameParts.slice(1).join(" ") || "";
                const passwordHash = await bcryptInner.default.hash(input.accountPassword, 10);
                const emailVerificationToken = nanoidInner(32);
                const now = Date.now();
                const [inserted] = await db.insert(customerAccounts).values({
                  email: input.guestEmail,
                  passwordHash,
                  firstName,
                  lastName,
                  phone: input.deliveryPhone,
                  addressZipCode: input.deliveryZipCode,
                  addressStreet: input.deliveryStreet,
                  addressNumber: input.deliveryNumber,
                  addressComplement: input.deliveryComplement ?? null,
                  addressNeighborhood: input.deliveryNeighborhood,
                  addressCity: input.deliveryCity,
                  addressState: input.deliveryState,
                  status: "active" as const,
                  emailVerified: false,
                  emailVerificationToken,
                  createdAt: now,
                  updatedAt: now,
                });
                if (inserted?.insertId) {
                  finalCustomerId = Number(inserted.insertId);
                  // Criar sessão automática
                  const sessionToken = nanoidInner(48);
                  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
                  await db.insert(customerSessions).values({ token: sessionToken, customerId: finalCustomerId, expiresAt, createdAt: now });
                  // Definir cookie de sessão
                  const { getSessionCookieOptions } = await import("./_core/cookies");
                  res.cookie("customer_session", sessionToken, getSessionCookieOptions(req));
                  // Enviar e-mail de boas-vindas
                  try {
                    const { sendWelcomeEmail } = await import("./emailService");
                    await sendWelcomeEmail(input.guestEmail, firstName, emailVerificationToken);
                  } catch (_) {}
                }
              }
              // E-mail já verificado acima, não deve chegar aqui
            }
          } catch (e) {
            console.error("[CHECKOUT] Erro ao criar conta opcional:", e);
          }
        }

        // 4. Gerar guestToken para convidados (sem conta)
        const isGuest = !userId && !finalCustomerId;
        let guestToken: string | null = null;
        if (isGuest) {
          const { nanoid: nanoidGuest } = await import("nanoid");
          guestToken = nanoidGuest(48);
        }

        // 5. Montar payload
        const orderPayload = {
          userId: userId ?? 0, // 0 = pedido de visitante
          clientId: userId ?? 0,
          customerId: finalCustomerId ?? null,
          orderNumber,
          totalPrice,
          notes: input.notes,
          deliveryStreet: input.deliveryStreet,
          deliveryNumber: input.deliveryNumber,
          deliveryComplement: input.deliveryComplement,
          deliveryNeighborhood: input.deliveryNeighborhood,
          deliveryCity: input.deliveryCity,
          deliveryState: input.deliveryState,
          deliveryZipCode: input.deliveryZipCode,
          deliveryFullName: input.deliveryFullName,
          deliveryPhone: input.deliveryPhone,
          guestToken,
          guestEmail: isGuest ? (input.guestEmail ?? null) : null,
          guestName: isGuest ? (input.guestName ?? input.deliveryFullName) : null,
          shippingMethod: cartItems[0]?.shippingMethod ?? null,
          shippingPrice: shippingPrice,
          shippingLabel: cartItems[0]?.shippingLabel ?? null,
          paymentMethod: input.paymentMethod ?? null,
          termsAcceptedAt: new Date(),
          termsVersion: input.termsVersion,
          termsDocuments: JSON.stringify({ "Termos e Condições de Venda": input.termsVersion }),
          // Status inicial baseado no método de pagamento:
          // - PIX / cartão = pagamento_aprovado (já pago)
          // - retirada = pagamento_retirada (pagar na retirada)
          // - outros = analisando
          initialStatus: input.paymentMethod === "pagar_na_retirada"
            ? "pagamento_retirada"
            : (input.paymentMethod === "pix" || input.paymentMethod === "cartao_credito")
              ? "pagamento_aprovado"
              : "analisando",
          cartItems: cartItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName ?? "Produto",
            quantity: item.quantity,
            priceAtCart: parseFloat(item.priceAtCart),
            selectedAttributes: item.selectedAttributes ?? undefined,
            variationSnapshot: item.variationSnapshot ?? undefined,
            customDimensions: item.customDimensions ?? undefined,
            artFileUrl: item.artFileUrl ?? undefined,
            notes: item.notes ?? undefined,
          })),
        };

        // 6. Criar pedido
        const orderId = await createOrderFromCart(orderPayload);

        // 7. Limpar carrinho
        if (userId) {
          await clearCart(userId);
        } else if (finalCustomerId) {
          await clearCart(null, `cust_${finalCustomerId}`);
        } else if (cartSessionId) {
          await clearCart(null, cartSessionId);
          res.clearCookie("cart_session");
        }

        // 8. Enviar e-mail de confirmação
        // Buscar e-mail do cliente em todos os cenários:
        // a) convidado sem conta → input.guestEmail
        // b) cliente com conta própria (customerAccount) → buscar no banco
        // c) cliente Manus OAuth (userId) → buscar no banco de users
        let emailTo: string | null = input.guestEmail ?? null;
        let emailFirstName = (input.guestName ?? input.deliveryFullName).split(" ")[0] ?? "Cliente";

        if (!emailTo && finalCustomerId) {
          try {
            const { customerAccounts: caTable } = await import("../drizzle/schema");
            const { eq: eqEmail } = await import("drizzle-orm");
            const dbEmail = await (await import("./db")).getDb();
            if (dbEmail) {
              const [ca] = await dbEmail
                .select({ email: caTable.email, firstName: caTable.firstName })
                .from(caTable)
                .where(eqEmail(caTable.id, finalCustomerId))
                .limit(1);
              if (ca?.email) {
                emailTo = ca.email;
                emailFirstName = ca.firstName || emailFirstName;
              }
            }
          } catch (_) {}
        }

        if (!emailTo && userId) {
          try {
            const { users } = await import("../drizzle/schema");
            const { eq: eqEmail } = await import("drizzle-orm");
            const dbEmail = await (await import("./db")).getDb();
            if (dbEmail) {
              const [u] = await dbEmail
                .select({ email: users.email, name: users.name })
                .from(users)
                .where(eqEmail(users.id, userId))
                .limit(1);
              if (u?.email) {
                emailTo = u.email;
                emailFirstName = (u.name || emailFirstName).split(" ")[0];
              }
            }
          } catch (_) {}
        }

        if (emailTo) {
          try {
            const { sendOrderConfirmationWithLink } = await import("./emailService");
            const trackUrl = guestToken
              ? `${process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space"}/pedido/acompanhar/${guestToken}`
              : `${process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space"}/pedido/${orderId}`;
            const result = await sendOrderConfirmationWithLink(emailTo, emailFirstName, orderNumber, totalPrice.toFixed(2), trackUrl);
            console.log(`[CHECKOUT] E-mail de confirmação enviado para ${emailTo}:`, result);
          } catch (e) {
            console.error("[CHECKOUT] Erro ao enviar e-mail de confirmação:", e);
          }
        } else {
          console.warn("[CHECKOUT] Nenhum e-mail encontrado para envio de confirmação. OrderNumber:", orderNumber);
        }

        // 9. Log de diagnóstico
        console.log("[CHECKOUT] Pedido criado:", {
          orderNumber,
          subtotal,
          shippingPrice,
          totalPrice,
          shippingMethod: cartItems[0]?.shippingMethod,
          shippingLabel: cartItems[0]?.shippingLabel,
        });

        return { orderId, orderNumber, guestToken, totalPrice };
      }),

    getOrderByNumber: publicProcedure
      .input(z.object({ orderNumber: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const dbInstance = await getDb();
        if (!dbInstance) return null;
        const { orders, orderItems } = await import("../drizzle/schema");
        const { eq, sql: drizzleSql } = await import("drizzle-orm");
        // Fetch order
        const orderRows = await dbInstance.select().from(orders).where(eq(orders.orderNumber, input.orderNumber)).limit(1);
        let order = orderRows[0] ?? null;
        // Fallback: se não encontrou pelo orderNumber, tenta pelo ID numérico
        if (!order && /^\d+$/.test(input.orderNumber)) {
          const { eq: eqId } = await import("drizzle-orm");
          const byIdRows = await dbInstance.select().from(orders).where(eqId(orders.id, parseInt(input.orderNumber))).limit(1);
          order = byIdRows[0] ?? null;
        }
        if (!order) return null;
        // Fetch items with product image
        const itemRows = await dbInstance.execute(
          drizzleSql`SELECT oi.*, p.imageUrl as productImage FROM orderItems oi LEFT JOIN products p ON oi.productId = p.id WHERE oi.orderId = ${order.id}`
        ) as any;
        const items = (itemRows[0] ?? []) as any[];
        return { order, items };
      }),
    getOrderByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const dbInstance = await getDb();
        if (!dbInstance) return null;
        const { orders, orderItems, orderStatusHistory } = await import("../drizzle/schema");
        const { eq, sql: drizzleSql } = await import("drizzle-orm");
        const orderRows = await dbInstance.select().from(orders).where(eq(orders.guestToken, input.token)).limit(1);
        const order = orderRows[0] ?? null;
        if (!order) return null;
        const itemRows = await dbInstance.execute(
          drizzleSql`SELECT oi.*, p.imageUrl as productImage FROM orderItems oi LEFT JOIN products p ON oi.productId = p.id WHERE oi.orderId = ${order.id}`
        ) as any;
        const items = (itemRows[0] ?? []) as any[];
        const history = await dbInstance.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id));
        return { order, items, history };
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await getOrdersByUser(ctx.user.id);
    }),

        getOrderById: adminAnyProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Suporta admin_session e Manus OAuth — admin pode ver qualquer pedido
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        const { sql: sqlOp } = await import("drizzle-orm");
        const itemRows = await db.execute(
          sqlOp`SELECT oi.*, p.imageUrl as productImage FROM orderItems oi LEFT JOIN products p ON oi.productId = p.id WHERE oi.orderId = ${input.id}`
        ) as any;
        const items = (itemRows[0] ?? []) as any[];
        // Buscar dados completos do cliente (customerAccount + endereço padrão)
        let customerData: any = null;
        const orderAny = order as any;
        if (orderAny.customerId) {
          const customerRows = await db.execute(
            sqlOp`SELECT
              ca.id, ca.firstName, ca.lastName, ca.email, ca.phone, ca.cpfCnpj,
              COALESCE(addr.fullName, CONCAT(ca.firstName, ' ', ca.lastName)) as addrFullName,
              COALESCE(addr.phone, ca.phone) as addrPhone,
              COALESCE(addr.street, ca.addressStreet) as street,
              COALESCE(addr.number, ca.addressNumber) as number,
              COALESCE(addr.complement, ca.addressComplement) as complement,
              COALESCE(addr.neighborhood, ca.addressNeighborhood) as neighborhood,
              COALESCE(addr.city, ca.addressCity) as city,
              COALESCE(addr.state, ca.addressState) as state,
              COALESCE(addr.zipCode, ca.addressZipCode) as zipCode
            FROM customer_accounts ca
            LEFT JOIN customerAddresses addr ON addr.userId = ca.id AND addr.isDefault = 1
            WHERE ca.id = ${orderAny.customerId}
            LIMIT 1`
          ) as any;
          customerData = (customerRows[0] ?? [])[0] ?? null;
        }
        return { ...order, items, customerData };
      }),
    getOrderHistory: adminAnyProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        // Suporta admin_session e Manus OAuth — admin pode ver histórico de qualquer pedido
        return await getOrderStatusHistory(input.orderId);
      }),
    reorder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Buscar pedido original
        const order = await getOrderDetailByUser(input.orderId, ctx.user.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        // Adicionar cada item do pedido ao carrinho — clonar 100% dos campos
        let addedCount = 0;
        for (const item of (order as any).items ?? []) {
          await addToCart({
            userId: ctx.user.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtCart: parseFloat(item.priceAtOrder ?? item.priceAtCart ?? "0"),
            selectedAttributes: item.selectedAttributes ?? undefined,
            customDimensions: item.customDimensions ?? undefined,
            artFileUrl: item.artFileUrl ?? undefined,
            notes: item.notes ?? undefined,
            shippingMethod: item.shippingMethod ?? undefined,
            shippingPrice: item.shippingPrice ? parseFloat(item.shippingPrice) : undefined,
            shippingLabel: item.shippingLabel ?? undefined,
            variationSnapshot: item.variationSnapshot ?? undefined,
            prazoName: item.prazoName ?? undefined,
            prazoHours: item.prazoHours ?? undefined,
            forecastDate: item.forecastDate ?? undefined,
            forecastLabel: item.forecastLabel ?? undefined,
            cepDestino: item.cepDestino ?? undefined,
          });
          addedCount++;
        }
        return { addedCount };
      }),
    getAllOrders: adminAnyProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { orders: ordersTable, deletedOrders: deletedOrdersTable } = await import("../drizzle/schema.js");
      const { desc, sql } = await import("drizzle-orm");
      const deletedRows = await db.select({ orderId: deletedOrdersTable.orderId }).from(deletedOrdersTable);
      if (!deletedRows.length) return db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
      return db.select().from(ordersTable)
        .where(sql`${ordersTable.id} NOT IN (${sql.join(deletedRows.map((row) => sql`${row.orderId}`), sql`, `)})`)
        .orderBy(desc(ordersTable.createdAt));
    }),
    updateOrderStatus: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        newStatus: z.enum(["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await updateOrderStatus(input.orderId, input.newStatus, input.notes);
        return result;
      }),

    // ── Arquivos do cliente por pedido ──────────────────────────────────────
    getOrderFiles: adminAnyProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { orderItems: oi } = await import("../drizzle/schema.js");
        const { eq, sql: drizzleSql } = await import("drizzle-orm");
        const rows = await db.select().from(oi).where(eq(oi.orderId, input.orderId));
        // Retorna apenas itens que possuem arquivo
        return rows
          .filter((r: any) => r.artFileUrl)
          .map((r: any) => ({
            id: r.id,
            productName: r.productName ?? "Produto",
            artFileUrl: r.artFileUrl,
            quantity: r.quantity,
          }));
      }),

    // ── Prévia de arte (admin envia imagem para o cliente ver) ──────────────
    getArtPreviews: publicProcedure
      .input(z.object({ orderId: z.number(), orderItemId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        const { eq, and, desc } = await import("drizzle-orm");
        if (input.orderItemId != null) {
          return db.select().from(orderArtPreviews)
            .where(and(eq(orderArtPreviews.orderId, input.orderId), eq(orderArtPreviews.orderItemId, input.orderItemId)))
            .orderBy(desc(orderArtPreviews.createdAt));
        }
        return db.select().from(orderArtPreviews).where(eq(orderArtPreviews.orderId, input.orderId)).orderBy(desc(orderArtPreviews.createdAt));
      }),

    getArtPreviewsByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { orders: ordersTable, orderArtPreviews } = await import("../drizzle/schema.js");
        const { eq, desc } = await import("drizzle-orm");
        const orderRows = await db.select().from(ordersTable).where(eq(ordersTable.guestToken, input.token)).limit(1);
        const order = orderRows[0] ?? null;
        if (!order) return [];
        return db.select().from(orderArtPreviews).where(eq(orderArtPreviews.orderId, order.id)).orderBy(desc(orderArtPreviews.createdAt));
      }),

    saveArtPreview: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        orderItemId: z.number().optional(),
        imageUrl: z.string(),
        imageKey: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        // Suporta tanto admin_session (adminUser.adminId) quanto Manus OAuth (user.id)
        const uploadedBy = (ctx as any).adminUser?.adminId ?? (ctx as any).user?.id ?? 0;
        await db.insert(orderArtPreviews).values({
          orderId: input.orderId,
          orderItemId: input.orderItemId ?? null,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          uploadedBy,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),

    deleteArtPreview: adminAnyProcedure
      .input(z.object({ previewId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await db.delete(orderArtPreviews).where(eq(orderArtPreviews.id, input.previewId));
        return { success: true };
      }),

    // ── Histórico de logs por item ────────────────────────────────────────────────────────────────────────
    getOrderItemLogs: adminAnyProcedure
      .input(z.object({ orderItemId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItemLogs: orderItemLogsT } = await import("../drizzle/schema.js");
        const { eq, asc } = await import("drizzle-orm");
        const logs = await db.select().from(orderItemLogsT)
          .where(eq(orderItemLogsT.orderItemId, input.orderItemId))
          .orderBy(asc(orderItemLogsT.createdAt));
        return logs;
      }),

    // ── Registrar log de download de arte pelo operador ────────────────────────────────────────────────────────────────────────
    logArtDownload: adminAnyProcedure
      .input(z.object({ orderItemId: z.number(), orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { success: false };
        try {
          const { orderItemLogs: orderItemLogsT } = await import("../drizzle/schema.js");
          const operatorName = (ctx as any).adminUser?.name ?? "Operador";
          await db.insert(orderItemLogsT).values({
            orderItemId: input.orderItemId,
            orderId: input.orderId,
            action: "O operador baixou a nova versão da arte",
            operatorName,
            createdAt: Date.now(),
          } as any);
        } catch (e) {
          console.error("[LOG] Erro ao registrar log de download:", e);
        }
        return { success: true };
      }),

    // ── Prazo de entrega ────────────────────────────────────────────────────────────────────────────────────
    setDeliveryDeadline: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        // timestamp em ms (UTC) ou null para remover
        deadlineTs: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orders: ordersTable } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await db.update(ordersTable)
          .set({ deliveryDeadline: input.deadlineTs } as any)
          .where(eq(ordersTable.id, input.orderId));
        return { success: true };
      }),
    // ── Reconciliação de itens do pedido (admin) ─────────────────────────────────────────────────────────
    addOrderItem: adminAnyProcedure
      .input(z.object({
        orderId: z.number(),
        productId: z.number().optional(),
        productName: z.string().min(1),
        quantity: z.number().min(1),
        priceAtOrder: z.number().min(0),
        selectedAttributes: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { sql: sqlOp } = await import("drizzle-orm");
        await db.execute(sqlOp`
          INSERT INTO orderItems (orderId, productId, productName, quantity, priceAtOrder, selectedAttributes, notes)
          VALUES (${input.orderId}, ${input.productId ?? null}, ${input.productName}, ${input.quantity}, ${input.priceAtOrder},
            ${input.selectedAttributes ?? null}, ${input.notes ?? null})
        `);
        return { success: true };
      }),

    deleteOrderItem: adminAnyProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { sql: sqlOp } = await import("drizzle-orm");
        await db.execute(sqlOp`DELETE FROM orderItems WHERE id = ${input.itemId}`);
        return { success: true };
      }),

    getMyOrdersFiltered: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        orderBy: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const orders = await getOrdersByUser(ctx.user.id);
        let filtered = orders as any[];
        // Filter by status
        if (input.status && input.status !== "all") {
          filtered = filtered.filter((o: any) => o.status === input.status);
        }
        // Filter by search (order number)
        if (input.search) {
          const q = input.search.toLowerCase();
          filtered = filtered.filter((o: any) =>
            o.orderNumber?.toLowerCase().includes(q)
          );
        }
        // Sort
        if (input.orderBy === "oldest") {
          filtered.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (input.orderBy === "highest") {
          filtered.sort((a: any, b: any) => parseFloat(b.totalPrice) - parseFloat(a.totalPrice));
        } else if (input.orderBy === "lowest") {
          filtered.sort((a: any, b: any) => parseFloat(a.totalPrice) - parseFloat(b.totalPrice));
        } else {
          // newest (default)
          filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
                return filtered;
      }),

    // ── Fluxo de Correção de Artes ──────────────────────────────────────────────────────────────────────────────
    saveArtCorrectionAction: adminAnyProcedure
      .input(z.object({
        orderItemId: z.number(),
        requireClientResend: z.boolean().optional(),
        sendProofForApproval: z.boolean().optional(),
        operatorNote: z.string().optional(),
        termText: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems, orders } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const correctionAction = input.requireClientResend ? "resend" : (input.sendProofForApproval ? "proof" : null);
        
        // Atualiza o item com a ação e a nota do operador
        await db.update(orderItems)
          .set({
            requireClientResend: input.requireClientResend ?? false,
            sendProofForApproval: input.sendProofForApproval ?? false,
            correctionAction: correctionAction,
            operatorNote: input.operatorNote ?? null,
            termText: input.termText ?? null,
            // Muda o status de pré-impressão conforme a ação
            preProductionStatus: input.requireClientResend ? "com_problemas" : (input.sendProofForApproval ? "aguardando_aprovacao" : undefined),
          } as any)
          .where(eq(orderItems.id, input.orderItemId));
        
        // Busca o orderId para atualizar o status do pedido
        // NOTA: Removemos a transição automática para "analisando" aqui.
        // O status do pedido agora só muda para "com_problemas" se o operador exigir reenvio.
        // A mudança para "analisando" deve ser feita manualmente pelo operador.
        const itemRows = await db.select().from(orderItems).where(eq(orderItems.id, input.orderItemId)).limit(1);
        const item = itemRows[0];
        if (item?.orderId) {
          // Apenas muda para "com_problemas" se reenvio foi exigido
          const newOrderStatus = input.requireClientResend ? "com_problemas" : null;
          if (newOrderStatus) {
            await db.update(orders).set({ status: newOrderStatus } as any).where(eq(orders.id, item.orderId));
          }
        }
        
        // Registrar log de ação do operador
        try {
          const { orderItemLogs: orderItemLogsT2 } = await import("../drizzle/schema.js");
          const operatorName2 = (ctx as any).adminUser?.name ?? "Operador";
          const actionLabel2 = input.requireClientResend
            ? "Exigiu reenvio de arte"
            : (input.sendProofForApproval ? "Enviou prova para aprovação" : "Atualizou ação de correção");
          if (item?.orderId) {
            await db.insert(orderItemLogsT2).values({
              orderItemId: input.orderItemId,
              orderId: item.orderId,
              action: actionLabel2,
              operatorName: operatorName2,
              createdAt: Date.now(),
            } as any);
          }
        } catch (logErr2) {
          console.error("[LOG] Erro ao registrar log de ação:", logErr2);
        }

        // Notifica o operador sobre o envio
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          const productName = item?.productName ?? `Item #${input.orderItemId}`;
          const actionLabel = input.requireClientResend ? "Reenvio de Arte Solicitado" : "Prova Enviada para Aprovação";
          await notifyOwner({
            title: `📤 ${actionLabel}`,
            content: `Operador enviou ação "${actionLabel}" para o produto "${productName}" (Item ID: ${input.orderItemId}). O cliente será notificado.`,
          });
        } catch (e) {
          console.error("Erro ao notificar:", e);
        }

        // ── Enviar e-mail ao cliente ─────────────────────────────────────────
        try {
          if (item?.orderId) {
            const { orders: ordersT2, customerAccounts, users } = await import("../drizzle/schema.js");
            const { eq: eqEmail } = await import("drizzle-orm");
            const orderRows2 = await db.select().from(ordersT2).where(eqEmail(ordersT2.id, item.orderId)).limit(1);
            const order2 = orderRows2[0];
            if (order2) {
              const orderNumber = (order2 as any).orderNumber ?? String(order2.id);
              const productNameEmail = (item as any).productName ?? `Item #${input.orderItemId}`;
              const operatorNoteEmail = (input.operatorNote ?? null) as string | null;
              const SITE_URL = process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space";
              const guestTokenEmail = (order2 as any).guestToken;
              const trackUrl = guestTokenEmail
                ? `${SITE_URL}/pedido/acompanhar/${guestTokenEmail}`
                : `${SITE_URL}/pedido/${order2.id}`;

              // Determinar e-mail e nome do cliente (3 caminhos em ordem de prioridade)
              let emailTo: string | null = null;
              let firstName = "Cliente";

              // 1) Conta de cliente (customerId)
              const customerId = (order2 as any).customerId;
              if (customerId) {
                const caRows = await db.select({ email: customerAccounts.email, firstName: customerAccounts.firstName })
                  .from(customerAccounts).where(eqEmail(customerAccounts.id, customerId)).limit(1);
                if (caRows[0]?.email) {
                  emailTo = caRows[0].email;
                  firstName = caRows[0].firstName || firstName;
                }
              }

              // 2) Usuário Manus (userId)
              if (!emailTo) {
                const userId = (order2 as any).userId;
                if (userId) {
                  const uRows = await db.select({ email: users.email, name: users.name })
                    .from(users).where(eqEmail(users.id, userId)).limit(1);
                  if (uRows[0]?.email) {
                    emailTo = uRows[0].email;
                    firstName = (uRows[0].name || firstName).split(" ")[0];
                  }
                }
              }

              // 3) E-mail de convidado
              if (!emailTo) {
                emailTo = (order2 as any).guestEmail ?? null;
                if (emailTo) firstName = ((order2 as any).guestName || firstName).split(" ")[0];
              }

              if (emailTo) {
                const { sendArtResendRequestEmail, sendProofForApprovalEmail } = await import("./emailService.js");
                if (input.requireClientResend) {
                  const result = await sendArtResendRequestEmail(emailTo, firstName, orderNumber, productNameEmail, operatorNoteEmail, trackUrl);
                  console.log(`[EMAIL] Reenvio de arte enviado para ${emailTo}:`, result);
                  // Registrar no histórico de e-mails
                  try {
                    await addEmailToHistory({
                      orderId: item.orderId,
                      orderItemId: input.orderItemId,
                      recipientEmail: emailTo,
                      recipientName: firstName,
                      emailType: 'art_resend_request',
                      subject: `⚠️ Reenvio de arte necessário — Pedido #${orderNumber}`,
                      templateName: 'sendArtResendRequestEmail',
                      operatorNote: operatorNoteEmail,
                      status: result.success ? 'sent' : 'failed',
                      errorMessage: result.success ? null : result.error,
                    });
                  } catch (e) {
                    console.error('[EMAIL] Erro ao registrar e-mail no histórico:', e);
                  }
                } else if (input.sendProofForApproval) {
                  // Buscar URL da prévia mais recente do item
                  const { orderArtPreviews } = await import("../drizzle/schema.js");
                  const { eq: eqPrev, desc: descPrev } = await import("drizzle-orm");
                  const previewRows = await db.select().from(orderArtPreviews)
                    .where(eqPrev((orderArtPreviews as any).orderItemId, input.orderItemId))
                    .orderBy(descPrev((orderArtPreviews as any).createdAt))
                    .limit(1);
                  const proofImageUrl = (previewRows[0] as any)?.imageUrl ?? null;
                  const result = await sendProofForApprovalEmail(emailTo, firstName, orderNumber, productNameEmail, operatorNoteEmail, proofImageUrl, trackUrl);
                  console.log(`[EMAIL] Prova para aprovação enviada para ${emailTo}:`, result);
                  // Registrar no histórico de e-mails
                  try {
                    await addEmailToHistory({
                      orderId: item.orderId,
                      orderItemId: input.orderItemId,
                      recipientEmail: emailTo,
                      recipientName: firstName,
                      emailType: 'proof_for_approval',
                      subject: `Sua prova de arte está pronta — Pedido #${orderNumber}`,
                      templateName: 'sendProofForApprovalEmail',
                      operatorNote: operatorNoteEmail,
                      proofImageUrl: proofImageUrl,
                      status: result.success ? 'sent' : 'failed',
                      errorMessage: result.success ? null : result.error,
                    });
                  } catch (e) {
                    console.error('[EMAIL] Erro ao registrar e-mail no histórico:', e);
                  }
                }
              } else {
                console.warn(`[EMAIL] Nenhum e-mail encontrado para o pedido ${orderNumber}`);
              }
            }
          }
        } catch (emailErr) {
          console.error("[EMAIL] Erro ao enviar e-mail ao cliente:", emailErr);
          // Não lançar erro — o e-mail é secundário, não deve bloquear a ação
        }

        return { success: true, correctionAction };
      }),

    getItemCorrectionAction: publicProcedure
      .input(z.object({ orderItemId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const { orderItems } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(orderItems).where(eq(orderItems.id, input.orderItemId)).limit(1);
        const item = rows[0];
        if (!item) return null;
        return {
          requireClientResend: (item as any).requireClientResend ?? false,
          sendProofForApproval: (item as any).sendProofForApproval ?? false,
          correctionAction: (item as any).correctionAction ?? null,
          operatorNote: (item as any).operatorNote ?? null,
          termText: (item as any).termText ?? null,
          clientRefusalNote: (item as any).clientRefusalNote ?? null,
        };
      }),

    clientRefuseProof: publicProcedure
      .input(z.object({ orderItemId: z.number(), refusalNote: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems, orders, customerSessions } = await import("../drizzle/schema.js");
        const { eq, and, gt } = await import("drizzle-orm");

        // ── Valida propriedade do pedido quando cliente está logado ──
        const req = ctx.req as ExpressRequest;
        const customerToken = getCookieFromReq(req, "customer_session");
        if (customerToken) {
          const now = Date.now();
          const [session] = await db
            .select({ customerId: customerSessions.customerId })
            .from(customerSessions)
            .where(and(eq(customerSessions.token, customerToken), gt(customerSessions.expiresAt, now)))
            .limit(1);
          if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
          // Verifica se o item pertence a um pedido do cliente
          const [itemCheck] = await db
            .select({ id: orderItems.id })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(eq(orderItems.id, input.orderItemId), eq(orders.customerId, session.customerId)))
            .limit(1);
          if (!itemCheck) throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não encontrado ou sem permissão." });
        }

        // Salva a nota de recusa e volta o status para "com_problemas"
        await db.update(orderItems)
          .set({
            clientRefusalNote: input.refusalNote,
            preProductionStatus: "com_problemas",
            correctionAction: null,
          } as any)
          .where(eq(orderItems.id, input.orderItemId));

        // Busca o orderId e orderNumber para notificação
        const itemRows = await db
          .select()
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(eq(orderItems.id, input.orderItemId))
          .limit(1);
        const item = (itemRows[0] as any)?.orderItems ?? (itemRows[0] as any);
        const order = (itemRows[0] as any)?.orders;
        const orderNumber = order?.orderNumber ?? item?.orderId ?? "";

        if (item?.orderId) {
          await db.update(orders).set({ status: "com_problemas" } as any).where(eq(orders.id, item.orderId));
        }

        // Notifica o operador com número do pedido e link direto
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          const productName = item?.productName ?? `Item #${input.orderItemId}`;
          const SITE_URL = process.env.VITE_SITE_URL || "https://mariaimprime.com.br";
          const orderId = order?.id ?? item?.orderId ?? "";
          const adminOrderUrl = `${SITE_URL}/admin/pedidos/${orderId}`;
          await notifyOwner({
            title: "❌ Prova Recusada pelo Cliente",
            content: `O cliente recusou a prova do produto "${productName}" no pedido #${orderNumber}.\n\nMotivo: "${input.refusalNote}"\n\nAcesse o pedido diretamente: ${adminOrderUrl}`,
          });
        } catch (e) {
          console.error("Erro ao notificar:", e);
        }

        return { success: true, message: "Prova recusada. Operador será notificado." };
      }),

    clientResendArt: publicProcedure
      .input(z.object({ orderItemId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems, orders, customerSessions } = await import("../drizzle/schema.js");
        const { eq, and, gt } = await import("drizzle-orm");

        // ── Valida propriedade do pedido quando cliente está logado ──
        const req = ctx.req as ExpressRequest;
        const customerToken = getCookieFromReq(req, "customer_session");
        if (customerToken) {
          const now = Date.now();
          const [session] = await db
            .select({ customerId: customerSessions.customerId })
            .from(customerSessions)
            .where(and(eq(customerSessions.token, customerToken), gt(customerSessions.expiresAt, now)))
            .limit(1);
          if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
          const [itemCheck] = await db
            .select({ id: orderItems.id })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(eq(orderItems.id, input.orderItemId), eq(orders.customerId, session.customerId)))
            .limit(1);
          if (!itemCheck) throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não encontrado ou sem permissão." });
        }

        // Busca informações do item e pedido
        const itemRows = await db
          .select()
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(eq(orderItems.id, input.orderItemId))
          .limit(1);
        const item = (itemRows[0] as any)?.orderItems ?? (itemRows[0] as any);
        const order = (itemRows[0] as any)?.orders;
        const orderNumber = order?.orderNumber ?? item?.orderId ?? "";

        // Atualiza status de pré-impressão de volta para "Analisando"
        await db.update(orderItems)
          .set({ preProductionStatus: "liberado_analise" } as any)
          .where(eq(orderItems.id, input.orderItemId));

        // Notifica o operador com número do pedido e link direto
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          const productName = item?.productName ?? `Item #${input.orderItemId}`;
          const SITE_URL = process.env.VITE_SITE_URL || "https://mariaimprime.com.br";
          const orderId = order?.id ?? item?.orderId ?? "";
          const adminOrderUrl = `${SITE_URL}/admin/pedidos/${orderId}`;
          await notifyOwner({
            title: "📨 Arte Reenviada pelo Cliente",
            content: `O cliente reenviou a arte do produto "${productName}" no pedido #${orderNumber}. O status voltou para "Analisando".\n\nAcesse o pedido diretamente: ${adminOrderUrl}`,
          });
        } catch (e) {
          console.error("Erro ao notificar operador:", e);
        }

        return { success: true, message: "Arte reenviada. Status retornou para Análise" };
      }),

    clientApproveProof: publicProcedure
      .input(z.object({ orderItemId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems, orders, customerSessions } = await import("../drizzle/schema.js");
        const { eq, and, gt } = await import("drizzle-orm");

        // ── Valida propriedade do pedido quando cliente está logado ──
        const req = ctx.req as ExpressRequest;
        const customerToken = getCookieFromReq(req, "customer_session");
        if (customerToken) {
          const now = Date.now();
          const [session] = await db
            .select({ customerId: customerSessions.customerId })
            .from(customerSessions)
            .where(and(eq(customerSessions.token, customerToken), gt(customerSessions.expiresAt, now)))
            .limit(1);
          if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });
          const [itemCheck] = await db
            .select({ id: orderItems.id })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(eq(orderItems.id, input.orderItemId), eq(orders.customerId, session.customerId)))
            .limit(1);
          if (!itemCheck) throw new TRPCError({ code: "FORBIDDEN", message: "Pedido não encontrado ou sem permissão." });
        }

        // Busca informações do item e pedido
        const itemRows = await db
          .select()
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(eq(orderItems.id, input.orderItemId))
          .limit(1);
        const item = (itemRows[0] as any)?.orderItems ?? (itemRows[0] as any);
        const order = (itemRows[0] as any)?.orders;
        const orderNumber = order?.orderNumber ?? item?.orderId ?? "";

        await db.update(orderItems)
          .set({
            preProductionStatus: "arte_final_aprovada",
            correctionAction: null,          // limpa a prova pendente
            sendProofForApproval: false,     // reseta flag de prova
          } as any)
          .where(eq(orderItems.id, input.orderItemId));

        // Notifica o operador com número do pedido e link direto
        try {
          const { notifyOwner } = await import("./_core/notification.js");
          const productName = item?.productName ?? `Item #${input.orderItemId}`;
          const SITE_URL = process.env.VITE_SITE_URL || "https://mariaimprime.com.br";
          const orderId = order?.id ?? item?.orderId ?? "";
          const adminOrderUrl = `${SITE_URL}/admin/pedidos/${orderId}`;
          await notifyOwner({
            title: "✅ Arte Aprovada pelo Cliente",
            content: `O cliente aprovou a prova da arte do produto "${productName}" no pedido #${orderNumber}. A produção pode ser iniciada!\n\nAcesse o pedido diretamente: ${adminOrderUrl}`,
          });
        } catch (e) {
          console.error("Erro ao notificar operador:", e);
        }

        return { success: true, message: "Arte aprovada! Produção iniciada" };
      }),

    // ─────────────────────────────────────────────────────────────────────────
    // Procedures para histórico de e-mails
    // ─────────────────────────────────────────────────────────────────────────
    getEmailHistory: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getEmailHistory(input.orderId);
      }),

    getEmailHistoryByOrderItem: publicProcedure
      .input(z.object({ orderItemId: z.number() }))
      .query(async ({ input }) => {
        return await getEmailHistoryByOrderItem(input.orderItemId);
      }),

    /**
     * Retorna o estado agregado das artes de uma lista de pedidos.
     * Usado pelo Kanban para exibir tags visuais (⏳/⚠️/❌) nos cards.
     * artState:
     *   "waiting"  → operador enviou prova/correção, cliente ainda não respondeu
     *   "approved" → todos os itens aprovados pelo cliente
     *   "refused"  → pelo menos um item recusado pelo cliente
     *   "none"     → sem movimentação de arte
     */
    getOrdersArtStatus: publicProcedure
      .input(z.object({ orderIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        if (!input.orderIds.length) return {};
        const db = await getDb();
        if (!db) return {};
        const { orderItems } = await import("../drizzle/schema.js");
        const { inArray: inArr } = await import("drizzle-orm");

        const rows = await db
          .select({
            orderId: orderItems.orderId,
            preProductionStatus: orderItems.preProductionStatus,
            correctionAction: orderItems.correctionAction,
            clientRefusalNote: orderItems.clientRefusalNote,
          })
          .from(orderItems)
          .where(inArr(orderItems.orderId, input.orderIds));

        // Agregar por pedido
        const result: Record<number, "waiting" | "approved" | "refused" | "none"> = {};
        for (const orderId of input.orderIds) {
          const items = rows.filter(r => r.orderId === orderId);
          if (!items.length) { result[orderId] = "none"; continue; }

          const hasRefused = items.some(i =>
            (i.preProductionStatus === "com_problemas" && i.clientRefusalNote)
          );
          const allApproved = items.every(i => i.preProductionStatus === "arte_final_aprovada");
          const hasWaiting = items.some(i =>
            i.correctionAction === "resend" ||
            i.correctionAction === "proof" ||
            i.preProductionStatus === "aguardando_aprovacao"
          );

          if (hasRefused) result[orderId] = "refused";
          else if (allApproved) result[orderId] = "approved";
          else if (hasWaiting) result[orderId] = "waiting";
          else result[orderId] = "none";
        }
        return result;
      }),

    /**
     * Envia pedido para produção — só permitido quando todos os itens
     * têm preProductionStatus === 'arte_final_aprovada'.
     */
    sendToProduction: adminAnyProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderItems, orders } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");

        // Verifica se todos os itens estão aprovados
        const items = await db
          .select({ preProductionStatus: orderItems.preProductionStatus })
          .from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));

        if (!items.length) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido sem itens." });

        const allApproved = items.every(i => i.preProductionStatus === "arte_final_aprovada");
        if (!allApproved) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Todos os itens precisam ter a arte aprovada pelo cliente antes de enviar para produção.",
          });
        }

        // Limpa correctionAction de todos os itens e atualiza status do pedido
        await db.update(orderItems)
          .set({ correctionAction: null } as any)
          .where(eq(orderItems.orderId, input.orderId));

        // Atualiza o status de cada item para "em_producao"
        await db.update(orderItems)
          .set({ preProductionStatus: "em_producao" } as any)
          .where(eq(orderItems.orderId, input.orderId));

        await db.update(orders)
          .set({ status: "em_producao" } as any)
          .where(eq(orders.id, input.orderId));

        return { success: true };
      }),
  }),
  // ERP KPIs — Pedidos do dia, produção ativa, pedidos atrasados
  erp: router({
    getDashboardKPIs: adminAnyProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const { sql: sqlOp } = await import("drizzle-orm");
      // Pedidos do dia (criados hoje)
      const todayRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count, COALESCE(SUM(totalPrice), 0) as revenue
        FROM orders
        WHERE DATE(createdAt) = CURDATE()
      `) as any;
      const todayData = (todayRows[0]?.[0] ?? { count: 0, revenue: 0 });
      // Produção ativa (em_producao)
      const inProductionRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count FROM orders WHERE status = 'em_producao'
      `) as any;
      const inProductionCount = Number((inProductionRows[0]?.[0] ?? { count: 0 }).count);
      // Aguardando análise (analisando + pagamento_aprovado + pagamento_retirada)
      const pendingRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count FROM orders WHERE status IN ('analisando', 'pagamento_aprovado', 'pagamento_retirada')
      `) as any;
      const pendingCount = Number((pendingRows[0]?.[0] ?? { count: 0 }).count);
      // Pedidos atrasados (deliveryDeadline < agora e não entregue/cancelado)
      const overdueRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count FROM orders
        WHERE deliveryDeadline IS NOT NULL
        AND deliveryDeadline < UNIX_TIMESTAMP() * 1000
        AND status NOT IN ('entregue', 'cancelado')
      `) as any;
      const overdueCount = Number((overdueRows[0]?.[0] ?? { count: 0 }).count);
      // Pedidos com problemas
      const problemRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count FROM orders WHERE status = 'com_problemas'
      `) as any;
      const problemCount = Number((problemRows[0]?.[0] ?? { count: 0 }).count);
      // Prontos para entrega/retirada
      const readyRows = await db.execute(sqlOp`
        SELECT COUNT(*) as count FROM orders WHERE status IN ('pronto_entrega', 'pronto_retirada')
      `) as any;
      const readyCount = Number((readyRows[0]?.[0] ?? { count: 0 }).count);
      // Últimos 5 pedidos atrasados
      const overdueOrdersRows = await db.execute(sqlOp`
        SELECT id, orderNumber, totalPrice, status, createdAt, deliveryDeadline, guestName, guestEmail
        FROM orders
        WHERE deliveryDeadline IS NOT NULL
        AND deliveryDeadline < UNIX_TIMESTAMP() * 1000
        AND status NOT IN ('entregue', 'cancelado')
        ORDER BY deliveryDeadline ASC
        LIMIT 5
      `) as any;
      const overdueOrders = (overdueOrdersRows[0] ?? []) as any[];
      // Pedidos em produção (lista)
      const inProductionOrdersRows = await db.execute(sqlOp`
        SELECT id, orderNumber, totalPrice, status, createdAt, deliveryDeadline, guestName, guestEmail
        FROM orders WHERE status = 'em_producao'
        ORDER BY createdAt ASC LIMIT 10
      `) as any;
      const inProductionOrders = (inProductionOrdersRows[0] ?? []) as any[];
      return {
        today: {
          count: Number(todayData.count),
          revenue: Number(todayData.revenue),
        },
        inProduction: inProductionCount,
        pending: pendingCount,
        overdue: overdueCount,
        problems: problemCount,
        ready: readyCount,
        overdueOrders,
        inProductionOrders,
      };
    }),
  }),

  // Procedures para Configuração dos Correios
  settings: router({
    // Obter configurações atuais
    getSettings: publicProcedure.query(async () => {
      const db = await getDb();
      const result = await (db as any).query(
        `SELECT * FROM storeSettings WHERE id = 1`
      );
      return result && result.length > 0 ? result[0] : null;
    }),

    // Atualizar configurações (admin only)
    updateSettings: protectedProcedure
      .input(
        z.object({
          originCEP: z.string().optional(),
          correiosUser: z.string().optional(),
          correiosPassword: z.string().optional(),
          correiosContractNumber: z.string().optional(),
          correiosPostalCard: z.string().optional(),
          senderStreet: z.string().optional(),
          senderNumber: z.string().optional(),
          senderComplement: z.string().optional(),
          senderNeighborhood: z.string().optional(),
          senderCity: z.string().optional(),
          senderState: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const db = await getDb();
        const updates: string[] = [];
        const values: any[] = [];

        if (input.originCEP !== undefined) {
          updates.push("originCEP = ?");
          values.push(input.originCEP);
        }
        if (input.correiosUser !== undefined) {
          updates.push("correiosUser = ?");
          values.push(input.correiosUser);
        }
        if (input.correiosPassword !== undefined) {
          updates.push("correiosPassword = ?");
          values.push(input.correiosPassword);
        }
        if (input.correiosContractNumber !== undefined) {
          updates.push("correiosContractNumber = ?");
          values.push(input.correiosContractNumber);
        }
        if (input.correiosPostalCard !== undefined) {
          updates.push("correiosPostalCard = ?");
          values.push(input.correiosPostalCard);
        }
        if (input.senderStreet !== undefined) {
          updates.push("senderStreet = ?");
          values.push(input.senderStreet);
        }
        if (input.senderNumber !== undefined) {
          updates.push("senderNumber = ?");
          values.push(input.senderNumber);
        }
        if (input.senderComplement !== undefined) {
          updates.push("senderComplement = ?");
          values.push(input.senderComplement);
        }
        if (input.senderNeighborhood !== undefined) {
          updates.push("senderNeighborhood = ?");
          values.push(input.senderNeighborhood);
        }
        if (input.senderCity !== undefined) {
          updates.push("senderCity = ?");
          values.push(input.senderCity);
        }
        if (input.senderState !== undefined) {
          updates.push("senderState = ?");
          values.push(input.senderState);
        }

        if (updates.length === 0) {
          return { success: false, message: "Nenhum campo para atualizar" };
        }

        // Inserir ou atualizar
        await (db as any).query(
          `INSERT INTO storeSettings (id, ${updates.map((u) => u.split(" = ")[0]).join(", ")}) 
           VALUES (1, ${values.map(() => "?").join(", ")}) 
           ON DUPLICATE KEY UPDATE ${updates.join(", ")}`,
          [1, ...values, ...values]
        );

        return { success: true, message: "Configurações atualizadas" };
      }),
    
  }),
});
export type AppRouter = typeof appRouter;
