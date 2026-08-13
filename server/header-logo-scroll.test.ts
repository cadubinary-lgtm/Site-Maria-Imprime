import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appPath = resolve(process.cwd(), "client/src/App.tsx");
const headerPath = resolve(process.cwd(), "client/src/components/layout/Header.tsx");

describe("rolagem ao clicar na logo", () => {
  it("direciona a Home para o contêiner público que realmente possui rolagem", () => {
    const appSource = readFileSync(appPath, "utf8");
    const headerSource = readFileSync(headerPath, "utf8");

    expect(appSource).toContain('id="public-site-scroll-container"');
    expect(headerSource).toContain('document.getElementById("public-site-scroll-container")');
    expect(headerSource).toContain('publicScrollContainer?.scrollTo({ top: 0, left: 0, behavior: "smooth" })');
  });

  it("preserva a navegação à Home ao clicar na logo fora da página inicial", () => {
    const headerSource = readFileSync(headerPath, "utf8");

    expect(headerSource).toContain('if (window.location.pathname === "/")');
    expect(headerSource).toContain('navigate("/")');
  });
});
