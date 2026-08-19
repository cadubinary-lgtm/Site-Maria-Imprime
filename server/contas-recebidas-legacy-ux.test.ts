import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ContasRecebidas.tsx"), "utf8");

describe("página legada de contas recebidas", () => {
  it("usa rosa no carregamento, navegação e paginação", () => {
    expect(source).toContain("border-pink-600 border-t-transparent");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("text-pink-700 transition-colors hover:bg-pink-50");
  });

  it("mantém a confirmação de pagamento em verde semântico", () => {
    expect(source).toContain("border border-green-200 bg-green-50");
    expect(source).toContain("font-semibold text-green-600");
    expect(source).toContain('pagamento_aprovado: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-700"');
  });

  it("identifica carregamento, paginação e a abertura de cada pedido", () => {
    expect(source).toContain('aria-label="Carregando contas recebidas"');
    expect(source).toContain('aria-label={`Ver pedido ${order.id}`}');
    expect(source).toContain('aria-label="Página anterior"');
    expect(source).not.toContain('Link href="/admin/gerenciador-financeiro">\n            <Button');
  });
});
