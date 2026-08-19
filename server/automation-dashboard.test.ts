import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pagePath = resolve(process.cwd(), "client/src/pages/erp/AutomationDashboard.tsx");
const routerPath = resolve(process.cwd(), "server/routers-automation.ts");
const dataPath = resolve(process.cwd(), "server/db-automation.ts");

describe("central administrativa de automações", () => {
  it("expõe uma consulta administrativa consolidada", () => {
    const router = readFileSync(routerPath, "utf8");
    const data = readFileSync(dataPath, "utf8");

    expect(router).toContain("getDashboard: adminProcedure.query");
    expect(data).toContain("getAutomationDashboard");
    expect(data).toContain("paymentReceipts");
    expect(data).toContain("emailHistory");
    expect(data).toContain("abandonedCartReminders");
  });

  it("apresenta gatilho, status, última execução e resultado para cada rotina", () => {
    const page = readFileSync(pagePath, "utf8");

    expect(page).toContain("trpc.automation.getDashboard.useQuery");
    expect(page).toContain("Gatilho");
    expect(page).toContain("Última execução");
    expect(page).toContain("Resultado mais recente");
    expect(page).toContain("Automação</th>");
  });

  it("mantém transparência entre envio concluído, preparado e rotinas sem histórico", () => {
    const page = readFileSync(pagePath, "utf8");
    const data = readFileSync(dataPath, "utf8");

    expect(page).toContain("Uma ação preparada não é exibida como enviada");
    expect(data).toContain("não representa envio confirmado");
    expect(data).toContain("ainda não possui execução persistida");
  });

  it("mantém filtros acessíveis e atualização manual dos dados", () => {
    const page = readFileSync(pagePath, "utf8");

    expect(page).toContain("aria-pressed={selectedCategory === category}");
    expect(page).toContain("aria-label=\"Atualizar dados da central de automações\"");
    expect(page).toContain("refetch()");
  });
});
