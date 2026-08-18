import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminCompanySettings.tsx"), "utf8");

describe("dados administrativos da empresa", () => {
  it("comunica os estados de atendimento e salvamento de maneira acessível", () => {
    expect(source).toContain('aria-pressed={form.whatsappBusinessDays.includes(day.value)}');
    expect(source).toContain('aria-busy={saveSettings.isPending}');
    expect(source).toContain('aria-label="Carregando dados da empresa"');
  });

  it("nomeia switches sociais, upload de logotipo e editor de termos", () => {
    expect(source).toContain('aria-label="Exibir Instagram no rodapé"');
    expect(source).toContain('id="print-logo-upload"');
    expect(source).toContain('role="textbox"');
    expect(source).toContain('aria-label="Termos e condições da ordem de serviço"');
  });

  it("mantém as ações institucionais na identidade rosa", () => {
    expect(source).toContain('bg-pink-600 hover:bg-pink-700');
    expect(source).toContain('focus-visible:ring-pink-300');
  });
});
