import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getGlobalVariationTypesByScope,
  createVariationTypeWithScope,
  getVariationOptionsByType,
  createVariationOption,
  updateVariationType,
  deleteVariationType,
  deleteVariationOption,
  updateVariationOption,
  reorderVariationTypes,
  reorderVariationOptions,
  linkGlobalVariationToProduct,
  syncGlobalVariationOptions,
  syncGlobalVariationName,
} from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

/**
 * Router de variações de Offset.
 * Completamente independente do adminVariations — dados isolados via scope="offset".
 * Variações criadas aqui NUNCA aparecem na página /admin/variacoes (Comunicação Visual).
 */
export const variationsCvRouter = router({
  getGlobal: publicProcedure
    .query(async () => {
      const types = await getGlobalVariationTypesByScope("comunicacao_visual");
      const typesWithOptions = await Promise.all(
        types.map(async (type) => ({
          ...type,
          options: await getVariationOptionsByType(type.id),
        }))
      );
      return typesWithOptions;
    }),
  createType: adminProcedure
    .input(z.object({
      productId: z.number().nullable(),
      type: z.enum(["material", "acabamento"]),
      name: z.string(),
      isRequired: z.boolean().default(true),
    }))
      .mutation(async ({ input }) => {
      return await createVariationTypeWithScope({
        productId: input.productId,
        type: input.type,
        name: input.name,
        isRequired: input.isRequired,
      }, "comunicacao_visual");
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
});
