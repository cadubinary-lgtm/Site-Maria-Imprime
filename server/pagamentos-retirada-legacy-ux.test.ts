import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/PagamentosRetirada.tsx"), "utf8");

describe("página legada de pagamentos na retirada", () => {
  it("usa rosa para totais, filtros, carregamento, valores e paginação", () => {
    expect(source).toContain("border border-pink-200 bg-pink-50");
    expect(source).toContain("bg-pink-600 text-white border-pink-600");
    expect(source).toContain("border-pink-600 border-t-transparent");
    expect(source).toContain("font-semibold text-pink-600");
  });

  it("preserva os estados de pagamento e produção com cores semânticas", () => {
    expect(source).toContain('pendente: { label: "Pendente", color: "bg-orange-100 text-orange-700"');
    expect(source).toContain('pago: { label: "Pago", color: "bg-green-100 text-green-700"');
    expect(source).toContain('em_producao: { label: "Em Produção", color: "bg-orange-100 text-orange-700"');
  });

  it("identifica filtros, paginação e links de pedido sem botões aninhados", () => {
    expect(source).toContain("aria-pressed={statusFilter === s}");
    expect(source).toContain('aria-label={`Ver pedido ${order.id}`}');
    expect(source).toContain('aria-label="Próxima página"');
    expect(source).not.toContain('Link href="/admin/gerenciador-financeiro">\n            <Button');
  });
});
