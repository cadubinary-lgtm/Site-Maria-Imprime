import { getDb } from "./db";
import {
  abandonedCartReminders,
  automationLogs,
  emailHistory,
  paymentReceipts,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

type AutomationHealth = "active" | "attention" | "manual";
type ActivityStatus = "success" | "failure" | "prepared";

function toTimestamp(value: Date | number | null | undefined): number | null {
  if (typeof value === "number") return value;
  return value?.getTime() ?? null;
}

function healthFromResult(status?: string | null): AutomationHealth {
  return status === "failed" || status === "falhou" || status === "bounced"
    ? "attention"
    : "active";
}

function activityStatusFromResult(status?: string | null): ActivityStatus {
  if (status === "failed" || status === "falhou" || status === "bounced") return "failure";
  if (status === "prepared" || status === "pendente") return "prepared";
  return "success";
}

/**
 * Retorna uma visão administrativa unificada das automações que já existem no
 * site. A lista declara apenas rotinas que possuem gatilho implementado; quando
 * a rotina ainda não persiste histórico, isso é informado explicitamente na UI.
 */
export async function getAutomationDashboard() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [automationLogRows, emailRows, receiptRows, reminderRows] = await Promise.all([
    db.select().from(automationLogs).orderBy(desc(automationLogs.createdAt)).limit(100),
    db.select().from(emailHistory).orderBy(desc(emailHistory.sentAt)).limit(100),
    db.select().from(paymentReceipts).orderBy(desc(paymentReceipts.issuedAt)).limit(100),
    db.select().from(abandonedCartReminders).orderBy(desc(abandonedCartReminders.createdAt)).limit(100),
  ]);

  const latestEmail = (predicate: (row: typeof emailRows[number]) => boolean) =>
    emailRows.find(predicate) ?? null;
  const latestByTemplate = (templateName: string) =>
    latestEmail((row) => row.templateName === templateName);

  const latestPaymentReceipt = receiptRows[0] ?? null;
  const latestReminder = reminderRows[0] ?? null;
  const latestManualCommunication = automationLogRows[0] ?? null;
  const latestArtResend = latestByTemplate("sendArtResendRequestEmail");
  const latestProof = latestByTemplate("sendProofForApprovalEmail");
  const latestOrderConfirmation = latestEmail((row) => row.emailType === "order_confirmation");
  const latestPaymentConfirmation = latestEmail((row) => row.emailType === "payment_confirmation");
  const latestStatusUpdate = latestEmail((row) =>
    ["production_started", "ready_for_pickup", "ready_for_delivery", "shipped", "delivered", "order_cancelled"].includes(row.emailType)
  );

  const automations = [
    {
      id: "payment-receipt",
      category: "Financeiro",
      name: "Recibo e confirmação de pagamento",
      description: "Emite um recibo único e envia o comprovante por e-mail após a confirmação financeira.",
      trigger: "Pagamento confirmado em Contas a Receber",
      channel: "Documento e e-mail",
      tracking: "Histórico de recibos e e-mails",
      health: latestPaymentReceipt?.emailSentAt ? "active" : latestPaymentReceipt ? "attention" : "active" as AutomationHealth,
      lastExecutedAt: latestPaymentReceipt ? latestPaymentReceipt.emailSentAt ?? latestPaymentReceipt.issuedAt : null,
      result: latestPaymentReceipt
        ? latestPaymentReceipt.emailSentAt
          ? `Recibo ${latestPaymentReceipt.receiptNumber} emitido e e-mail registrado.`
          : `Recibo ${latestPaymentReceipt.receiptNumber} emitido; envio por e-mail sem registro.`
        : "Nenhuma emissão registrada ainda.",
    },
    {
      id: "pix-confirmation",
      category: "Financeiro",
      name: "Confirmação de pagamento via Pix",
      description: "Notifica o cliente por e-mail quando o retorno de pagamento Pix é confirmado.",
      trigger: "Confirmação recebida do pagamento Pix",
      channel: "E-mail",
      tracking: "Histórico de e-mails quando disponível",
      health: healthFromResult(latestPaymentConfirmation?.status),
      lastExecutedAt: latestPaymentConfirmation ? toTimestamp(latestPaymentConfirmation.sentAt) : null,
      result: latestPaymentConfirmation
        ? latestPaymentConfirmation.status === "sent"
          ? "Confirmação de pagamento enviada ao cliente."
          : latestPaymentConfirmation.errorMessage || "Última tentativa exige revisão."
        : "Ainda sem execução registrada neste histórico.",
    },
    {
      id: "order-confirmation",
      category: "Pedidos",
      name: "Confirmação de pedido",
      description: "Envia a confirmação e o link de acompanhamento após a finalização do checkout.",
      trigger: "Pedido criado no checkout",
      channel: "E-mail",
      tracking: "Histórico de e-mails quando disponível",
      health: healthFromResult(latestOrderConfirmation?.status),
      lastExecutedAt: latestOrderConfirmation ? toTimestamp(latestOrderConfirmation.sentAt) : null,
      result: latestOrderConfirmation
        ? latestOrderConfirmation.status === "sent"
          ? "Confirmação de pedido enviada ao cliente."
          : latestOrderConfirmation.errorMessage || "Última tentativa exige revisão."
        : "Gatilho ativo; esta rotina ainda não possui execução persistida no histórico atual.",
    },
    {
      id: "order-status",
      category: "Pedidos",
      name: "Atualização de status do pedido",
      description: "Comunica alterações relevantes de status para que o cliente acompanhe o pedido.",
      trigger: "Alteração de status pelo painel operacional",
      channel: "E-mail",
      tracking: "Histórico de e-mails quando disponível",
      health: healthFromResult(latestStatusUpdate?.status),
      lastExecutedAt: latestStatusUpdate ? toTimestamp(latestStatusUpdate.sentAt) : null,
      result: latestStatusUpdate
        ? latestStatusUpdate.status === "sent"
          ? "Atualização de status enviada ao cliente."
          : latestStatusUpdate.errorMessage || "Última tentativa exige revisão."
        : "Gatilho ativo; esta rotina ainda não possui execução persistida no histórico atual.",
    },
    {
      id: "proof-approval",
      category: "Produção",
      name: "Prova de arte para aprovação",
      description: "Envia a prova de arte e orienta o cliente a aprovar ou recusar antes da produção.",
      trigger: "Operador envia prova de arte na pré-impressão",
      channel: "E-mail",
      tracking: "Histórico de e-mails de pré-impressão",
      health: healthFromResult(latestProof?.status),
      lastExecutedAt: latestProof ? toTimestamp(latestProof.sentAt) : null,
      result: latestProof
        ? latestProof.status === "sent"
          ? "Prova de arte enviada para aprovação."
          : latestProof.errorMessage || "Última tentativa exige revisão."
        : "Nenhuma prova enviada foi registrada ainda.",
    },
    {
      id: "art-resend",
      category: "Produção",
      name: "Solicitação de reenvio de arte",
      description: "Avisa o cliente quando a arte precisa de correção ou de novo envio.",
      trigger: "Operador solicita reenvio na pré-impressão",
      channel: "E-mail e alerta operacional",
      tracking: "Histórico de e-mails de pré-impressão",
      health: healthFromResult(latestArtResend?.status),
      lastExecutedAt: latestArtResend ? toTimestamp(latestArtResend.sentAt) : null,
      result: latestArtResend
        ? latestArtResend.status === "sent"
          ? "Solicitação de reenvio enviada ao cliente."
          : latestArtResend.errorMessage || "Última tentativa exige revisão."
        : "Nenhuma solicitação de reenvio foi registrada ainda.",
    },
    {
      id: "abandoned-cart-reminder",
      category: "Carrinho",
      name: "Recuperação de carrinho abandonado",
      description: "Registra lembretes comerciais enviados ou preparados para recuperar um carrinho abandonado.",
      trigger: "Ação de recuperação na central de carrinhos",
      channel: "E-mail ou WhatsApp preparado",
      tracking: "Histórico de lembretes de carrinho",
      health: healthFromResult(latestReminder?.status),
      lastExecutedAt: latestReminder ? toTimestamp(latestReminder.sentAt) ?? toTimestamp(latestReminder.createdAt) : null,
      result: latestReminder
        ? latestReminder.status === "sent"
          ? "Lembrete enviado ao cliente."
          : latestReminder.status === "prepared"
            ? "Mensagem preparada para atendimento; ainda não representa envio confirmado."
            : "Última tentativa de lembrete falhou."
        : "Nenhum lembrete de carrinho foi registrado ainda.",
    },
    {
      id: "abandoned-cart-cleanup",
      category: "Carrinho",
      name: "Limpeza de carrinhos expirados",
      description: "Remove carrinhos abandonados após 48 horas por uma rotina protegida por agenda.",
      trigger: "Execução programada da rotina de retenção",
      channel: "Processamento interno",
      tracking: "Retorno operacional da rotina",
      health: "active" as AutomationHealth,
      lastExecutedAt: null,
      result: "Rotina ativa; a execução ainda não grava histórico persistido para consulta nesta central.",
    },
    {
      id: "account-security",
      category: "Conta e segurança",
      name: "E-mails de acesso e segurança",
      description: "Dispara boas-vindas, verificação de e-mail, redefinição de senha e alertas de acesso suspeito.",
      trigger: "Cadastro, alteração de senha ou evento de segurança",
      channel: "E-mail",
      tracking: "Execução transacional",
      health: "active" as AutomationHealth,
      lastExecutedAt: null,
      result: "Gatilhos ativos; estes e-mails ainda não possuem histórico persistido nesta central.",
    },
    {
      id: "operator-art-alert",
      category: "Comunicação interna",
      name: "Alerta de nova arte reenviada",
      description: "Notifica o time responsável quando o cliente envia uma nova arte para revisão.",
      trigger: "Cliente reenviou arte no acompanhamento do pedido",
      channel: "Notificação interna",
      tracking: "Entrega pela central de notificações",
      health: "active" as AutomationHealth,
      lastExecutedAt: null,
      result: "Gatilho ativo; a entrega interna não mantém histórico persistido nesta central.",
    },
    {
      id: "assisted-channels",
      category: "Canais assistidos",
      name: "Comunicações manuais registradas",
      description: "Centraliza registros de WhatsApp, e-mail, SMS e notificações iniciados manualmente pelo painel.",
      trigger: "Ação administrativa sob demanda",
      channel: "WhatsApp, e-mail, SMS e notificação",
      tracking: "Log de automações",
      health: latestManualCommunication ? healthFromResult(latestManualCommunication.status) : "manual" as AutomationHealth,
      lastExecutedAt: latestManualCommunication ? toTimestamp(latestManualCommunication.createdAt) : null,
      result: latestManualCommunication
        ? latestManualCommunication.status === "enviado"
          ? `Último registro enviado pelo canal ${latestManualCommunication.type}.`
          : latestManualCommunication.errorMessage || "Último registro requer acompanhamento."
        : "Sem registros manuais. WhatsApp e SMS permanecem identificados como canais em preparação.",
    },
  ];

  const recentActivity = [
    ...emailRows.map((row) => ({
      id: `email-${row.id}`,
      source: "E-mail transacional",
      label: row.subject,
      channel: "E-mail",
      status: activityStatusFromResult(row.status),
      result: row.status === "sent" ? `Enviado para ${row.recipientEmail}` : row.errorMessage || "Entrega exige revisão.",
      occurredAt: toTimestamp(row.sentAt) ?? toTimestamp(row.createdAt) ?? 0,
    })),
    ...receiptRows.map((row) => ({
      id: `receipt-${row.id}`,
      source: "Financeiro",
      label: `Recibo ${row.receiptNumber}`,
      channel: row.emailSentAt ? "Recibo e e-mail" : "Recibo",
      status: row.emailSentAt ? "success" as ActivityStatus : "prepared" as ActivityStatus,
      result: row.emailSentAt ? "Recibo emitido e e-mail registrado." : "Recibo emitido; e-mail ainda não registrado.",
      occurredAt: row.emailSentAt ?? row.issuedAt,
    })),
    ...reminderRows.map((row) => ({
      id: `reminder-${row.id}`,
      source: "Carrinhos abandonados",
      label: `Lembrete via ${row.channel}`,
      channel: row.channel === "whatsapp" ? "WhatsApp" : "E-mail",
      status: activityStatusFromResult(row.status),
      result: row.status === "sent" ? `Enviado para ${row.recipient}` : row.status === "prepared" ? "Preparado para atendimento; não confirmado como enviado." : "Falha no lembrete.",
      occurredAt: toTimestamp(row.sentAt) ?? toTimestamp(row.createdAt) ?? 0,
    })),
    ...automationLogRows.map((row) => ({
      id: `automation-${row.id}`,
      source: "Comunicação assistida",
      label: `Pedido #${row.orderId}`,
      channel: row.type === "notificacao" ? "Notificação" : row.type === "email" ? "E-mail" : row.type === "sms" ? "SMS" : "WhatsApp",
      status: activityStatusFromResult(row.status),
      result: row.status === "enviado" ? `Registro enviado para ${row.recipient}.` : row.errorMessage || "Registro pendente de acompanhamento.",
      occurredAt: toTimestamp(row.createdAt) ?? 0,
    })),
  ]
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 12);

  return {
    automations,
    recentActivity,
    summary: {
      total: automations.length,
      active: automations.filter((item) => item.health === "active").length,
      attention: automations.filter((item) => item.health === "attention").length,
      withHistory: automations.filter((item) => item.lastExecutedAt !== null).length,
    },
  };
}

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
