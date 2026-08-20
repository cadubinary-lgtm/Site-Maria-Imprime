import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/admin/AdminOSPrint.tsx"),
  "utf8",
);

describe("cabeçalho da Ordem de Serviço", () => {
  it("amplia e aproxima exclusivamente a logo do CNPJ", () => {
    expect(source).toContain('width: "108px", height: "50px"');
    expect(source).toContain('objectPosition: "left bottom"');
    expect(source).toContain('marginTop: "4px", marginBottom: "-4px"');
    expect(source).toContain('CNPJ: 34.528.399/0001-08');
  });
});
