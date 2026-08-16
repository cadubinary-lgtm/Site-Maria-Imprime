import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminProducts.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const productSegmentsRouterSource = readFileSync(resolve(process.cwd(), "server/routers-product-segments.ts"), "utf8");

describe("salvamento de edição de produto", () => {
  it("preserva o segmento real do produto em vez de sobrescrevê-lo", () => {
    expect(source).toContain('segment: product.segment || "geral"');
    expect(source).toContain('segment: editForm.segment || "geral"');
    expect(source).not.toContain('segment: "alimentacao",');
  });

  it("normaliza IDs de segmento e informa o detalhe de uma falha de salvamento", () => {
    expect(source).toContain('segmentIds: Array.from(new Set(editForm.segmentIds)).filter(Number.isFinite)');
    expect(source).toContain('console.error("Erro ao atualizar produto:", error)');
    expect(source).toContain('const detail = error instanceof Error ? error.message : "Não foi possível concluir o salvamento.";');
  });

  it("aceita a sessão administrativa própria do site oficial ao persistir a edição", () => {
    const updateProductBlock = routerSource.slice(
      routerSource.indexOf("updateProduct: adminAnyProcedure"),
      routerSource.indexOf("deleteProduct:", routerSource.indexOf("updateProduct: adminAnyProcedure")),
    );

    expect(updateProductBlock).toContain("updateProduct: adminAnyProcedure");
    expect(updateProductBlock).not.toContain("updateProduct: adminProcedure");
  });

  it("também autoriza a atualização de segmentos concluída após o produto ser salvo", () => {
    expect(productSegmentsRouterSource).toContain('import { adminOrManusAuthProcedure } from "./routers-admin-auth";');
    expect(productSegmentsRouterSource).toContain("const adminAnyProcedure = adminOrManusAuthProcedure;");
    expect(productSegmentsRouterSource).toContain("updateSegments: adminAnyProcedure");
    expect(productSegmentsRouterSource).not.toContain("updateSegments: adminProcedure");
  });
});
