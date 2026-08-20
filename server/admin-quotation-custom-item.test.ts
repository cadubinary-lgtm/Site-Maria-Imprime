import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/admin/AdminQuotationForm.tsx"),
  "utf8",
);

describe("itens personalizados no orçamento", () => {
  it("abre o formulário de nome ao usar o botão Adicionar novo item", () => {
    expect(source).toContain("const openCustomItemNameStep = () => {");
    expect(source).toContain('setShowAddProduct(true);\n    setShowCustomItemNameStep(true);');
    expect(source).toContain('onClick={openCustomItemNameStep}');
  });

  it("adiciona, expande e confirma visualmente o novo item personalizado", () => {
    expect(source).toContain("const newItemIndex = items.length;");
    expect(source).toContain("next.add(newItemIndex);");
    expect(source).toContain('toast.success(`Item \\"${productName}\\" adicionado ao orçamento.`, { id: "quotation-custom-item-added" });');
  });
});
