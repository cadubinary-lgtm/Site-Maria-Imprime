import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("rolagem de páginas públicas", () => {
  it("restaura o topo em toda mudança de rota pública", () => {
    const app = read("client/src/App.tsx");

    expect(app).toContain('document.getElementById("public-site-scroll-container")?.scrollTo({ top: 0, left: 0, behavior: "auto" })');
    expect(app).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" })');
    expect(app).toContain("window.requestAnimationFrame(resetPublicScroll)");
    expect(app).toContain("}, [isAdminRoute, location]);");
  });

  it("cobre os destinos públicos oferecidos pelo rodapé", () => {
    const footer = read("client/src/components/home/Footer.tsx");

    expect(footer).toContain('href: documentationPath("termos-venda")');
    expect(footer).toContain('href: documentationPath("privacidade-lgpd")');
    expect(footer).toContain('href: documentationPath("trocas-reembolsos")');
    expect(footer).toContain('href="/contato"');
    expect(footer).toContain('href="/catalogo"');
  });
});
