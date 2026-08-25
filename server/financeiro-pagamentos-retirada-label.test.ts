import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/admin/FinanceiroPagamentosRetirada.tsx"), "utf8");

describe("rótulo de pagamento na retirada", () => {
  it("mostra A Receber para o estágio pago sem alterar o valor técnico ou suas transições", () => {
    expect(source).toContain('pago: { label: "A Receber"');
    expect(source).toContain('pronto_retirada: ["pago", "retirado_cliente", "retirado_terceiros"]');
    expect(source).toContain('pago: ["retirado_cliente", "retirado_terceiros"]');
    expect(source).toContain('status: actionDialog.nextStatus');
  });
});
