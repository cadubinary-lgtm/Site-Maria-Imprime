import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHmac } from "node:crypto";
import { WebhookSignatureValidator } from "mercadopago";

describe("segurança do webhook Mercado Pago", () => {
  const source = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");

  it("valida x-signature, x-request-id e data.id antes de processar o pagamento", () => {
    expect(source).toContain("WebhookSignatureValidator.validate");
    expect(source).toContain("xSignature: req.header('x-signature')");
    expect(source).toContain("xRequestId: req.header('x-request-id')");
    expect(source).toContain("dataId: signedDataId");
    expect(source).toContain("toleranceSeconds: 300");
  });

  it("rejeita assinatura ausente ou inválida antes de atualizar pedido e pagamento", () => {
    const signatureValidation = source.indexOf("WebhookSignatureValidator.validate");
    const paymentUpdate = source.indexOf("paymentApi.get");
    expect(signatureValidation).toBeGreaterThan(-1);
    expect(paymentUpdate).toBeGreaterThan(signatureValidation);
    expect(source).toContain("return res.status(401).json({ error: 'Assinatura do webhook inválida' })");
  });

  it("aceita uma assinatura HMAC válida e rejeita uma assinatura alterada", () => {
    const secret = "teste-webhook-secreto";
    const dataId = "123456";
    const requestId = "req-seguro-123";
    const timestamp = String(Date.now());
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(() => WebhookSignatureValidator.validate({
      xSignature: `ts=${timestamp},v1=${signature}`,
      xRequestId: requestId,
      dataId,
      secret,
      toleranceSeconds: 300,
    })).not.toThrow();

    expect(() => WebhookSignatureValidator.validate({
      xSignature: `ts=${timestamp},v1=${signature.slice(0, -1)}0`,
      xRequestId: requestId,
      dataId,
      secret,
      toleranceSeconds: 300,
    })).toThrow();
  });
});
