import { getDb } from "./db";
import { automationLogs, orders, clients } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Registrar log de automação
 */
export async function logAutomation(data: {
  orderId: number;
  type: "whatsapp" | "email" | "sms" | "notificacao";
  recipient: string;
  message: string;
  status: "enviado" | "falhou" | "pendente";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(automationLogs).values({
    orderId: data.orderId,
    type: data.type,
    recipient: data.recipient,
    message: data.message,
    status: data.status,
    errorMessage: data.errorMessage,
  });
}

/**
 * Obter logs de automação de um pedido
 */
export async function getOrderAutomationLogs(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.orderId, orderId))
    .orderBy(desc(automationLogs.createdAt));
}

/**
 * Obter logs de automação por tipo de destinatário
 */
export async function getAutomationLogsByRecipient(recipient: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.recipient, recipient))
    .orderBy(desc(automationLogs.createdAt));
}

/**
 * Obter logs de automação por tipo
 */
export async function getAutomationLogsByType(type: "whatsapp" | "email" | "sms" | "notificacao", limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.type, type))
    .orderBy(desc(automationLogs.createdAt))
    .limit(limit);
}

/**
 * Obter logs de automação com falha
 */
export async function getFailedAutomationLogs(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(automationLogs)
    .where(eq(automationLogs.status, "falhou"))
    .orderBy(desc(automationLogs.createdAt))
    .limit(limit);
}

/**
 * Contar automações por status
 */
export async function countAutomationsByStatus() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const statuses = ["enviado", "falhou", "pendente"] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const result = await db
      .select()
      .from(automationLogs)
      .where(eq(automationLogs.status, status));
    counts[status] = result.length;
  }

  return counts;
}

/**
 * Contar automações por tipo
 */
export async function countAutomationsByType() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const types = ["whatsapp", "email", "sms", "notificacao"] as const;
  const counts: Record<string, number> = {};

  for (const type of types) {
    const result = await db
      .select()
      .from(automationLogs)
      .where(eq(automationLogs.type, type));
    counts[type] = result.length;
  }

  return counts;
}

/**
 * Enviar notificação WhatsApp (simulado)
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  orderId: number,
  clientId?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // TODO: Integrar com API real do WhatsApp (Twilio, MessageBird, etc)
    // Por enquanto, apenas simular o envio
    
    await logAutomation({
      orderId,
      type: "whatsapp",
      recipient: phoneNumber,
      message,
      status: "enviado",
    });

    return {
      success: true,
      messageId: `whatsapp_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    await logAutomation({
      orderId,
      type: "whatsapp",
      recipient: phoneNumber,
      message,
      status: "falhou",
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enviar notificação Email (simulado)
 */
export async function sendEmailNotification(
  email: string,
  subject: string,
  message: string,
  orderId: number,
  clientId?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // TODO: Integrar com serviço de email real (SendGrid, Mailgun, etc)
    // Por enquanto, apenas simular o envio

    await logAutomation({
      orderId,
      type: "email",
      recipient: email,
      message,
      status: "enviado",
    });

    return {
      success: true,
      messageId: `email_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    await logAutomation({
      orderId,
      type: "email",
      recipient: email,
      message,
      status: "falhou",
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enviar notificação SMS (simulado)
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string,
  orderId: number,
  clientId?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // TODO: Integrar com serviço de SMS real (Twilio, AWS SNS, etc)
    // Por enquanto, apenas simular o envio

    await logAutomation({
      orderId,
      type: "sms",
      recipient: phoneNumber,
      message,
      status: "enviado",
    });

    return {
      success: true,
      messageId: `sms_${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    await logAutomation({
      orderId,
      type: "sms",
      recipient: phoneNumber,
      message,
      status: "falhou",
      errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enviar notificação in-app (via Manus)
 */
export async function sendInAppNotification(
  userId: number,
  title: string,
  message: string,
  orderId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrar com sistema de notificações do Manus
    // Por enquanto, apenas registrar o log

    await logAutomation({
      orderId,
      type: "notificacao",
      recipient: `user_${userId}`,
      message: `${title}: ${message}`,
      status: "enviado",
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Gerar mensagem de confirmação de pedido
 */
export function generateOrderConfirmationMessage(orderId: number, clientName: string): string {
  return `Olá ${clientName}! 👋\n\nSeu pedido #${orderId} foi confirmado com sucesso! 🎉\n\nEstaremos trabalhando para preparar sua encomenda. Você receberá atualizações de status em breve.\n\nObrigado por escolher a Maria Imprime! 🖨️`;
}

/**
 * Gerar mensagem de atualização de status
 */
export function generateStatusUpdateMessage(orderId: number, status: string): string {
  const statusMessages: Record<string, string> = {
    pagamento: "Pagamento recebido! ✅ Seu pedido está na fila de produção.",
    producao: "Seu pedido entrou em produção! 🏭 Estamos trabalhando nisso.",
    qualidade: "Seu pedido passou no controle de qualidade! ✨",
    pronto: "Seu pedido está pronto para envio! 📦 Em breve você receberá o rastreamento.",
    enviado: "Seu pedido foi enviado! 🚚 Acompanhe o rastreamento.",
    entregue: "Seu pedido foi entregue! 🎁 Obrigado por sua compra!",
  };

  return `Pedido #${orderId}: ${statusMessages[status] || "Status atualizado"}`;
}

/**
 * Gerar mensagem de problema/erro
 */
export function generateErrorMessage(orderId: number, issue: string): string {
  return `Atenção! ⚠️\n\nPedido #${orderId} apresentou um problema:\n\n${issue}\n\nNosso time está trabalhando para resolver. Você receberá uma atualização em breve.`;
}
