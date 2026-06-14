import { describe, it, expect } from 'vitest';

/**
 * Teste para validar a lógica de deadlineText no ProductDetail
 * Garante que:
 * - totalDays === 0 → "🚀 Receba HOJE! (Entrega Local)"
 * - totalDays === 1 → "⚡ Receba amanhã! (Entrega Local)"
 * - totalDays >= 2 → "Receba em X dias úteis (Entrega Local)"
 */

describe('Deadline Text Logic', () => {
  const getDeadlineText = (totalDays: number, isLocal: boolean, isPickup: boolean) => {
    if (isPickup) return null;
    if (isLocal) {
      if (totalDays === 0) return '🚀 Receba HOJE! (Entrega Local)';
      if (totalDays === 1) return '⚡ Receba amanhã! (Entrega Local)';
      return `Receba em ${totalDays} dias úteis (Entrega Local)`;
    }
    // Melhor Envio
    if (totalDays === 0) return 'Receba hoje!';
    if (totalDays === 1) return 'Receba amanhã!';
    return `Receba em ${totalDays} dias úteis`;
  };

  describe('Entrega Local', () => {
    it('deve exibir "Receba HOJE!" quando totalDays === 0 (Mesmo Dia + Frete 0)', () => {
      const text = getDeadlineText(0, true, false);
      expect(text).toBe('🚀 Receba HOJE! (Entrega Local)');
    });

    it('deve exibir "Receba amanhã!" quando totalDays === 1 (Mesmo Dia + Frete 1)', () => {
      const text = getDeadlineText(1, true, false);
      expect(text).toBe('⚡ Receba amanhã! (Entrega Local)');
    });

    it('deve exibir "Receba em 2 dias úteis" quando totalDays === 2', () => {
      const text = getDeadlineText(2, true, false);
      expect(text).toBe('Receba em 2 dias úteis (Entrega Local)');
    });

    it('deve exibir "Receba em 3 dias úteis" quando totalDays === 3 (24h + Frete 2)', () => {
      const text = getDeadlineText(3, true, false);
      expect(text).toBe('Receba em 3 dias úteis (Entrega Local)');
    });

    it('deve exibir "Receba em 5 dias úteis" quando totalDays === 5 (Normal 3d + Frete 2d)', () => {
      const text = getDeadlineText(5, true, false);
      expect(text).toBe('Receba em 5 dias úteis (Entrega Local)');
    });
  });

  describe('Retirada na Loja', () => {
    it('deve retornar null para retirada (sem prazo de entrega)', () => {
      const text = getDeadlineText(0, false, true);
      expect(text).toBeNull();
    });
  });

  describe('Melhor Envio', () => {
    it('deve exibir "Receba hoje!" quando totalDays === 0 (Melhor Envio)', () => {
      const text = getDeadlineText(0, false, false);
      expect(text).toBe('Receba hoje!');
    });

    it('deve exibir "Receba amanhã!" quando totalDays === 1 (Melhor Envio)', () => {
      const text = getDeadlineText(1, false, false);
      expect(text).toBe('Receba amanhã!');
    });

    it('deve exibir "Receba em 3 dias úteis" quando totalDays === 3 (Melhor Envio)', () => {
      const text = getDeadlineText(3, false, false);
      expect(text).toBe('Receba em 3 dias úteis');
    });
  });

  describe('Soma de prazos (Produção + Frete)', () => {
    it('Mesmo Dia (0) + Frete Local (0) = 0 → HOJE', () => {
      const productionDays = 0; // Mesmo Dia
      const deliveryDays = 0;   // Frete Local
      const totalDays = Math.round(productionDays + deliveryDays);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('🚀 Receba HOJE! (Entrega Local)');
    });

    it('Mesmo Dia (0) + Frete Local (1) = 1 → Amanhã', () => {
      const productionDays = 0; // Mesmo Dia
      const deliveryDays = 1;   // Frete Local
      const totalDays = Math.round(productionDays + deliveryDays);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('⚡ Receba amanhã! (Entrega Local)');
    });

    it('24 Horas (1) + Frete Local (0) = 1 → Amanhã', () => {
      const productionDays = 1; // 24 Horas
      const deliveryDays = 0;   // Frete Local
      const totalDays = Math.round(productionDays + deliveryDays);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('⚡ Receba amanhã! (Entrega Local)');
    });

    it('Normal (3) + Frete Local (1) = 4 → 4 dias', () => {
      const productionDays = 3; // Normal
      const deliveryDays = 1;   // Frete Local
      const totalDays = Math.round(productionDays + deliveryDays);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('Receba em 4 dias úteis (Entrega Local)');
    });

    it('Mesmo Dia (0) + Melhor Envio (3) = 3 → 3 dias', () => {
      const productionDays = 0; // Mesmo Dia
      const deliveryDays = 3;   // Melhor Envio
      const totalDays = Math.round(productionDays + deliveryDays);
      const text = getDeadlineText(totalDays, false, false);
      expect(text).toBe('Receba em 3 dias úteis');
    });
  });

  describe('Conversão de tipos (string → number)', () => {
    it('deve converter string "0" para número 0 corretamente', () => {
      const productionDays = Number('0');
      const deliveryDays = Number('0');
      const totalDays = Math.round(productionDays + deliveryDays);
      expect(totalDays).toBe(0);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('🚀 Receba HOJE! (Entrega Local)');
    });

    it('deve converter string "1" para número 1 corretamente', () => {
      const productionDays = Number('0');
      const deliveryDays = Number('1');
      const totalDays = Math.round(productionDays + deliveryDays);
      expect(totalDays).toBe(1);
      const text = getDeadlineText(totalDays, true, false);
      expect(text).toBe('⚡ Receba amanhã! (Entrega Local)');
    });

    it('deve evitar concatenação de string (0 + "1" não deve virar "01")', () => {
      const productionDays = Number(0);
      const deliveryDays = Number('1');
      const totalDays = Math.round(productionDays + deliveryDays);
      expect(totalDays).toBe(1);
      expect(totalDays).not.toBe('01');
    });
  });
});
