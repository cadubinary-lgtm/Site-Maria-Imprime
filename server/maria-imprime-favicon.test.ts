import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("favicon Maria Imprime", () => {
  it("declara os formatos PNG, ICO e Apple Touch no head público", () => {
    const indexHtml = readFileSync("client/index.html", "utf8");

    expect(indexHtml).toContain("maria-imprime-favicon-32_6e12a3a1.png");
    expect(indexHtml).toContain("maria-imprime-favicon_e47063f6.ico");
    expect(indexHtml).toContain("maria-imprime-apple-touch-icon_7c739fad.png");
  });
});
