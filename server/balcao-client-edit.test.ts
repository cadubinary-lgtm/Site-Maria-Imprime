import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("edição de Clientes Balcão", () => {
  it("usa o mesmo padrão de edição comercial e endereço dos Clientes Site", () => {
    const router = readFileSync("server/routers-crm.ts", "utf8");
    const page = readFileSync("client/src/pages/admin/ClientesBalcao.tsx", "utf8");
    expect(router).toContain("adminUpdateBalcaoClient");
    expect(router).toContain("priceTier: z.enum");
    expect(page).toContain("Editar Cliente Balcão");
    expect(page).toContain("Tabela de Preços");
    expect(page).toContain("Endereço de Entrega");
  });
});
