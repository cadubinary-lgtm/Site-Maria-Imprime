import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("normalização de imagens em itens de Orçamento", () => {
  const formSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/admin/AdminQuotationForm.tsx"),
    "utf8"
  );

  it("converte imagens nulas do banco em undefined ao abrir um orçamento", () => {
    expect(formSource).toContain("productImage: i.productImage ?? undefined");
    expect(formSource).toContain("artFileUrl: i.artFileUrl ?? undefined");
  });

  it("não envia null para os campos opcionais de imagem no payload de atualização", () => {
    expect(formSource).toContain("artFileKey: i.artFileKey ?? undefined");
    expect(formSource).not.toContain("productImage: i.productImage,\n      specifications");
  });
});
