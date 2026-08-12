import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "client/src/pages/admin/ShippingRulesManager.tsx"),
  "utf8",
);

describe("listagem de cotações de frete", () => {
  it("não renderiza a linha secundária quando a descrição da cotação estiver vazia", () => {
    expect(source).toContain("quote.name?.trim() &&");
  });
});
