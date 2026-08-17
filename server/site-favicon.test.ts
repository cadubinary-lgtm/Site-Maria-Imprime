import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("identidade visual do site em buscadores", () => {
  it("expõe um favicon quadrado de 48px e um manifesto com ícones da Maria Imprime", () => {
    const indexHtml = readFileSync(resolve(root, "client/index.html"), "utf8");
    const manifest = readFileSync(resolve(root, "client/public/site.webmanifest"), "utf8");

    expect(indexHtml).toContain('rel="icon" type="image/png" sizes="48x48"');
    expect(indexHtml).toContain("/manus-storage/maria-imprime-favicon-48_643a4b00.png");
    expect(indexHtml).toContain('rel="manifest" href="/site.webmanifest"');
    expect(manifest).toContain('"short_name": "Maria Imprime"');
    expect(manifest).toContain('"sizes": "48x48"');
    expect(manifest).toContain('"sizes": "192x192"');
  });
});
