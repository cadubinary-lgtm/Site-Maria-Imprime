import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("seção pública como funciona", () => {
  it("organiza as etapas como listas acessíveis e evita narração repetida de ilustrações", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/HowItWorks.tsx"), "utf8");

    expect(source).toContain('aria-labelledby="how-it-works-title"');
    expect(source).toContain('aria-label="Etapas do seu pedido"');
    expect(source).toContain('role="listitem"');
    expect(source).toContain('aria-hidden="true"');
  });

  it("preserva a continuidade para o catálogo sem aninhar controles interativos", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/HowItWorks.tsx"), "utf8");

    expect(source).toContain('<Link href="/catalogo" className={`${HOME_PRIMARY_ACTION_CLASS} px-7 sm:px-8`}>');
    expect(source).not.toContain('<Link href="/catalogo">\n            <button');
    expect(source).toContain("motion-reduce:transform-none");
  });
});
