import { describe, expect, it } from "vitest";
import { resolveInsertedProductId } from "./product-insert-result";

describe("identificador de produto recém-criado", () => {
  it("aceita o insertId direto do adaptador", () => {
    expect(resolveInsertedProductId({ insertId: 42 })).toBe(42);
  });

  it("aceita o ResultSetHeader na primeira posição do retorno MySQL/TiDB", () => {
    expect(resolveInsertedProductId([{ insertId: "43" }, []] as any)).toBe(43);
  });

  it("falha no servidor quando nenhum identificador válido é retornado", () => {
    expect(() => resolveInsertedProductId({ insertId: 0 })).toThrow("identificador válido");
  });
});
