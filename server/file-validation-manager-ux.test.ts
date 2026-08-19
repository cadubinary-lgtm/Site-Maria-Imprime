import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FileValidationManager.tsx"), "utf8");

describe("central de validação de arquivos", () => {
  it("usa rosa nas abas, retorno e aprovação", () => {
    expect(source).toContain("bg-pink-600 text-white hover:bg-pink-700");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("text-pink-700 transition-colors hover:bg-pink-50");
  });

  it("mantém aprovados, rejeitados e análise com cores semânticas", () => {
    expect(source).toContain('color: "bg-green-100 text-green-800"');
    expect(source).toContain('color: "bg-red-100 text-red-800"');
    expect(source).toContain('color: "bg-yellow-100 text-yellow-800"');
  });

  it("atualiza as consultas depois da decisão e identifica ações por arquivo", () => {
    expect(source).toContain("utils.web2print.getPendingValidations.invalidate()");
    expect(source).toContain("utils.web2print.countByStatus.invalidate()");
    expect(source).toContain('aria-label={`Aprovar arquivo ${validation.fileName}`}');
    expect(source).toContain('aria-label={`Rejeitar arquivo ${validation.fileName}`}');
    expect(source).toContain('position: "top-right"');
  });
});
