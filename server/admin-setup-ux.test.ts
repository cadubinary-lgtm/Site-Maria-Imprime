import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminSetup.tsx"), "utf8");

describe("configuração inicial administrativa", () => {
  it("usa rosa nos destaques e ações iniciais", () => {
    expect(source).toContain("bg-pink-600 rounded-2xl");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("text-pink-600");
  });

  it("associa campos sensíveis aos rótulos e preserva foco rosa", () => {
    expect(source).toContain('htmlFor="setup-name"');
    expect(source).toContain('id="setup-confirm-password"');
    expect(source).toContain('id="setup-key"');
    expect(source).toContain("focus:border-pink-500 focus:ring-pink-500/20");
  });

  it("comunica o processamento do cadastro inicial", () => {
    expect(source).toContain("aria-busy={createMutation.isPending}");
  });
});
