import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/LogisticsDashboard.tsx"), "utf8");

describe("painel administrativo de logística", () => {
  it("substitui o estado genérico por uma central operacional com contexto real", () => {
    expect(source).toContain("Central de operação");
    expect(source).toContain("Cada área apresenta seus próprios dados e ações disponíveis.");
    expect(source).not.toContain("Módulo de logística reiniciado e pronto para nova integração.");
  });

  it("direciona para todos os módulos logísticos existentes", () => {
    expect(source).toContain('href: "/admin/logistica/transportadoras"');
    expect(source).toContain('href: "/admin/logistica/regras-frete"');
    expect(source).toContain('href: "/admin/logistica/expedicao"');
    expect(source).toContain('href: "/admin/logistica/rastreamento"');
    expect(source).toContain('href="/admin/logistica/configuracoes"');
  });

  it("organiza os atalhos em uma lista e preserva foco visível", () => {
    expect(source).toContain('aria-label="Acessos aos módulos logísticos"');
    expect(source).toContain("focus-visible:ring-pink-300");
    expect(source).toContain("<ul");
  });
});
