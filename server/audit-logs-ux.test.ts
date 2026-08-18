import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AuditLogs.tsx"), "utf8");

describe("logs de auditoria", () => {
  it("usa rosa em controles e no registro não semântico de senha", () => {
    expect(source).toContain('reset_password: { label: "Resetou senha", color: "bg-pink-500/20 text-pink-400" }');
    expect(source).toContain("border-pink-300 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("text-pink-600");
  });

  it("identifica carregamento, atualização e paginação", () => {
    expect(source).toContain('aria-label="Carregando logs de auditoria"');
    expect(source).toContain("aria-busy={isLoading}");
    expect(source).toContain('aria-label="Ver página anterior de logs"');
    expect(source).toContain('aria-label="Ver próxima página de logs"');
  });

  it("anuncia a faixa de resultados", () => {
    expect(source).toContain('aria-live="polite"');
  });
});
