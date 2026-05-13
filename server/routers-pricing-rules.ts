import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as dbPricingRules from "./db-pricing-rules";

export const pricingRulesRouter = router({
  /**
   * Listar todas as regras de precificação
   */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        includeInactive: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      return await dbPricingRules.listPricingRules(input.category, input.includeInactive);
    }),

  /**
   * Listar categorias únicas
   */
  listCategories: publicProcedure.query(async () => {
    return await dbPricingRules.listPricingCategories();
  }),

  /**
   * Obter regra por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await dbPricingRules.getPricingRuleById(input.id);
    }),

  /**
   * Criar nova regra
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        description: z.string().optional(),
        basePrice: z.number().min(0),
        calculationType: z
          .enum(["fixed", "percentage", "multiplier", "per_sqm", "per_quantity"])
          .optional()
          .default("fixed"),
        isActive: z.boolean().optional().default(true),
        priority: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      return await dbPricingRules.createPricingRule(input);
    }),

  /**
   * Atualizar regra
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        description: z.string().optional(),
        basePrice: z.number().min(0).optional(),
        calculationType: z
          .enum(["fixed", "percentage", "multiplier", "per_sqm", "per_quantity"])
          .optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return await dbPricingRules.updatePricingRule(id, updateData);
    }),

  /**
   * Deletar regra
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await dbPricingRules.deletePricingRule(input.id);
    }),

  /**
   * Duplicar regra
   */
  duplicate: publicProcedure
    .input(
      z.object({
        id: z.number(),
        newName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await dbPricingRules.duplicatePricingRule(input.id, input.newName);
    }),
});
