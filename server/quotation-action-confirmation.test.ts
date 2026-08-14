import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminQuotations.tsx");

describe("confirmações de ações de orçamento", () => {
  it("pede confirmação antes de cancelar ou restaurar o status", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain('type: "cancel" | "restore"');
    expect(source).toContain("Cancelar orçamento?");
    expect(source).toContain("Restaurar status anterior?");
    expect(source).toContain("Confirmar cancelamento");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain('setStatusActionQuotation({ type: "cancel", quotation: row })');
    expect(source).toContain('setStatusActionQuotation({ type: "restore", quotation: row })');
  });

  it("mantém confirmação com motivo para mover o orçamento à lixeira", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("Mover orçamento para a lixeira?");
    expect(source).toContain("Motivo da exclusão (obrigatório)");
    expect(source).toContain("Mover para lixeira");
  });
});
