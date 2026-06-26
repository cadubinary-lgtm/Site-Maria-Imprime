import { describe, it, expect } from "vitest";

/**
 * Testa a conexão com a API do Mercado Pago usando o Access Token configurado.
 * Este teste valida que as credenciais são válidas e que a API responde corretamente.
 */
describe("Mercado Pago credentials", () => {
  it("should have MERCADO_PAGO_ACCESS_TOKEN defined", () => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should have MERCADO_PAGO_PUBLIC_KEY defined", () => {
    const key = process.env.MERCADO_PAGO_PUBLIC_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should connect to Mercado Pago API with valid token", async () => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      console.warn("MERCADO_PAGO_ACCESS_TOKEN not set, skipping API test");
      return;
    }

    const resp = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 200 = credenciais válidas, 401 = token inválido
    expect(resp.status).not.toBe(401);
    expect(resp.status).toBe(200);

    const data = await resp.json() as { id?: number; email?: string; site_id?: string };
    expect(data.id).toBeDefined();
    expect(data.email).toBeDefined();
    console.log(`✅ Mercado Pago conectado: ${data.email} (site: ${data.site_id})`);
  }, 15000); // timeout de 15s para chamada de rede
});
