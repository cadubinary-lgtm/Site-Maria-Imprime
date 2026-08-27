import { describe, expect, it } from "vitest";
import { isCarrierLimitRestriction } from "./routers-logistics";

describe("restrições de transportadora", () => {
  it("identifica recusas por peso ou dimensões sem expor a mensagem bruta ao cliente", () => {
    expect(isCarrierLimitRestriction("Peso máximo excedido para este serviço")).toBe(true);
    expect(isCarrierLimitRestriction("Package dimensions exceed the allowed limit")).toBe(true);
    expect(isCarrierLimitRestriction("Serviço indisponível para o CEP informado")).toBe(false);
  });
});
