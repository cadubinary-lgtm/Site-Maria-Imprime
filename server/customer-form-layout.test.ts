import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("formulários administrativos de clientes", () => {
  const page = readFileSync("client/src/pages/admin/AdminCustomers.tsx", "utf8");

  it("evita o preenchimento automático de senha ao editar um cliente", () => {
    expect(page).toContain('name="customer-new-password" autoComplete="new-password"');
    expect(page).toContain('name="customer-confirm-new-password" autoComplete="new-password"');
    expect(page).toContain('value={form.newPassword}');
    expect(page).toContain('value={form.confirmPassword}');
  });

  it("mantém a tabela de preços ao lado direito do tipo no novo cadastro", () => {
    const newClientForm = page.slice(page.indexOf("{showPartnerForm && ("));
    expect(newClientForm).toContain('md:col-span-2 md:grid-cols-2');
    expect(newClientForm).toContain('Tipo de cliente *');
    expect(newClientForm).toContain('Tabela de preços');
    expect(newClientForm.indexOf("Tipo de cliente *")).toBeLessThan(newClientForm.indexOf("Tabela de preços"));
    expect(newClientForm).toContain('aria-label="Tabela de preços do novo cliente"');
  });
});
