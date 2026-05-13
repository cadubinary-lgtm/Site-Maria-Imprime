import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createFileValidation,
  getFileValidationById,
  getOrderFileValidations,
  updateFileValidationStatus,
  validateDPI,
  validateColorMode,
  validateBleed,
  validateSafetyMargin,
  getPendingFileValidations,
  getRejectedFileValidations,
  getApprovedFileValidations,
  countFileValidationsByStatus,
} from "./db-web2print";

/**
 * Web2Print Router - Validação e Gestão de Arquivos
 */
export const web2printRouter = router({
  /**
   * Criar validação de arquivo
   */
  createValidation: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        fileName: z.string(),
        fileSize: z.number(),
        dpi: z.number().optional(),
        colorMode: z.string().optional(),
        hasBleed: z.boolean().optional(),
        hasSafeMargin: z.boolean().optional(),
        issues: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createFileValidation({
        ...input,
        status: "enviado",
        validatedBy: ctx.user.id,
      });
    }),

  /**
   * Obter validação de arquivo
   */
  getValidation: protectedProcedure
    .input(z.object({ validationId: z.number() }))
    .query(async ({ input }) => {
      return await getFileValidationById(input.validationId);
    }),

  /**
   * Obter validações de um pedido
   */
  getOrderValidations: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await getOrderFileValidations(input.orderId);
    }),

  /**
   * Atualizar status de validação
   */
  updateValidationStatus: adminProcedure
    .input(
      z.object({
        validationId: z.number(),
        status: z.enum(["enviado", "em_analise", "aprovado", "correcao_solicitada", "rejeitado"]),
        issues: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await updateFileValidationStatus(
        input.validationId,
        input.status,
        input.issues,
        ctx.user.id
      );
    }),

  /**
   * Validar DPI
   */
  validateDPI: protectedProcedure
    .input(z.object({ dpi: z.number(), minDPI: z.number().default(300) }))
    .query(async ({ input }) => {
      return validateDPI(input.dpi, input.minDPI);
    }),

  /**
   * Validar modo de cor
   */
  validateColorMode: protectedProcedure
    .input(z.object({ colorMode: z.string(), requiredMode: z.string().default("CMYK") }))
    .query(async ({ input }) => {
      return validateColorMode(input.colorMode, input.requiredMode);
    }),

  /**
   * Validar sangria
   */
  validateBleed: protectedProcedure
    .input(z.object({ hasBleed: z.boolean() }))
    .query(async ({ input }) => {
      return validateBleed(input.hasBleed);
    }),

  /**
   * Validar margem de segurança
   */
  validateSafetyMargin: protectedProcedure
    .input(z.object({ hasSafeMargin: z.boolean() }))
    .query(async ({ input }) => {
      return validateSafetyMargin(input.hasSafeMargin);
    }),

  /**
   * Obter validações pendentes
   */
  getPendingValidations: adminProcedure.query(async () => {
    return await getPendingFileValidations();
  }),

  /**
   * Obter validações rejeitadas
   */
  getRejectedValidations: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await getRejectedFileValidations(input.limit);
    }),

  /**
   * Obter validações aprovadas
   */
  getApprovedValidations: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await getApprovedFileValidations(input.limit);
    }),

  /**
   * Contar validações por status
   */
  countByStatus: adminProcedure.query(async () => {
    return await countFileValidationsByStatus();
  }),
});
