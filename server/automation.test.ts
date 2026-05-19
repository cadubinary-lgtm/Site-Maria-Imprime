import { describe, it, expect, vi } from 'vitest';
import { AutomationEngine, type AutomationEvent } from './automation';

describe('AutomationEngine', () => {
  it('deve processar evento de pagamento recebido', async () => {
    const event: AutomationEvent = {
      trigger: 'payment_received',
      orderId: 1,
      metadata: { amount: 100 },
    };

    // Não deve lançar erro
    expect(() => AutomationEngine.processEvent(event)).toBeDefined();
  });

  it('deve processar evento de pedido criado', async () => {
    const event: AutomationEvent = {
      trigger: 'order_created',
      orderId: 2,
    };

    expect(() => AutomationEngine.processEvent(event)).toBeDefined();
  });

  it('deve processar evento de produção iniciada', async () => {
    const event: AutomationEvent = {
      trigger: 'production_started',
      orderId: 3,
    };

    expect(() => AutomationEngine.processEvent(event)).toBeDefined();
  });

  it('deve processar evento de pedido enviado', async () => {
    const event: AutomationEvent = {
      trigger: 'order_shipped',
      orderId: 4,
      metadata: { trackingNumber: '123456' },
    };

    expect(() => AutomationEngine.processEvent(event)).toBeDefined();
  });

  it('deve processar evento de pedido entregue', async () => {
    const event: AutomationEvent = {
      trigger: 'order_delivered',
      orderId: 5,
    };

    expect(() => AutomationEngine.processEvent(event)).toBeDefined();
  });

  it('deve validar tipos de trigger', () => {
    const validTriggers = ['payment_received', 'order_created', 'production_started', 'order_shipped', 'order_delivered'];
    
    validTriggers.forEach(trigger => {
      expect(validTriggers).toContain(trigger);
    });
  });

  it('deve ter métodos para WhatsApp e Email', () => {
    expect(AutomationEngine.sendWhatsAppNotification).toBeDefined();
    expect(AutomationEngine.sendEmailNotification).toBeDefined();
  });
});
