import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("alerta de pagamento confirmado na área do cliente", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/pages/cliente/OrderDetailPage.tsx"),
    "utf8"
  );

  it("reconhece confirmação por status de pagamento e status do pedido", () => {
    expect(source).toContain('const isPaymentConfirmed = ["pago", "approved"]');
    expect(source).toContain('order.status === "pagamento_aprovado"');
  });

  it("exibe uma mensagem visual de sucesso somente após a confirmação", () => {
    expect(source).toContain("{isPaymentConfirmed && (");
    expect(source).toContain('role="alert"');
    expect(source).toContain("Pagamento confirmado!");
    expect(source).toContain("Recebemos a confirmação do seu pagamento");
  });
});
