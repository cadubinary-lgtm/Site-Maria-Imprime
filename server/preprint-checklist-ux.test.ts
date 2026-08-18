import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("orientações públicas de preparação de arte", () => {
  it("expõe a conferência como uma lista sem duplicar a leitura dos ícones", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/PrePrintChecklist.tsx"), "utf8");

    expect(source).toContain('aria-label="Conferência de arquivo antes da produção"');
    expect(source).toContain('aria-label="Itens conferidos no arquivo"');
    expect(source).toContain("<ul");
    expect(source).toContain('alt="" aria-hidden="true"');
  });

  it("oferece continuidade para as normas de envio de arte", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/PrePrintChecklist.tsx"), "utf8");

    expect(source).toContain('href="/documentos"');
    expect(source).toContain("Ver normas para envio de arte");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
  });
});
