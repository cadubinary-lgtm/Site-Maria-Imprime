import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/MercadoPagoSettings.tsx"), "utf8");

describe("configurações do Mercado Pago", () => {
  it("usa rosa nos controles e orientações não semânticas", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("bg-pink-50 border border-pink-200");
    expect(source).toContain("text-pink-600 hover:text-pink-700");
  });

  it("mantém estados de pagamento em cores semânticas", () => {
    expect(source).toContain("bg-green-100 text-green-700 border-green-200");
    expect(source).toContain("bg-yellow-100 text-yellow-700 border-yellow-200");
    expect(source).toContain("bg-red-50 border-red-200");
  });

  it("nomeia controles sensíveis, métodos de pagamento e processamento", () => {
    expect(source).toContain('aria-label={showToken ? "Ocultar Access Token" : "Mostrar Access Token"}');
    expect(source).toContain('aria-label={form.pixEnabled ? "Desativar pagamento por Pix" : "Ativar pagamento por Pix"}');
    expect(source).toContain('aria-label={form.cardEnabled ? "Desativar pagamento por cartão" : "Ativar pagamento por cartão"}');
    expect(source).toContain("aria-busy={saveMutation.isPending}");
  });
});
