import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
import { financialRouter } from "./routers-financial";
import { web2printRouter } from "./routers-web2print";
import { automationRouter } from "./routers-automation";
import { attributesRouter } from "./routers-attributes";
import { productSegmentsRouter } from "./routers-product-segments";
import { pricingRouter } from "./routers-pricing";
import { pricingRulesRouter } from "./routers-pricing-rules";

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
        
        try {
          // Inserir produto
          const result = await db.insert(products).values({
            name: input.name,
            description: input.description,
            price: input.price as any,
            segment: input.segment as any,
            imageUrl: input.imageUrl,
            imageKey: input.imageKey,
            calculationType: (input.calculationType || "unidade") as any,
            pricePerM2: input.pricePerM2 ? input.pricePerM2 as any : null,
            minWidth: input.minWidth ? input.minWidth as any : null,
            maxWidth: input.maxWidth ? input.maxWidth as any : null,
            minHeight: input.minHeight ? input.minHeight as any : null,
            maxHeight: input.maxHeight ? input.maxHeight as any : null,
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
          
          return { success: true, message: 'Produto criado com sucesso' };
        } catch (error) {
          console.error('Error creating product:', error);
          throw new Error(`Erro ao criar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }),
    getAllOrders: adminProcedure.query(() => getAllOrders()),
    updateProduct: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        segment: z.string(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
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
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        
        const totalPrice = parseFloat(product.price.toString()) * input.quantity;
        const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;
        
        const result = await createOrder({
          clientId: ctx.user.id,
          orderNumber,
          status: "aguardando" as any,
          totalPrice: totalPrice.toString() as any,
          artFileUrl: input.artFileUrl,
          artFileKey: input.artFileKey,
          paymentStatus: "pago" as any,
        });
        return result;
      }),
    updateStatus: productionProcedure
      .input(z.object({
        orderId: z.number(),
        newStatus: z.enum(["aguardando", "em_producao", "enviado", "entregue"]),
      }))
      .mutation(async ({ input }) => {
        const result = await updateOrderStatus(input.orderId, input.newStatus);
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
      }))
      .mutation(async ({ input }) => {
        return await createVariationOption({
          variationTypeId: input.variationTypeId,
          name: input.name,
          description: input.description,
          priceModifier: input.priceModifier as any,
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
    linkGlobal: adminProcedure
      .input(z.object({
        globalVariationId: z.number(),
        productId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await linkGlobalVariationToProduct(input.globalVariationId, input.productId);
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
  }),
  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      return await getCartByUser(ctx.user.id);
    }),
    getCount: protectedProcedure.query(async ({ ctx }) => {
      return await getCartItemCount(ctx.user.id);
    }),
    addItem: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        selectedAttributes: z.string().optional(),
        customDimensions: z.string().optional(),
        priceAtCart: z.number(),
        artFileUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await addToCart({ userId: ctx.user.id, ...input });
        return { id };
      }),
    updateQuantity: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await updateCartItemQuantity(input.id, ctx.user.id, input.quantity);
        return { success: true };
      }),
    removeItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFromCart(input.id, ctx.user.id);
        return { success: true };
      }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============================================================
  // CHECKOUT ROUTER
  // ============================================================
  checkout: router({
    createOrder: protectedProcedure
      .input(z.object({
        deliveryFullName: z.string().min(3),
        deliveryPhone: z.string().min(8),
        deliveryStreet: z.string().min(3),
        deliveryNumber: z.string().min(1),
        deliveryComplement: z.string().optional(),
        deliveryNeighborhood: z.string().min(2),
        deliveryCity: z.string().min(2),
        deliveryState: z.string().length(2),
        deliveryZipCode: z.string().min(8),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar itens do carrinho
        const cartItems = await getCartByUser(ctx.user.id);
        if (!cartItems || cartItems.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho vazio" });
        }

        // Calcular total
        const totalPrice = cartItems.reduce(
          (sum: number, item: any) => sum + (parseFloat(item.priceAtCart) * item.quantity),
          0
        );

        // Gerar número do pedido
        const orderNumber = `PD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Criar pedido
        const orderId = await createOrderFromCart({
          userId: ctx.user.id,
          clientId: ctx.user.id, // usar userId como clientId por enquanto
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
          cartItems: cartItems.map((item: any) => ({
            productId: item.productId,
            productName: item.productName ?? "Produto",
            quantity: item.quantity,
            priceAtCart: parseFloat(item.priceAtCart),
            selectedAttributes: item.selectedAttributes ?? undefined,
            artFileUrl: item.artFileUrl ?? undefined,
            notes: item.notes ?? undefined,
          })),
        });

        // Limpar carrinho
        await clearCart(ctx.user.id);

        return { orderId, orderNumber };
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await getOrdersByUser(ctx.user.id);
    }),

    getOrderById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await getOrderDetailByUser(input.id, ctx.user.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        return result;
      }),

    getOrderHistory: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verificar que o pedido pertence ao usuário
        const result = await getOrderDetailByUser(input.orderId, ctx.user.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
        }
        return await getOrderStatusHistory(input.orderId);
      }),
  }),
});
export type AppRouter = typeof appRouter;
