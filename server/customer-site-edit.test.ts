import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("edição administrativa de Clientes Site", () => {
  it("mantém um procedimento protegido e um botão Editar na lista", () => {
    const router = readFileSync("server/routers/customerAuth.ts", "utf8");
    const page = readFileSync("client/src/pages/admin/AdminCustomers.tsx", "utf8");

    expect(router).toContain("adminUpdateCustomer: publicProcedure");
    expect(router).toContain("await requireCustomerAdmin(ctx)");
    expect(page).toContain("Editar Cliente");
    expect(page).toContain("adminUpdateCustomer.useMutation");
    expect(page).toContain("Tabela de Preços");
    expect(page).toContain("Dados Pessoais");
    expect(page).toContain("Endereço de Entrega");
  });
});
