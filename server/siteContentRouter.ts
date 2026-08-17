import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { siteDocuments, siteFooterSettings } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const footerContentInput = z.object({
  introduction: z.string().min(1).max(1000),
  newsletterTitle: z.string().min(1).max(120),
  newsletterDescription: z.string().min(1).max(1000),
  businessHours: z.string().min(1).max(1000),
  documentsTitle: z.string().min(1).max(160),
  documentsDescription: z.string().min(1).max(1000),
});

const documentInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens no endereço").min(2).max(120),
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  position: z.number().int().min(0).max(999),
  isPublished: z.boolean(),
});

const documentsInput = z.array(documentInput).min(1).max(30).superRefine((documents, ctx) => {
  const slugs = new Set<string>();
  documents.forEach((document, index) => {
    if (slugs.has(document.slug)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "slug"], message: "Cada documento precisa ter um endereço único" });
    }
    slugs.add(document.slug);
  });
});

export const siteContentRouter = router({
  getPublicFooter: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [settings] = await db.select().from(siteFooterSettings).where(eq(siteFooterSettings.id, 1)).limit(1);
    return settings ?? null;
  }),

  getAdminFooter: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [settings] = await db.select().from(siteFooterSettings).where(eq(siteFooterSettings.id, 1)).limit(1);
    return settings ?? null;
  }),

  saveFooter: adminProcedure.input(footerContentInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const values = {
      introduction: input.introduction.trim(),
      newsletterTitle: input.newsletterTitle.trim(),
      newsletterDescription: input.newsletterDescription.trim(),
      businessHours: input.businessHours.trim(),
      documentsTitle: input.documentsTitle.trim(),
      documentsDescription: input.documentsDescription.trim(),
    };
    const [existing] = await db.select({ id: siteFooterSettings.id }).from(siteFooterSettings).where(eq(siteFooterSettings.id, 1)).limit(1);
    if (existing) await db.update(siteFooterSettings).set(values).where(eq(siteFooterSettings.id, 1));
    else await db.insert(siteFooterSettings).values({ id: 1, ...values });
    return { success: true } as const;
  }),

  getPublicDocuments: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(siteDocuments).orderBy(asc(siteDocuments.position), asc(siteDocuments.title));
  }),

  getAdminDocuments: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(siteDocuments).orderBy(asc(siteDocuments.position), asc(siteDocuments.title));
  }),

  saveDocuments: adminProcedure.input(documentsInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    for (const document of input) {
      await db.insert(siteDocuments).values({
        ...document,
        title: document.title.trim(),
        summary: document.summary.trim(),
        content: document.content.trim(),
        updatedAt: new Date(),
      }).onDuplicateKeyUpdate({
        set: {
          title: document.title.trim(),
          summary: document.summary.trim(),
          content: document.content.trim(),
          position: document.position,
          isPublished: document.isPublished,
          updatedAt: new Date(),
        },
      });
    }
    return { success: true, saved: input.length } as const;
  }),
});
