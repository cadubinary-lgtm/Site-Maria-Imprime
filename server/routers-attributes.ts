import { router, protectedProcedure, adminProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as dbAttributes from "./db-attributes";

/**
 * ========================================
 * ATRIBUTOS ROUTER
 * ========================================
 * Procedures tRPC para gerenciar atributos dinâmicos
 */

export const attributesRouter = router({
  /**
   * ========================================
   * ATRIBUTOS GLOBAIS
   * ========================================
   */

  /**
   * Criar novo atributo global
   */
  createAttribute: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["button", "select", "card", "radio", "checkbox", "numeric", "text", "measures"]),
        icon: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.createAttribute(input);
    }),

  /**
   * Listar todos os atributos
   */
  listAttributes: publicProcedure.input(z.object({ includeInactive: z.boolean().optional() }).optional()).query(async ({ input }) => {
    return await dbAttributes.listAttributes(input?.includeInactive ?? false);
  }),

  /**
   * Obter atributo por ID
   */
  getAttributeById: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await dbAttributes.getAttributeById(input);
  }),

  /**
   * Atualizar atributo
   */
  updateAttribute: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(["button", "select", "card", "radio", "checkbox", "numeric", "text", "measures"]).optional(),
        icon: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await dbAttributes.updateAttribute(id, data);
    }),

  /**
   * Deletar atributo (soft delete)
   */
  deleteAttribute: adminProcedure.input(z.number()).mutation(async ({ input }) => {
    return await dbAttributes.deleteAttribute(input);
  }),

  /**
   * ========================================
   * VALORES DE ATRIBUTOS
   * ========================================
   */

  /**
   * Criar valor de atributo
   */
  createAttributeValue: adminProcedure
    .input(
      z.object({
        attributeId: z.number(),
        value: z.string().min(1),
        description: z.string().optional(),
        priceModifier: z.number().optional(),
        timeModifier: z.number().optional(),
        weightModifier: z.number().optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.createAttributeValue(input);
    }),

  /**
   * Listar valores de um atributo
   */
  listAttributeValues: publicProcedure
    .input(z.object({ attributeId: z.number(), includeInactive: z.boolean().optional() }))
    .query(async ({ input }) => {
      return await dbAttributes.listAttributeValues(input.attributeId, input.includeInactive ?? false);
    }),

  /**
   * Atualizar valor de atributo
   */
  updateAttributeValue: adminProcedure
    .input(
      z.object({
        id: z.number(),
        value: z.string().optional(),
        description: z.string().optional(),
        priceModifier: z.number().optional(),
        timeModifier: z.number().optional(),
        weightModifier: z.number().optional(),
        icon: z.string().optional(),
        image: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await dbAttributes.updateAttributeValue(id, data as any);
    }),

  /**
   * Deletar valor de atributo (soft delete)
   */
  deleteAttributeValue: adminProcedure.input(z.number()).mutation(async ({ input }) => {
    return await dbAttributes.deleteAttributeValue(input);
  }),

  /**
   * ========================================
   * VINCULAÇÃO PRODUTO-ATRIBUTO
   * ========================================
   */

  /**
   * Vincular atributo a produto (com precificação no vínculo)
   */
  linkAttributeToProduct: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        attributeId: z.number(),
        isRequired: z.boolean().optional(),
        allowMultiple: z.boolean().optional(),
        displayOrder: z.number().optional(),
        // NOVO: Precificação no vínculo
        priceModifier: z.number().optional(),
        calculationType: z.enum(["fixed", "percentage", "multiplier", "per_sqm", "per_quantity"]).optional(),
        timeModifier: z.number().optional(),
        weightModifier: z.number().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
        rules: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.linkAttributeToProduct(input);
    }),

  /**
   * Atualizar precificacao de um vinculo produto-atributo
   */
  updateAttributePrice: adminProcedure
    .input(
      z.object({
        productAttributeId: z.number(),
        priceModifier: z.number().optional(),
        calculationType: z.enum(["fixed", "percentage", "multiplier", "per_sqm", "per_quantity"]).optional(),
        timeModifier: z.number().optional(),
        weightModifier: z.number().optional(),
        isActive: z.boolean().optional(),
        priority: z.number().optional(),
        rules: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.updateProductAttribute(input);
    }),

  /**
   * Desvinc ular atributo de um produto
   */
  unlinkAttributeFromProduct: adminProcedure
    .input(z.number())
    .mutation(async ({ input }) => {
      return await dbAttributes.unlinkAttributeFromProduct(input);
    }),

  /**
   * Obter atributos de um produto (com precificação)
   */
  getProductAttributes: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await dbAttributes.getProductAttributes(input);
  }),

  /**
   * Obter atributo específico de um produto (com precificação)
   */
  getProductAttribute: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        productAttributeId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const attributes = await dbAttributes.getProductAttributes(input.productId);
      return attributes.find((attr) => attr.id === input.productAttributeId) || null;
    }),

  /**
   * Habilitar/desabilitar valor específico para produto
   */
  setProductAttributeValue: adminProcedure
    .input(
      z.object({
        productAttributeId: z.number(),
        attributeValueId: z.number(),
        isEnabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.setProductAttributeValue(input);
    }),

  /**
   * ========================================
   * REGRAS DINÂMICAS
   * ========================================
   */

  /**
   * Criar regra dinâmica
   */
  createAttributeRule: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        conditions: z.array(
          z.object({
            attributeId: z.number(),
            operator: z.enum(["equals", "contains", "greaterThan", "lessThan", "in"]),
            value: z.string(),
          })
        ),
        actions: z.array(
          z.object({
            targetAttributeId: z.number(),
            action: z.enum(["show", "hide", "enable", "disable", "setPrice", "addPrice"]),
            value: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.createAttributeRule(input);
    }),

  /**
   * Obter regras de um produto
   */
  getProductRules: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await dbAttributes.getProductRules(input);
  }),

  /**
   * ========================================
   * ATRIBUTOS DO PEDIDO
   * ========================================
   */

  /**
   * Adicionar atributo ao item do pedido
   */
  addOrderItemAttribute: protectedProcedure
    .input(
      z.object({
        orderItemId: z.number(),
        attributeValueId: z.number(),
        customValue: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await dbAttributes.addOrderItemAttribute(input);
    }),

  /**
   * Obter atributos de um item do pedido
   */
  getOrderItemAttributes: protectedProcedure.input(z.number()).query(async ({ input }) => {
    return await dbAttributes.getOrderItemAttributes(input);
  }),
});
