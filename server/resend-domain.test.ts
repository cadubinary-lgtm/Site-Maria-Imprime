/**
 * Teste de validação da integração Resend
 * Verifica nova API KEY e remetente profissional
 */
import { describe, it, expect } from "vitest";

describe("Resend Integration", () => {
  it("deve ter RESEND_API_KEY configurada", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key!.length).toBeGreaterThan(10);
  });

  it("deve ter RESEND_FROM_EMAIL configurado com domínio profissional", () => {
    const from = process.env.RESEND_FROM_EMAIL;
    expect(from).toBeDefined();
    expect(from).toContain("graficapontodigital.com.br");
  });

  it("deve ter RESEND_FROM_NAME configurado", () => {
    const name = process.env.RESEND_FROM_NAME;
    expect(name).toBeDefined();
    expect(name).not.toBe("");
  });

  it("deve conseguir instanciar Resend com a nova API KEY", async () => {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    expect(resend).toBeDefined();
    // Verifica que o cliente foi criado sem erros
    expect(typeof resend.emails.send).toBe("function");
  });

  it("deve validar formato do remetente profissional", () => {
    const from = process.env.RESEND_FROM_EMAIL;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(from!)).toBe(true);
    expect(from).toBe("noreply@mail.graficapontodigital.com.br");
  });
});
