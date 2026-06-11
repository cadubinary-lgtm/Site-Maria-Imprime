/**
 * Módulo de Logística - Router tRPC
 * 
 * Este módulo foi reiniciado para receber uma nova integração limpa.
 * As páginas do menu lateral estão mantidas como placeholders:
 * - Dashboard
 * - Configurações
 * - Transportadoras
 * - Regras de Frete
 * - Expedição
 * - Rastreamento
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

// Sub-routers vazios — prontos para receber nova integração
const carriersRouter = router({
  list: publicProcedure.query(async () => {
    // TODO: Implementar nova integração de transportadoras
    return [];
  }),
});

const shippingRulesRouter = router({
  list: publicProcedure.query(async () => {
    // TODO: Implementar nova integração de regras de frete
    return [];
  }),
});

const shipmentsRouter = router({
  list: protectedProcedure.query(async () => {
    // TODO: Implementar nova integração de expedições
    return [];
  }),
});

const trackingRouter = router({
  list: protectedProcedure.query(async () => {
    // TODO: Implementar nova integração de rastreamento
    return [];
  }),
});

export const logisticsRouter = router({
  carriers: carriersRouter,
  shippingRules: shippingRulesRouter,
  shipments: shipmentsRouter,
  tracking: trackingRouter,
});
