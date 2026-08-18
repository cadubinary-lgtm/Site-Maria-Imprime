import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("resumo técnico de itens", () => {
  it("usa chaves estáveis e comunicação clara para as especificações", () => {
    const source = readFileSync(resolve(root, "client/src/components/OrderItemSpecs.tsx"), "utf8");

    expect(source).toContain('key={s.label}');
    expect(source).toContain('aria-label="Especificações do item"');
    expect(source).toContain("Observações");
  });

  it("informa abertura externa da arte e preserva navegação segura", () => {
    const source = readFileSync(resolve(root, "client/src/components/OrderItemSpecs.tsx"), "utf8");

    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain("Abrir arte em nova aba");
    expect(source).toContain("text-pink-600 hover:text-pink-700");
  });
});
