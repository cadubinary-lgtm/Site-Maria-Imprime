import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { printTemplates, products } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const templateFileInput = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(4000),
  fileKey: z.string().min(1).max(512),
  mimeType: z.string().min(1).max(120),
  fileSize: z.number().int().min(1).max(25 * 1024 * 1024),
});

const templateInput = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  isPublished: z.boolean().default(true),
  file: templateFileInput,
});

const templateUpdateInput = templateInput.extend({ id: z.number().int().positive() });

export const printTemplatesRouter = router({
  listPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select({
      id: printTemplates.id,
      title: printTemplates.title,
      description: printTemplates.description,
      fileName: printTemplates.fileName,
      fileUrl: printTemplates.fileUrl,
      mimeType: printTemplates.mimeType,
      fileSize: printTemplates.fileSize,
      position: printTemplates.position,
    }).from(printTemplates).where(eq(printTemplates.isPublished, true)).orderBy(asc(printTemplates.position), asc(printTemplates.title));
  }),

  listAdmin: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(printTemplates).orderBy(asc(printTemplates.position), asc(printTemplates.title));
  }),

  getPublicForProduct: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [product] = await db.select({ templateId: products.templateId }).from(products).where(eq(products.id, input.productId)).limit(1);
    if (!product?.templateId) return null;
    const [template] = await db.select({
      id: printTemplates.id,
      title: printTemplates.title,
      description: printTemplates.description,
      fileName: printTemplates.fileName,
      fileUrl: printTemplates.fileUrl,
      mimeType: printTemplates.mimeType,
      fileSize: printTemplates.fileSize,
    }).from(printTemplates).where(and(eq(printTemplates.id, product.templateId), eq(printTemplates.isPublished, true))).limit(1);
    return template ?? null;
  }),

  create: adminProcedure.input(templateInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [lastTemplate] = await db.select({ position: printTemplates.position }).from(printTemplates).orderBy(desc(printTemplates.position)).limit(1);
    const result = await db.insert(printTemplates).values({
      title: input.title,
      description: input.description || null,
      fileName: input.file.fileName,
      fileUrl: input.file.fileUrl,
      fileKey: input.file.fileKey,
      mimeType: input.file.mimeType,
      fileSize: input.file.fileSize,
      position: (lastTemplate?.position ?? -1) + 1,
      isPublished: input.isPublished,
    });
    return { success: true, id: Number((result as any).insertId) } as const;
  }),

  update: adminProcedure.input(templateUpdateInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(printTemplates).set({
      title: input.title,
      description: input.description || null,
      fileName: input.file.fileName,
      fileUrl: input.file.fileUrl,
      fileKey: input.file.fileKey,
      mimeType: input.file.mimeType,
      fileSize: input.file.fileSize,
      isPublished: input.isPublished,
      updatedAt: new Date(),
    }).where(eq(printTemplates.id, input.id));
    return { success: true } as const;
  }),

  reorder: adminProcedure.input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(300) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (new Set(input.ids).size !== input.ids.length) throw new Error("Cada gabarito pode aparecer apenas uma vez na ordenação");
    await Promise.all(input.ids.map((id, position) => db.update(printTemplates).set({ position, updatedAt: new Date() }).where(eq(printTemplates.id, id))));
    return { success: true } as const;
  }),

  remove: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(products).set({ templateId: null }).where(eq(products.templateId, input.id));
    await db.delete(printTemplates).where(eq(printTemplates.id, input.id));
    return { success: true } as const;
  }),
});
