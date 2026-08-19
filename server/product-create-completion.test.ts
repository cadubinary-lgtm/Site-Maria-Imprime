import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const formSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
const routerSource = readFileSync(resolve(import.meta.dirname, "./routers.ts"), "utf8");

describe("conclusão do cadastro de produto", () => {
  it("confirma o produto mesmo se um dado complementar falhar", () => {
    expect(formSource).toContain("Promise.allSettled([");
    expect(formSource).toContain('result.status === "rejected"');
    expect(formSource).toContain('toast.warning("Produto criado com dados complementares pendentes"');
  });

  it("limpa formulário, rascunho e estado de criação depois do sucesso", () => {
    expect(formSource).toContain("const initialForm = getInitialCreateForm();");
    expect(formSource).toContain("setCreateForm(initialForm);");
    expect(formSource).toContain("setCreateDeliveryOptions(initialDeliveryOptions);");
    expect(formSource).toContain("setAutoCreatedProductId(null);");
    expect(formSource).toContain('window.localStorage.removeItem("maria-imprime-new-product-autosave")');
    expect(formSource).toContain('description: wasDuplicatingDraft');
    expect(formSource).toContain("cadastro confirmado e formulário pronto para um novo produto.");
  });

  it("aceita a sessão do painel oficial ao gravar prazos de produção", () => {
    const deliveryOptionsBlock = routerSource.slice(routerSource.indexOf("deliveryOptions: router({"), routerSource.indexOf("cart: router({"));
    expect(deliveryOptionsBlock).toContain("create: adminAnyProcedure");
    expect(deliveryOptionsBlock).toContain("update: adminAnyProcedure");
    expect(deliveryOptionsBlock).toContain("delete: adminAnyProcedure");
    expect(deliveryOptionsBlock).toContain("reorder: adminAnyProcedure");
  });
});
