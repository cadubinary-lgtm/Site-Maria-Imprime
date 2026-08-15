import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("rota do Dashboard de Clientes", () => {
  it("mantém Dashboard de Clientes separado de Todos os Clientes", () => {
    const links = readFileSync("client/src/lib/admin-dashboard-links.ts", "utf8");
    const routes = readFileSync("client/src/App.tsx", "utf8");

    expect(links).toContain('customers: { label: "Dashboard de Clientes", href: "/admin/clientes?view=dashboard" }');
    expect(routes.match(/path="\/admin\/clientes" component=\{ClientsManager\}/g)?.length).toBe(2);
  });
});
