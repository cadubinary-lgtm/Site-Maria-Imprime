import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("autorização do cadastro de produtos", () => {
  const source = readFileSync("server/routers.ts", "utf8");

  it("aceita a sessão administrativa do site ao criar produtos", () => {
    expect(source).toContain("createProduct: adminAnyProcedure");
  });

  it("mantém o autosalvamento na mesma autorização compatível", () => {
    expect(source).toContain("updateProduct: adminAnyProcedure");
  });
});
