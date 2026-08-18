import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/CorreiosSettings.tsx"), "utf8");

describe("configurações dos Correios", () => {
  it("usa a identidade rosa nos controles da integração", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 flex-1");
    expect(source).toContain("text-pink-600 hover:text-pink-700");
    expect(source).not.toContain("bg-orange-500");
  });

  it("identifica ações, carregamentos e o vínculo externo", () => {
    expect(source).toContain('aria-label="Carregando configurações dos Correios"');
    expect(source).toContain('aria-label="Obter token no Melhor Envio, abre em nova aba"');
    expect(source).toContain("aria-busy={saveMutation.isPending}");
    expect(source).toContain('aria-label={form.sandbox ? "Desativar modo Sandbox" : "Ativar modo Sandbox"}');
  });

  it("associa os campos do remetente aos seus rótulos", () => {
    expect(source).toContain('htmlFor="sender-name"');
    expect(source).toContain('id="sender-name"');
    expect(source).toContain('htmlFor="sender-state"');
    expect(source).toContain('id="sender-state"');
  });
});
