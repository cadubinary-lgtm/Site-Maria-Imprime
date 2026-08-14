import { describe, expect, it } from "vitest";
import { ADMIN_DASHBOARD_LINKS } from "../client/src/lib/admin-dashboard-links";

describe("atalhos de dashboard administrativo", () => {
  it("mantém destinos funcionais para os quatro grupos principais", () => {
    expect(ADMIN_DASHBOARD_LINKS.sales.href).toBe("/admin");
    expect(ADMIN_DASHBOARD_LINKS.production.href).toBe("/producao");
    expect(ADMIN_DASHBOARD_LINKS.products.href).toBe("/admin/produtos");
    expect(ADMIN_DASHBOARD_LINKS.customers.href).toBe("/admin/clientes");
  });
});
