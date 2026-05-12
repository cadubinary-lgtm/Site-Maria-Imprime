import { describe, it, expect } from "vitest";

/**
 * Testes para a lógica da Calculadora Gráfica
 * 
 * A calculadora funciona como uma calculadora financeira:
 * - Usuário digita números sem ponto ou vírgula
 * - Valor interno é multiplicado por 100 (1234 = 12.34)
 * - Sempre mantém 2 casas decimais
 */

describe("Calculadora Gráfica - Lógica de Formatação", () => {
  /**
   * Formata um número para exibição com 2 casas decimais
   * Exemplo: 1234 -> "12.34"
   */
  function formatValue(num: number): string {
    return (num / 100).toFixed(2);
  }

  /**
   * Converte valor exibido para número interno
   * Exemplo: "12.34" -> 1234
   */
  function parseDisplayValue(display: string): number {
    const cleaned = display.replace(/[^\d]/g, "");
    return parseInt(cleaned || "0", 10);
  }

  describe("formatValue", () => {
    it("deve formatar 0 como 0.00", () => {
      expect(formatValue(0)).toBe("0.00");
    });

    it("deve formatar 1 como 0.01", () => {
      expect(formatValue(1)).toBe("0.01");
    });

    it("deve formatar 12 como 0.12", () => {
      expect(formatValue(12)).toBe("0.12");
    });

    it("deve formatar 123 como 1.23", () => {
      expect(formatValue(123)).toBe("1.23");
    });

    it("deve formatar 1234 como 12.34", () => {
      expect(formatValue(1234)).toBe("12.34");
    });

    it("deve formatar 12345 como 123.45", () => {
      expect(formatValue(12345)).toBe("123.45");
    });

    it("deve formatar 123456 como 1234.56", () => {
      expect(formatValue(123456)).toBe("1234.56");
    });

    it("deve formatar 1000 como 10.00", () => {
      expect(formatValue(1000)).toBe("10.00");
    });

    it("deve formatar 100 como 1.00", () => {
      expect(formatValue(100)).toBe("1.00");
    });
  });

  describe("parseDisplayValue", () => {
    it("deve parsear '0.00' como 0", () => {
      expect(parseDisplayValue("0.00")).toBe(0);
    });

    it("deve parsear '0.01' como 1", () => {
      expect(parseDisplayValue("0.01")).toBe(1);
    });

    it("deve parsear '0.12' como 12", () => {
      expect(parseDisplayValue("0.12")).toBe(12);
    });

    it("deve parsear '1.23' como 123", () => {
      expect(parseDisplayValue("1.23")).toBe(123);
    });

    it("deve parsear '12.34' como 1234", () => {
      expect(parseDisplayValue("12.34")).toBe(1234);
    });

    it("deve parsear '123.45' como 12345", () => {
      expect(parseDisplayValue("123.45")).toBe(12345);
    });

    it("deve remover caracteres inválidos", () => {
      expect(parseDisplayValue("12a3b4")).toBe(1234);
    });

    it("deve retornar 0 para string vazia", () => {
      expect(parseDisplayValue("")).toBe(0);
    });
  });

  describe("Fluxo de Digitação", () => {
    it("deve simular digitação: 1 -> 0.01", () => {
      const value = 1;
      expect(formatValue(value)).toBe("0.01");
    });

    it("deve simular digitação: 1,2 -> 0.12", () => {
      const value = 12;
      expect(formatValue(value)).toBe("0.12");
    });

    it("deve simular digitação: 1,2,3 -> 1.23", () => {
      const value = 123;
      expect(formatValue(value)).toBe("1.23");
    });

    it("deve simular digitação: 1,2,3,4 -> 12.34", () => {
      const value = 1234;
      expect(formatValue(value)).toBe("12.34");
    });

    it("deve simular digitação: 1,2,3,4,5 -> 123.45", () => {
      const value = 12345;
      expect(formatValue(value)).toBe("123.45");
    });
  });

  describe("Fluxo de Backspace", () => {
    it("deve remover dígito: 123.45 -> 12.34", () => {
      const current = "12345";
      const removed = current.slice(0, -1);
      expect(formatValue(parseInt(removed))).toBe("12.34");
    });

    it("deve remover dígito: 12.34 -> 1.23", () => {
      const current = "1234";
      const removed = current.slice(0, -1);
      expect(formatValue(parseInt(removed))).toBe("1.23");
    });

    it("deve remover dígito: 1.23 -> 0.12", () => {
      const current = "123";
      const removed = current.slice(0, -1);
      expect(formatValue(parseInt(removed))).toBe("0.12");
    });

    it("deve remover dígito: 0.12 -> 0.01", () => {
      const current = "12";
      const removed = current.slice(0, -1);
      expect(formatValue(parseInt(removed))).toBe("0.01");
    });

    it("deve remover dígito: 0.01 -> 0.00", () => {
      const current = "1";
      const removed = current.length > 1 ? current.slice(0, -1) : "0";
      expect(formatValue(parseInt(removed))).toBe("0.00");
    });
  });

  describe("Cálculo de Área", () => {
    it("deve calcular área: 1.00m x 1.00m = 1.00m²", () => {
      const width = 100; // 1.00
      const height = 100; // 1.00
      const area = (width / 100) * (height / 100);
      expect(Math.round(area * 100) / 100).toBe(1.0);
    });

    it("deve calcular área: 2.00m x 3.00m = 6.00m²", () => {
      const width = 200; // 2.00
      const height = 300; // 3.00
      const area = (width / 100) * (height / 100);
      expect(Math.round(area * 100) / 100).toBe(6.0);
    });

    it("deve calcular área: 1.50m x 2.50m = 3.75m²", () => {
      const width = 150; // 1.50
      const height = 250; // 2.50
      const area = (width / 100) * (height / 100);
      expect(Math.round(area * 100) / 100).toBe(3.75);
    });

    it("deve calcular área: 0.50m x 0.50m = 0.25m²", () => {
      const width = 50; // 0.50
      const height = 50; // 0.50
      const area = (width / 100) * (height / 100);
      expect(Math.round(area * 100) / 100).toBe(0.25);
    });
  });

  describe("Validação de Entrada", () => {
    it("deve aceitar apenas números", () => {
      const input = "1a2b3c4d";
      const cleaned = input.replace(/[^\d]/g, "");
      expect(cleaned).toBe("1234");
    });

    it("deve rejeitar múltiplos pontos", () => {
      const input = "12.34.56";
      const cleaned = input.replace(/[^\d]/g, "");
      expect(cleaned).toBe("123456");
    });

    it("deve limitar a 10 dígitos", () => {
      const input = "12345678901";
      const limited = input.length > 10 ? input.slice(0, 10) : input;
      expect(limited).toBe("1234567890");
    });

    it("deve retornar 0 para entrada vazia", () => {
      const input = "";
      const value = parseInt(input || "0", 10);
      expect(value).toBe(0);
    });
  });
});
