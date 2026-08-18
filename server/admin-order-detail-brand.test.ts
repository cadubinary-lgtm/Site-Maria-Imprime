import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("detalhes administrativos do pedido", () => {
  it("aplica rosa aos controles de marca de envio e pré-impressão", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("border-pink-200 bg-white");
    expect(source).toContain("accent-pink-600");
  });

  it("mantém controles de prévia e ícones identificáveis para tecnologias assistivas", () => {
    expect(source).toContain('aria-label="Selecionar prévia da arte"');
    expect(source).toContain('aria-label="Remover prévia da arte selecionada"');
    expect(source).toContain('alt="Prévia da arte selecionada"');
    expect(source).toContain('aria-hidden="true"');
  });
});
