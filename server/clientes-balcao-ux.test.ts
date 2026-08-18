import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ClientesBalcao.tsx"), "utf8");

describe("clientes de balcão", () => {
  it("preserva retirada liberada como estado positivo e usa rosa para liberar a opção", () => {
    expect(source).toContain("text-green-700 border-green-200 hover:bg-green-50");
    expect(source).toContain("hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200");
  });

  it("identifica alterações de retirada, bloqueio e tabela de preços por cliente", () => {
    expect(source).toContain('aria-label={`Tabela de preços de ${client.name}`}');
    expect(source).toContain('aria-label={`Liberar retirada em loja para ${client.name}`}');
    expect(source).toContain('aria-label={`${client.isActive ? "Bloquear" : "Desbloquear"} ${client.name}`}');
    expect(source).toContain("aria-busy={toggleBlocked.isPending}");
  });
});
