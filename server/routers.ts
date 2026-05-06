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
} from "./db";
import { nanoid } from "nanoid";
import { products, orders, orderItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Procedimento protegido apenas para admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar" });
  }
  return next({ ctx });
});

// Procedimento protegido apenas para produção
const productionProcedure = protectedProcedure.use(({ ctx, next }) => {
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
  }),

  // Segments - Público
  segments: router({
    getAll: publicProcedure.query(() => getAllSegments()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getSegmentBySlug(input.slug)),
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
    createProduct: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        segment: z.enum(["alimentacao", "beleza", "varejo", "servicos"]),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.insert(products).values({
          name: input.name,
          description: input.description,
          price: input.price as any,
          segment: input.segment as any,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          isActive: true,
        });
        return result;
      }),
    getAllOrders: adminProcedure.query(() => getAllOrders()),
    updateProduct: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        segment: z.enum(["alimentacao", "beleza", "varejo", "servicos"]),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.update(products)
          .set({
            name: input.name,
            description: input.description,
            price: input.price as any,
            segment: input.segment as any,
            imageUrl: input.imageUrl,
            imageKey: input.imageKey,
          })
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
});

export type AppRouter = typeof appRouter;
