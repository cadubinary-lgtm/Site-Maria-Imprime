import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createClient,
  getClientById,
  listClients,
  updateClient,
  deleteClient,
  getClientStats,
  getTopClients,
  getClientsByType,
  updateClientStats,
} from "./db-crm";

/**
 * CRM Router - Gestão de Clientes
 */
export const crmRouter = router({
  /**
   * Criar novo cliente (admin only)
   */
  createClient: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo", "site"]),
        userId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await createClient(input);
      return result;
    }),

  /**
   * Obter cliente por ID
   */
  getClientById: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await getClientById(input.clientId);
    }),

  /**
   * Listar clientes com paginação
   */
  listClients: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        clientType: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listClients(input);
    }),

  /**
   * Atualizar cliente (admin only)
   */
  updateClient: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          whatsapp: z.string().optional(),
          clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo"]).optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return await updateClient(input.clientId, input.data);
    }),

  /**
   * Deletar cliente (soft delete - admin only)
   */
  deleteClient: adminProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteClient(input.clientId);
    }),

  /**
   * Obter estatísticas de cliente
   */
  getClientStats: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return await getClientStats(input.clientId);
    }),

  /**
   * Obter top clientes por volume
   */
  getTopClients: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return await getTopClients(input.limit);
    }),

  /**
   * Obter clientes por tipo
   */
  getClientsByType: protectedProcedure
    .input(
      z.object({
        clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo"]),
      })
    )
    .query(async ({ input }) => {
      return await getClientsByType(input.clientType);
    }),

  /**
   * Atualizar estatísticas do cliente (chamado internamente após novo pedido)
   */
  updateClientStats: adminProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ input }) => {
      return await updateClientStats(input.clientId);
    }),
});
