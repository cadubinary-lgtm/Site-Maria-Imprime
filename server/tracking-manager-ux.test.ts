import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/TrackingManager.tsx"), "utf8");

describe("central de rastreamento", () => {
  it("usa a identidade rosa no cabeçalho e preserva o aviso operacional em âmbar", () => {
    expect(source).toContain("bg-pink-50 p-2 text-pink-600");
    expect(source).toContain("border border-amber-200 bg-amber-50");
    expect(source).toContain("text-amber-900");
  });

  it("expõe o aviso de reimplementação como status acessível sem emoji decorativo", () => {
    expect(source).toContain('role="status" aria-live="polite"');
    expect(source).toContain('aria-hidden="true"');
    expect(source).not.toContain("🔄");
  });
});
