import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("rota de Orçamentos no painel de produção", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const quotationPageSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/admin/AdminQuotations.tsx"),
    "utf8"
  );
  const productionRoutes = source.slice(
    source.indexOf("function AdminProtectedRoutes()"),
    source.indexOf("function Router()")
  );

  it("registra a listagem de Orçamentos para a autenticação própria do domínio", () => {
    expect(productionRoutes).toContain('<Route path="/admin/orcamentos" component={AdminQuotations} />');
  });

  it("mantém acessíveis os fluxos de criar, editar e visualizar um Orçamento", () => {
    expect(productionRoutes).toContain('<Route path="/admin/orcamentos/novo" component={AdminQuotationForm} />');
    expect(productionRoutes).toContain('<Route path="/admin/orcamentos/:id/editar" component={AdminQuotationForm} />');
    expect(productionRoutes).toContain('<Route path="/admin/orcamentos/:id" component={AdminQuotationDetail} />');
  });

  it("envolve a listagem no layout padrão para disponibilizar a sidebar administrativa", () => {
    expect(quotationPageSource).toContain('import AdminLayout from "@/components/AdminLayout";');
    expect(quotationPageSource).toContain("<AdminLayout>");
    expect(quotationPageSource).toContain("</AdminLayout>");
  });
});
