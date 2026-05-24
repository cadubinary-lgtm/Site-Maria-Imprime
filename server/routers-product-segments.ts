import { router, publicProcedure, adminProcedure } from "./_core/trpc";
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
  // Obter todos os segmentos disponíveis (PÚBLICO - catálogo)
  getAllSegments: publicProcedure.query(async () => {
    return await getAllSegments();
  }),

  // Obter segmentos de um produto (PÚBLICO - catálogo)
  getProductSegments: publicProcedure
    .input(z.number())
    .query(async ({ input: productId }) => {
      return await getProductSegments(productId);
    }),

  // Adicionar segmento a um produto (ADMIN)
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

  // Remover segmento de um produto (ADMIN)
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

  // Atualizar múltiplos segmentos de um produto (ADMIN)
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

  // Obter produtos por segmento (PÚBLICO - catálogo)
  getProductsBySegment: publicProcedure
    .input(z.number())
    .query(async ({ input: segmentId }) => {
      return await getProductsBySegment(segmentId);
    }),
});
