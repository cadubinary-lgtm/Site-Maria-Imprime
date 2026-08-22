import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const headerSource = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

describe("acessos administrativos no site público", () => {
  it("não exibe entradas para administração no cabeçalho público", () => {
    expect(headerSource).not.toContain('href="/admin/login"');
    expect(headerSource).not.toContain('<Link href="/admin">');
    expect(headerSource).not.toContain("Painel Admin");
  });

  it("preserva a rota direta de login administrativo", () => {
    expect(appSource).toContain('path="/admin/login"');
  });
});
