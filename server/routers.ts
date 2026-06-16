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
import { adminAuthRouter } from "./routers-admin-auth";

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
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return updateSegment(input.id, input.name, input.icon || '');
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteSegment(input.id);
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
        segment: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        galleryUrls: z.string().optional(), // JSON array de URLs
        calculationType: z.enum(["m2", "metro_linear", "pacote", "unidade"]).optional(),
        pricePerM2: z.string().optional(),
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
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        try {
          // Inserir produto
          const result = await db.insert(products).values({
            name: input.name,
            description: input.description,
            price: input.price as any,
            segment: input.segment as any,
            imageUrl: input.imageUrl,
            imageKey: input.imageKey,
            galleryUrls: input.galleryUrls || null,
            calculationType: (input.calculationType || "unidade") as any,
            pricePerM2: input.pricePerM2 ? input.pricePerM2 as any : null,
            minWidth: input.minWidth ? input.minWidth as any : null,
            maxWidth: input.maxWidth ? input.maxWidth as any : null,
            minHeight: input.minHeight ? input.minHeight as any : null,
            maxHeight: input.maxHeight ? input.maxHeight as any : null,
            weight: input.weight ?? null,
            width: input.logisticsWidth ?? null,
            height: input.logisticsHeight ?? null,
            length: input.logisticsLength ?? null,
            allowedCarriers: input.allowedCarrierIds && input.allowedCarrierIds.length > 0 ? JSON.stringify(input.allowedCarrierIds) : null,
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
    getAllOrders: adminProcedure.query(() => getAllOrders()),
    getOrderWithItems: adminProcedure
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
        return { order, items };
      }),
    deleteOrder: adminProcedure
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
    updateOrderStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        newStatus: z.enum(["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await updateOrderStatus(input.orderId, input.newStatus, input.notes);
      }),
    updatePreProductionStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        preProductionStatus: z.enum(["liberado_analise", "arte_final_aprovada"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orders: ordersT } = await import("../drizzle/schema.js");
        await db.update(ordersT)
          .set({ preProductionStatus: input.preProductionStatus } as any)
          .where(eq(ordersT.id, input.orderId));
        return { success: true };
      }),
    updateProductionStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        productionStatus: z.enum(["pendente", "impresso", "acabamento_finalizado"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orders: ordersT } = await import("../drizzle/schema.js");
        await db.update(ordersT)
          .set({ productionStatus: input.productionStatus } as any)
          .where(eq(ordersT.id, input.orderId));
        return { success: true };
      }),
    updateProduct: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        segment: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        galleryUrls: z.string().optional(), // JSON array de URLs
        calculationType: z.enum(["m2", "metro_linear", "pacote", "unidade"]).optional(),
        pricePerM2: z.string().optional(),
        minWidth: z.string().optional(),
        maxWidth: z.string().optional(),
        minHeight: z.string().optional(),
        maxHeight: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {
          name: input.name,
          description: input.description,
          price: input.price as any,
          segment: input.segment as any,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          galleryUrls: input.galleryUrls !== undefined ? input.galleryUrls : undefined,
        };

        // Adicionar campos de m² se fornecidos
        if (input.calculationType) updateData.calculationType = input.calculationType;
        if (input.pricePerM2) updateData.pricePerM2 = parseFloat(input.pricePerM2);
        if (input.minWidth) updateData.minWidth = parseFloat(input.minWidth);
        if (input.maxWidth) updateData.maxWidth = parseFloat(input.maxWidth);
        if (input.minHeight) updateData.minHeight = parseFloat(input.minHeight);
        if (input.maxHeight) updateData.maxHeight = parseFloat(input.maxHeight);
        
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
createOrder: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number(),
        artFileUrl: z.string().optional(),
        artFileKey: z.string().optional(),
        shippingMethod: z.string().optional(),
        shippingPrice: z.number().optional(),
        shippingEstimatedDays: z.number().optional(),
        shippingZipCode: z.string().optional(),
        shippingCarrierId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        
        const totalPrice = parseFloat(product.price.toString()) * input.quantity;
        const shippingPrice = input.shippingPrice || 0;
        const finalPrice = totalPrice + shippingPrice;
        const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
        
        const result = await createOrder({
          clientId: ctx.user.id,
          orderNumber,
          status: "analisando" as any,
          totalPrice: finalPrice.toString() as any,
          artFileUrl: input.artFileUrl,
          artFileKey: input.artFileKey,
          paymentStatus: "pago" as any,
          shippingMethod: input.shippingMethod,
          shippingPrice: input.shippingPrice?.toString() as any,
          shippingEstimatedDays: input.shippingEstimatedDays,
          shippingZipCode: input.shippingZipCode,
          shippingCarrierId: input.shippingCarrierId,
        });
        return result;
      }),
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
        let sessionId = getCookieFromReq(req, "cart_session") ?? null;
        // Resolver customer_session para clientes autenticados
        if (!userId && !sessionId) {
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
        }
        await updateCartItemQuantity(input.id, userId, input.quantity, sessionId);
        return { success: true };
      }),

    removeItem: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const req = ctx.req as ExpressRequest;
        const userId = ctx.user?.id ?? null;
        let sessionId = getCookieFromReq(req, "cart_session") ?? null;
        // Resolver customer_session para clientes autenticados
        if (!userId && !sessionId) {
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
        }
        await removeFromCart(input.id, userId, sessionId);
        return { success: true };
      }),

    clear: publicProcedure.mutation(async ({ ctx }) => {
      const req = ctx.req as ExpressRequest;
      const userId = ctx.user?.id ?? null;
      let sessionId = getCookieFromReq(req, "cart_session") ?? null;
      // Resolver customer_session para clientes autenticados
      if (!userId && !sessionId) {
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
        const emailTo = input.guestEmail ?? (isGuest ? null : null);
        if (emailTo) {
          try {
            const { sendOrderConfirmationWithLink } = await import("./emailService");
            const firstName = (input.guestName ?? input.deliveryFullName).split(" ")[0] ?? "Cliente";
            const trackUrl = guestToken
              ? `${process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space"}/pedido/acompanhar/${guestToken}`
              : `${process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space"}/pedido/${orderNumber}`;
            await sendOrderConfirmationWithLink(emailTo, firstName, orderNumber, totalPrice.toFixed(2), trackUrl);
          } catch (e) {
            console.error("[CHECKOUT] Erro ao enviar e-mail de confirmação:", e);
          }
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
        const order = orderRows[0] ?? null;
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

        getOrderById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        // Admin pode ver qualquer pedido
        if (ctx.user.role === "admin") {
          return await getOrderById(input.id);
        }
        const result = await getOrderDetailByUser(input.id, ctx.user.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        return result;
      }),
    getOrderHistory: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Admin pode ver histórico de qualquer pedido
        if (ctx.user.role !== "admin") {
          const result = await getOrderDetailByUser(input.orderId, ctx.user.id);
          if (!result) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
          }
        }
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
        // Adicionar cada item do pedido ao carrinho
        let addedCount = 0;
        for (const item of (order as any).items ?? []) {
          await addToCart({
            userId: ctx.user.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtCart: parseFloat(item.priceAtOrder),
            selectedAttributes: item.selectedAttributes ?? undefined,
            artFileUrl: item.artFileUrl ?? undefined,
            notes: item.notes ?? undefined,
          });
          addedCount++;
        }
        return { addedCount };
      }),
    getAllOrders: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { orders: ordersTable } = await import("../drizzle/schema.js");
      const { desc } = await import("drizzle-orm");
      return db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    }),
    updateOrderStatus: adminProcedure
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
    getOrderFiles: adminProcedure
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
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        const { eq, desc } = await import("drizzle-orm");
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

    saveArtPreview: adminProcedure
      .input(z.object({
        orderId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        await db.insert(orderArtPreviews).values({
          orderId: input.orderId,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          uploadedBy: ctx.user.id,
          notes: input.notes ?? null,
        });
        return { success: true };
      }),

    deleteArtPreview: adminProcedure
      .input(z.object({ previewId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
        const { orderArtPreviews } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await db.delete(orderArtPreviews).where(eq(orderArtPreviews.id, input.previewId));
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


