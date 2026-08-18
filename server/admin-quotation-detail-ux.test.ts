import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminQuotationDetail.tsx"), "utf8");

describe("detalhes administrativos de orçamento", () => {
  it("mantém o detalhe no layout administrativo e preserva a navegação de retorno", () => {
    expect(source).toContain('import AdminLayout from "@/components/AdminLayout"');
    expect(source).toContain("<AdminLayout>");
    expect(source).toContain("navigate(returnTarget.path)");
  });

  it("estrura itens, total e ações comerciais com semântica acessível", () => {
    expect(source).toContain('scope="col"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-busy={updateStatus.isPending}');
    expect(source).toContain('aria-busy={convertToOrder.isPending}');
  });

  it("permite ampliar e fechar imagens de produto e arte com controles nomeados", () => {
    expect(source).toContain('aria-label={`Ampliar imagem de ${item.productName}`}');
    expect(source).toContain('aria-label={`Ampliar arte de ${item.productName}`}');
    expect(source).toContain('aria-label="Fechar prévia da imagem"');
    expect(source).toContain('aria-label="Prévia ampliada da imagem"');
  });
});
