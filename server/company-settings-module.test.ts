import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Módulo isolado de Dados da Empresa", () => {
  it("mantém a configuração em tabela própria e expõe leitura pública e gravação administrativa", () => {
    const schema = readFileSync("drizzle/schema.ts", "utf8");
    const router = readFileSync("server/companySettingsRouter.ts", "utf8");

    expect(schema).toContain('mysqlTable("companySettings"');
    expect(schema).toContain('nextOsNumber: int("nextOsNumber").notNull().default(1001)');
    expect(router).toContain("getPublic: publicProcedure");
    expect(router).toContain("getAdmin: adminProcedure");
    expect(router).toContain("save: adminProcedure");
    expect(router).toContain("sanitizeOsTerms");
  });

  it("faz o site e a OS consumirem a configuração centralizada", () => {
    const footer = readFileSync("client/src/components/home/Footer.tsx", "utf8");
    const support = readFileSync("client/src/components/home/FAQSupport.tsx", "utf8");
    const product = readFileSync("client/src/pages/ecommerce/ProductDetail.tsx", "utf8");
    const osPrint = readFileSync("client/src/pages/admin/AdminOSPrint.tsx", "utf8");

    expect(footer).toContain("useCompanySettings");
    expect(support).toContain("getWhatsAppUrl(company.whatsappNumber)");
    expect(product).toContain("getWhatsAppUrl(company.whatsappNumber");
    expect(osPrint).toContain("company.printLogoUrl");
    expect(osPrint).toContain("company.osTerms");
  });
});
