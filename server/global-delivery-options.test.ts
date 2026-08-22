import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const routerSrc = readFileSync(join(__dirname, "globalDeliveryOptionsRouter.ts"), "utf-8");
const schemaSrc = readFileSync(join(__dirname, "../drizzle/schema.ts"), "utf-8");
const migrationSrc = readFileSync(join(__dirname, "../drizzle/0070_create_global_delivery_options.sql"), "utf-8");
const adminPageSrc = readFileSync(join(__dirname, "../client/src/pages/admin/AdminGlobalDeliveryOptions.tsx"), "utf-8");
const deliveryManagerSrc = readFileSync(join(__dirname, "../client/src/components/products/DeliveryOptionsManager.tsx"), "utf-8");
const adminLayoutSrc = readFileSync(join(__dirname, "../client/src/components/AdminLayout.tsx"), "utf-8");
const appSrc = readFileSync(join(__dirname, "../client/src/App.tsx"), "utf-8");

describe("Biblioteca de Prazos Globais", () => {
  it("schema define a tabela globalDeliveryOptions com campos obrigatórios", () => {
    expect(schemaSrc).toContain("globalDeliveryOptions");
    expect(schemaSrc).toContain("daysToDeliver");
    expect(schemaSrc).toContain("pricePerM2");
    expect(schemaSrc).toContain("isActive");
    expect(schemaSrc).toContain("GlobalDeliveryOption");
  });

  it("migração cria a tabela e insere os 3 prazos padrão", () => {
    expect(migrationSrc).toContain("CREATE TABLE IF NOT EXISTS `globalDeliveryOptions`");
    expect(migrationSrc).toContain("Prazo Normal");
    expect(migrationSrc).toContain("Mesmo Dia");
    expect(migrationSrc).toContain("24 Horas");
  });

  it("router expõe getAll, create, update, remove e reorder", () => {
    expect(routerSrc).toContain("getAll");
    expect(routerSrc).toContain("create");
    expect(routerSrc).toContain("update");
    expect(routerSrc).toContain("remove");
    expect(routerSrc).toContain("reorder");
  });

  it("router usa adminOrManusAuthProcedure para mutações", () => {
    expect(routerSrc).toContain("adminOrManusAuthProcedure");
  });

  it("página admin tem CRUD completo com AlertDialog de confirmação", () => {
    expect(adminPageSrc).toContain("globalDeliveryOptions.getAll");
    expect(adminPageSrc).toContain("globalDeliveryOptions.create");
    expect(adminPageSrc).toContain("globalDeliveryOptions.update");
    expect(adminPageSrc).toContain("globalDeliveryOptions.remove");
    expect(adminPageSrc).toContain("AlertDialog");
    expect(adminPageSrc).toContain("Prazos Padrão");
  });

  it("DeliveryOptionsManager busca prazos globais quando offline sem initialOptions", () => {
    expect(deliveryManagerSrc).toContain("globalDeliveryOptions.getAll");
    expect(deliveryManagerSrc).toContain("isOfflineMode && (!initialOptions || initialOptions.length === 0)");
  });

  it("sidebar tem item Prazos Padrão em Configurações do site", () => {
    expect(adminLayoutSrc).toContain("Prazos Padrão");
    expect(adminLayoutSrc).toContain("/admin/configuracoes-site/prazos-padrao");
  });

  it("App.tsx registra a rota de Prazos Padrão", () => {
    expect(appSrc).toContain("AdminGlobalDeliveryOptions");
    expect(appSrc).toContain("/admin/configuracoes-site/prazos-padrao");
  });
});
