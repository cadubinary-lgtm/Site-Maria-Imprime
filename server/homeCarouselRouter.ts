import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { homeCarouselSlides, segments } from "../drizzle/schema";
import { getDb } from "./db";
import { router, publicProcedure } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";

const adminAnyProcedure = adminOrManusAuthProcedure;
const MAX_SLIDES = 6;

const slideInput = z.object({
  imageUrl: z.string().min(1).max(4000),
  imageKey: z.string().max(255).optional(),
  segmentId: z.number().int().positive(),
});

async function requireSegment(segmentId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
  const [segment] = await db.select({ id: segments.id }).from(segments).where(eq(segments.id, segmentId)).limit(1);
  if (!segment) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione um segmento válido" });
  return db;
}

export const homeCarouselRouter = router({
  listPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
    return db
      .select({
        id: homeCarouselSlides.id,
        imageUrl: homeCarouselSlides.imageUrl,
        segmentId: homeCarouselSlides.segmentId,
        segmentName: segments.name,
        segmentSlug: segments.slug,
        position: homeCarouselSlides.position,
      })
      .from(homeCarouselSlides)
      .innerJoin(segments, eq(homeCarouselSlides.segmentId, segments.id))
      .where(eq(homeCarouselSlides.isActive, true))
      .orderBy(asc(homeCarouselSlides.position), asc(homeCarouselSlides.id));
  }),

  listAdmin: adminAnyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
    return db
      .select({
        id: homeCarouselSlides.id,
        imageUrl: homeCarouselSlides.imageUrl,
        imageKey: homeCarouselSlides.imageKey,
        segmentId: homeCarouselSlides.segmentId,
        segmentName: segments.name,
        segmentSlug: segments.slug,
        position: homeCarouselSlides.position,
        isActive: homeCarouselSlides.isActive,
      })
      .from(homeCarouselSlides)
      .innerJoin(segments, eq(homeCarouselSlides.segmentId, segments.id))
      .orderBy(asc(homeCarouselSlides.position), asc(homeCarouselSlides.id));
  }),

  create: adminAnyProcedure.input(slideInput).mutation(async ({ input }) => {
    const db = await requireSegment(input.segmentId);
    const rows = await db.select({ id: homeCarouselSlides.id, position: homeCarouselSlides.position })
      .from(homeCarouselSlides)
      .orderBy(desc(homeCarouselSlides.position));
    if (rows.length >= MAX_SLIDES) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `O carrossel aceita no máximo ${MAX_SLIDES} imagens` });
    }
    const position = rows[0] ? rows[0].position + 1 : 0;
    const result = await db.insert(homeCarouselSlides).values({
      imageUrl: input.imageUrl,
      imageKey: input.imageKey || null,
      segmentId: input.segmentId,
      position,
      isActive: true,
    });
    return { success: true, id: Number((result as any).insertId) } as const;
  }),

  update: adminAnyProcedure.input(slideInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await requireSegment(input.segmentId);
    const [existing] = await db.select({ id: homeCarouselSlides.id }).from(homeCarouselSlides).where(eq(homeCarouselSlides.id, input.id)).limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Imagem do carrossel não encontrada" });
    await db.update(homeCarouselSlides).set({
      imageUrl: input.imageUrl,
      imageKey: input.imageKey || null,
      segmentId: input.segmentId,
      updatedAt: new Date(),
    }).where(eq(homeCarouselSlides.id, input.id));
    return { success: true } as const;
  }),

  remove: adminAnyProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
    await db.delete(homeCarouselSlides).where(eq(homeCarouselSlides.id, input.id));
    return { success: true } as const;
  }),

  reorder: adminAnyProcedure.input(z.object({ orderedIds: z.array(z.number().int().positive()).min(1).max(MAX_SLIDES) })).mutation(async ({ input }) => {
    if (new Set(input.orderedIds).size !== input.orderedIds.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A ordem do carrossel contém imagens repetidas" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });
    const rows = await db.select({ id: homeCarouselSlides.id }).from(homeCarouselSlides).where(inArray(homeCarouselSlides.id, input.orderedIds));
    if (rows.length !== input.orderedIds.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Uma ou mais imagens não foram encontradas" });
    }
    await Promise.all(input.orderedIds.map((id, position) =>
      db.update(homeCarouselSlides).set({ position, updatedAt: new Date() }).where(eq(homeCarouselSlides.id, id))
    ));
    return { success: true } as const;
  }),
});
