import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("acesso flutuante de WhatsApp", () => {
  it("informa abertura em nova aba e protege a navegação externa", () => {
    const source = readFileSync(resolve(root, "client/src/components/layout/FloatingWhatsAppButton.tsx"), "utf8");

    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain('aria-label="Falar com a Maria pelo WhatsApp em nova aba"');
  });

  it("preserva foco visível e evita leitura duplicada do ícone", () => {
    const source = readFileSync(resolve(root, "client/src/components/layout/FloatingWhatsAppButton.tsx"), "utf8");

    expect(source).toContain("focus-visible:ring-pink-300");
    expect(source).toContain('alt="" aria-hidden="true"');
    expect(source).toContain("useWhatsAppButtonVisibility");
  });
});
