import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/admin/FinanceiroContasReceber.tsx"),
  "utf8",
);

describe("Contas a Receber — visualização de pedido", () => {
  it("exibe uma ação para abrir o detalhe do pedido da linha financeira", () => {
    expect(pageSource).toContain('title="Ver pedido"');
    expect(pageSource).toContain('onClick={() => setLocation(`/admin/pedidos/${item.pedidoId}`)}');
    expect(pageSource).toContain("<Eye className=\"h-3 w-3 mr-1\" />");
  });
});
