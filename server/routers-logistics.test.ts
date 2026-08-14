import { describe, expect, it } from "vitest";
import { hasLogisticsAccess } from "./routers-logistics";

describe("autorização de logística", () => {
  it("permite administradores e superadministradores da sessão oficial", () => {
    expect(hasLogisticsAccess("admin")).toBe(true);
    expect(hasLogisticsAccess("superadmin")).toBe(true);
  });

  it("não concede configurações de frete a operadores de produção ou visitantes", () => {
    expect(hasLogisticsAccess("production")).toBe(false);
    expect(hasLogisticsAccess(undefined)).toBe(false);
  });
});
