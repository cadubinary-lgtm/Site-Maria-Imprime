import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  logAutomation,
  getOrderAutomationLogs,
  getAutomationLogsByRecipient,
  getAutomationLogsByType,
  getFailedAutomationLogs,
  countAutomationsByStatus,
  countAutomationsByType,
  sendWhatsAppNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendInAppNotification,
  generateOrderConfirmationMessage,
  generateStatusUpdateMessage,
  generateErrorMessage,
} from "./db-automation";

/**
 * Automation Router - Automação Inteligente (WhatsApp, Email, SMS, Notificações)
 */
export const automationRouter = router({
  /**
   * Registrar log de automação
   */
  logAutomation: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        type: z.enum(["whatsapp", "email", "sms", "notificacao"]),
        recipient: z.string(),
        message: z.string(),
        status: z.enum(["enviado", "falhou", "pendente"]),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await logAutomation(input);
    }),

  /**
   * Obter logs de automação de um pedido
   */
  getOrderLogs: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await getOrderAutomationLogs(input.orderId);
    }),

  /**
   * Obter logs de automação por destinatário
   */
  getRecipientLogs: protectedProcedure
    .input(z.object({ recipient: z.string() }))
    .query(async ({ input }) => {
      return await getAutomationLogsByRecipient(input.recipient);
    }),

  /**
   * Obter logs de automação por tipo
   */
  getLogsByType: protectedProcedure
    .input(z.object({ type: z.enum(["whatsapp", "email", "sms", "notificacao"]), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await getAutomationLogsByType(input.type, input.limit);
    }),

  /**
   * Obter logs com falha
   */
  getFailedLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return await getFailedAutomationLogs(input.limit);
    }),

  /**
   * Contar automações por status
   */
  countByStatus: adminProcedure.query(async () => {
    return await countAutomationsByStatus();
  }),

  /**
   * Contar automações por tipo
   */
  countByType: adminProcedure.query(async () => {
    return await countAutomationsByType();
  }),

  /**
   * Visão consolidada das automações efetivamente implementadas no site.
   */
  getDashboard: adminProcedure.query(async () => {
    const { getAutomationDashboard } = await import("./db-automation");
    return await getAutomationDashboard();
  }),

  /**
   * Enviar notificação WhatsApp
   */
  sendWhatsApp: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        phoneNumber: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const message = input.message || generateOrderConfirmationMessage(input.orderId, "Cliente");
      return await sendWhatsAppNotification(input.phoneNumber, message, input.orderId);
    }),

  /**
   * Enviar notificação Email
   */
  sendEmail: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        email: z.string().email(),
        subject: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const message = input.message || generateOrderConfirmationMessage(input.orderId, "Cliente");
      return await sendEmailNotification(input.email, input.subject, message, input.orderId);
    }),

  /**
   * Enviar notificação SMS
   */
  sendSMS: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        phoneNumber: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const message = input.message || generateOrderConfirmationMessage(input.orderId, "Cliente");
      return await sendSMSNotification(input.phoneNumber, message, input.orderId);
    }),

  /**
   * Enviar notificação in-app
   */
  sendInApp: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        userId: z.number(),
        title: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await sendInAppNotification(input.userId, input.title, input.message, input.orderId);
    }),

  /**
   * Gerar mensagem de confirmação
   */
  generateConfirmationMessage: protectedProcedure
    .input(z.object({ orderId: z.number(), clientName: z.string() }))
    .query(async ({ input }) => {
      return generateOrderConfirmationMessage(input.orderId, input.clientName);
    }),

  /**
   * Gerar mensagem de atualização de status
   */
  generateStatusMessage: protectedProcedure
    .input(z.object({ orderId: z.number(), status: z.string() }))
    .query(async ({ input }) => {
      return generateStatusUpdateMessage(input.orderId, input.status);
    }),

  /**
   * Gerar mensagem de erro
   */
  generateErrorMessageQuery: protectedProcedure
    .input(z.object({ orderId: z.number(), issue: z.string() }))
    .query(async ({ input }) => {
      return generateErrorMessage(input.orderId, input.issue);
    }),
});
