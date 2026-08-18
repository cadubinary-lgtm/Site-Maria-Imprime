import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("página pública de rota indisponível", () => {
  it("apresenta mensagem em português e ações claras de continuidade", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/NotFound.tsx"), "utf8");

    expect(source).toContain("Página não encontrada");
    expect(source).toContain("Voltar ao início");
    expect(source).toContain("Explorar catálogo");
    expect(source).toContain('setLocation("/catalogo")');
  });

  it("segue a identidade rosa e expõe semântica acessível de erro", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/NotFound.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("from-pink-50");
    expect(source).toContain('aria-labelledby="not-found-title"');
    expect(source).toContain('role="alert"');
  });
});
