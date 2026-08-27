import { describe, expect, it } from "vitest";
import { getPixExpirationState } from "../shared/pix-expiration";

describe("expiração de Pix", () => {
  const now = Date.UTC(2026, 7, 27, 12, 0, 0);

  it("mostra o cronômetro para um Pix ainda válido", () => {
    const result = getPixExpirationState(String(now + (5 * 60 + 9) * 1000), now);
    expect(result).toMatchObject({ expired: false, label: "Expira em 5min 09s" });
  });

  it("identifica Pix expirado e impede o reenvio na interface", () => {
    const result = getPixExpirationState(String(now - 1), now);
    expect(result).toMatchObject({ expired: true, label: "Pix expirado" });
  });

  it("aceita a validade ISO enviada pelo provedor de pagamento", () => {
    const result = getPixExpirationState("2026-08-27T14:00:00.000Z", now);
    expect(result.expired).toBe(false);
    expect(result.label).toBe("Expira em 2h 0min");
  });

  it("trata validade ausente sem inventar um prazo", () => {
    expect(getPixExpirationState(null, now)).toMatchObject({ expired: false, label: "Validade não informada", expiresAtMs: null });
  });
});
