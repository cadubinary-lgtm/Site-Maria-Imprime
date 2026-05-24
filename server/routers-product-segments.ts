import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  addSegmentToProduct,
  removeSegmentFromProduct,
  getProductSegments,
  updateProductSegments,
  getAllSegments,
  getProductsBySegment,
} from "./db-product-segments";

export const productSegmentsRouter = router({
  // Obter todos os segmentos disponíveis
  getAllSegments: protectedProcedure.query(async () => {
    return await getAllSegments();
  }),

  // Obter segmentos de um produto
  getProductSegments: protectedProcedure
    .input(z.number())
    .query(async ({ input: productId }) => {
      return await getProductSegments(productId);
    }),

  // Adicionar segmento a um produto
  addSegment: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        segmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await addSegmentToProduct(input.productId, input.segmentId);
    }),

  // Remover segmento de um produto
  removeSegment: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        segmentId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await removeSegmentFromProduct(input.productId, input.segmentId);
    }),

  // Atualizar múltiplos segmentos de um produto
  updateSegments: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        segmentIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      return await updateProductSegments(input.productId, input.segmentIds);
    }),

  // Obter produtos por segmento
  getProductsBySegment: protectedProcedure
    .input(z.number())
    .query(async ({ input: segmentId }) => {
      return await getProductsBySegment(segmentId);
    }),
});
