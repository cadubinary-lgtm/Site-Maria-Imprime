import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminDashboard.tsx"), "utf8");

describe("dashboard administrativo", () => {
  it("padroniza atalhos e indicadores na identidade rosa sem alterar alertas semânticos", () => {
    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-pink-100");
    expect(source).toContain("bg-amber-100");
    expect(source).not.toContain("text-orange-500");
  });

  it("expõe indicadores, gráficos e tabela com semântica acessível", () => {
    expect(source).toContain('aria-label="Indicadores principais"');
    expect(source).toContain('aria-label="Gráfico de faturamento dos últimos sete dias"');
    expect(source).toContain('aria-label="Gráfico de distribuição de pedidos por status"');
    expect(source).toContain('scope="col"');
  });

  it("nomeia as ações de detalhe e usa a marca correta no rodapé", () => {
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
    expect(source).toContain("Maria Imprime. Todos os direitos reservados.");
    expect(source).not.toContain("Sistema Online");
  });
});
