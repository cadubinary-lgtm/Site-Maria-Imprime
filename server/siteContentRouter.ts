import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { siteDocuments, siteFooterSettings, siteMariaGuideSettings } from "../drizzle/schema";
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

const guideItemInput = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(120),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(1500),
  bullets: z.array(z.string().min(1).max(160)).max(16),
  isActive: z.boolean(),
  illustration: z.enum(["lona-ilhos", "lona-bastao", "adesivo-perfurado", "papel-gramatura", "placa", "laminacao", "meio-corte", "vinco-dobra", "entrega"]).optional(),
});

const guideCategoryInput = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(120),
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(1000),
  isActive: z.boolean(),
  items: z.array(guideItemInput).min(1).max(80),
});

const guideSectionInput = z.object({
  id: z.enum(["impressao", "material", "acabamento", "entrega"]),
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(240),
  description: z.string().min(1).max(1000),
  tip: z.string().min(1).max(1000),
  icon: z.enum(["printer", "layers", "crop", "truck", "sparkles", "package"]),
  isActive: z.boolean(),
  categories: z.array(guideCategoryInput).min(1).max(20),
});

const mariaGuideInput = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  description: z.string().min(1).max(700),
  bottomNoteTitle: z.string().min(1).max(160),
  bottomNote: z.string().min(1).max(1000),
  sections: z.array(guideSectionInput).length(4),
}).superRefine((guide, ctx) => {
  const seenIds = new Set<string>();
  guide.sections.forEach((section, sectionIndex) => {
    if (seenIds.has(section.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sections", sectionIndex, "id"], message: "Cada card principal deve ter um identificador único" });
    seenIds.add(section.id);
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

  getPublicMariaGuide: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [settings] = await db.select({ publishedContent: siteMariaGuideSettings.publishedContent, publishedAt: siteMariaGuideSettings.publishedAt })
      .from(siteMariaGuideSettings).where(eq(siteMariaGuideSettings.id, 1)).limit(1);
    return settings ?? null;
  }),

  getAdminMariaGuide: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [settings] = await db.select().from(siteMariaGuideSettings).where(eq(siteMariaGuideSettings.id, 1)).limit(1);
    return settings ?? null;
  }),

  saveMariaGuideDraft: adminProcedure.input(mariaGuideInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const draftContent = JSON.stringify(input);
    const [existing] = await db.select({ id: siteMariaGuideSettings.id }).from(siteMariaGuideSettings).where(eq(siteMariaGuideSettings.id, 1)).limit(1);
    if (existing) await db.update(siteMariaGuideSettings).set({ draftContent }).where(eq(siteMariaGuideSettings.id, 1));
    else await db.insert(siteMariaGuideSettings).values({ id: 1, draftContent, isPublished: true });
    return { success: true } as const;
  }),

  publishMariaGuide: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [settings] = await db.select().from(siteMariaGuideSettings).where(eq(siteMariaGuideSettings.id, 1)).limit(1);
    if (!settings?.draftContent) throw new Error("Salve um rascunho do Guia da Maria antes de publicar");
    const publishedAt = new Date();
    await db.update(siteMariaGuideSettings).set({ publishedContent: settings.draftContent, isPublished: true, publishedAt }).where(eq(siteMariaGuideSettings.id, 1));
    return { success: true, publishedAt } as const;
  }),
});
