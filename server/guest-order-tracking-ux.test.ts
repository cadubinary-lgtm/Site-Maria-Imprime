import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("acompanhamento público de pedidos", () => {
  it("aplica a identidade rosa nos estados, timeline e prévias", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/GuestOrderTracking.tsx"), "utf8");

    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-pink-600");
    expect(source).toContain("border-pink-200");
    expect(source).not.toContain("bg-orange-500");
    expect(source).not.toContain("text-orange-600");
  });

  it("oferece feedback acessível e ações consistentes para o cliente", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/GuestOrderTracking.tsx"), "utf8");

    expect(source).toContain('role="alert"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-label="Etapas do pedido"');
    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("Não foi possível localizar este pedido");
    expect(source).toContain('href="/catalogo"');
    expect(source).toContain("Confira se você acessou o link mais recente");
  });

  it("permite abrir e fechar prévias de arte por controles acessíveis", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/GuestOrderTracking.tsx"), "utf8");

    expect(source).toContain("type=\"button\"");
    expect(source).toContain("aria-label={`Abrir prévia da arte ${index + 1}`}");
    expect(source).toContain('aria-label="Fechar prévia da arte"');
  });
});
