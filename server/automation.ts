import { getOrderById } from "./db";
import { orders, clients } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export type AutomationTrigger = "payment_received" | "order_created" | "production_started" | "order_shipped" | "order_delivered";

export interface AutomationEvent {
  trigger: AutomationTrigger;
  orderId: number;
  clientId?: number;
  metadata?: Record<string, any>;
}

/**
 * Sistema de automação para disparar notificações e ações
 */
export class AutomationEngine {
  /**
   * Processa um evento de automação
   */
  static async processEvent(event: AutomationEvent): Promise<void> {
    console.log(`[Automation] Processing event: ${event.trigger} for order ${event.orderId}`);

    try {
      // Buscar dados do pedido
      const order = await getOrderById(event.orderId);

      if (!order) {
        console.warn(`[Automation] Order ${event.orderId} not found`);
        return;
      }

      // Buscar dados do cliente (placeholder)
      let client = null;
      // TODO: Implementar busca de cliente quando schema estiver pronto

      // Disparar ações baseadas no trigger
      switch (event.trigger) {
        case "payment_received":
          await this.handlePaymentReceived(order, client, event.metadata);
          break;
        case "order_created":
          await this.handleOrderCreated(order, client, event.metadata);
          break;
        case "production_started":
          await this.handleProductionStarted(order, client, event.metadata);
          break;
        case "order_shipped":
          await this.handleOrderShipped(order, client, event.metadata);
          break;
        case "order_delivered":
          await this.handleOrderDelivered(order, client, event.metadata);
          break;
      }
    } catch (error) {
      console.error(`[Automation] Error processing event:`, error);
      await notifyOwner({
        title: "Erro na Automação",
        content: `Erro ao processar evento ${event.trigger} para pedido ${event.orderId}: ${error}`,
      });
    }
  }

  /**
   * Notifica quando pagamento é recebido
   */
  private static async handlePaymentReceived(order: any, client: any, metadata?: any): Promise<void> {
    console.log(`[Automation] Payment received for order ${order.id}`);

    // Notificar dono
    await notifyOwner({
      title: "Pagamento Recebido ✅",
      content: `Pedido #${order.id} - Cliente: ${client?.name || "N/A"} - Valor: R$ ${order.totalPrice}`,
    });

    // Aqui seria integrado WhatsApp/Email
    // await this.sendWhatsAppNotification(client?.phone, `Pagamento recebido para pedido #${order.id}`);
  }

  /**
   * Notifica quando pedido é criado
   */
  private static async handleOrderCreated(order: any, client: any, metadata?: any): Promise<void> {
    console.log(`[Automation] Order created: ${order.id}`);

    // Notificar dono
    await notifyOwner({
      title: "Novo Pedido 📦",
      content: `Pedido #${order.id} - Cliente: ${client?.name || "N/A"} - Status: ${order.status}`,
    });
  }

  /**
   * Notifica quando produção inicia
   */
  private static async handleProductionStarted(order: any, client: any, metadata?: any): Promise<void> {
    console.log(`[Automation] Production started for order ${order.id}`);

    // Notificar dono
    await notifyOwner({
      title: "Produção Iniciada 🏭",
      content: `Pedido #${order.id} entrou em produção`,
    });
  }

  /**
   * Notifica quando pedido é enviado
   */
  private static async handleOrderShipped(order: any, client: any, metadata?: any): Promise<void> {
    console.log(`[Automation] Order shipped: ${order.id}`);

    // Notificar dono
    await notifyOwner({
      title: "Pedido Enviado 🚚",
      content: `Pedido #${order.id} foi enviado`,
    });

    // Aqui seria integrado WhatsApp/Email para cliente
    // await this.sendWhatsAppNotification(client?.phone, `Seu pedido #${order.id} foi enviado!`);
  }

  /**
   * Notifica quando pedido é entregue
   */
  private static async handleOrderDelivered(order: any, client: any, metadata?: any): Promise<void> {
    console.log(`[Automation] Order delivered: ${order.id}`);

    // Notificar dono
    await notifyOwner({
      title: "Pedido Entregue ✨",
      content: `Pedido #${order.id} foi entregue com sucesso`,
    });

    // Aqui seria integrado WhatsApp/Email para cliente
    // await this.sendWhatsAppNotification(client?.phone, `Seu pedido #${order.id} foi entregue!`);
  }

  /**
   * Integração com WhatsApp (placeholder para Manus API)
   */
  static async sendWhatsAppNotification(phoneNumber: string, message: string): Promise<void> {
    if (!phoneNumber) {
      console.warn("[Automation] Phone number not provided for WhatsApp notification");
      return;
    }

    try {
      // Aqui seria integrado com Manus API para enviar WhatsApp
      console.log(`[Automation] WhatsApp message queued for ${phoneNumber}: ${message}`);
      // TODO: Implementar integração com Manus API
    } catch (error) {
      console.error(`[Automation] Error sending WhatsApp notification:`, error);
    }
  }

  /**
   * Integração com Email (placeholder para Manus API)
   */
  static async sendEmailNotification(email: string, subject: string, content: string): Promise<void> {
    if (!email) {
      console.warn("[Automation] Email not provided for email notification");
      return;
    }

    try {
      // Aqui seria integrado com Manus API para enviar Email
      console.log(`[Automation] Email queued for ${email}: ${subject}`);
      // TODO: Implementar integração com Manus API
    } catch (error) {
      console.error(`[Automation] Error sending email notification:`, error);
    }
  }
}
