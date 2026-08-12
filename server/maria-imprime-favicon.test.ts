import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("favicon Maria Imprime", () => {
  it("declara os formatos PNG, ICO e Apple Touch no head público", () => {
    const indexHtml = readFileSync("client/index.html", "utf8");

    expect(indexHtml).toContain("maria-imprime-favicon-circular-32_e2b8ae76.png");
    expect(indexHtml).toContain("maria-imprime-favicon-circular_972c347c.ico");
    expect(indexHtml).toContain("maria-imprime-apple-touch-icon-circular_4af6fdb5.png");
  });
});
