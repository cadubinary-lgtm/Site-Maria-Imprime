import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/CarriersManager.tsx"), "utf8");

describe("gestão de transportadoras", () => {
  it("usa rosa nos controles não semânticos de sincronização", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("text-pink-600");
    expect(source).not.toContain("bg-orange-500");
  });

  it("identifica carregamentos e controles de transportadoras", () => {
    expect(source).toContain('aria-label="Carregando transportadoras"');
    expect(source).toContain('aria-label={`${carrier.isActive ? "Desativar" : "Ativar"} transportadora ${carrier.name}`}');
    expect(source).toContain("aria-busy={syncMutation.isPending}");
  });

  it("preserva a cor semântica de transportadora ativa", () => {
    expect(source).toContain('"bg-green-100 text-green-700"');
  });
});
