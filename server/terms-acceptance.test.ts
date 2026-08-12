import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("aceite global de termos", () => {
  it("mantém um único aceite com leitura em modal reutilizável", () => {
    const source = readFileSync(resolve(root, "client/src/components/TermsAcceptance.tsx"), "utf8");
    expect(source).toContain("Aceito os termos e condições");
    expect(source).toContain("DOCUMENTAÇÃO DA MARIA IMPRIME");
    expect(source).toContain("Termos e Condições de Venda");
  });

  it("exige e registra a versão de termos no pedido", () => {
    const checkout = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    expect(checkout).toContain("termsVersion: z.string().min(1");
    expect(checkout).toContain("termsAcceptedAt: new Date()");
    expect(checkout).toContain("termsDocuments:");
  });
});
