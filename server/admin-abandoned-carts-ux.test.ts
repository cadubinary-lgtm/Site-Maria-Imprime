import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminAbandonedCarts.tsx"), "utf8");

describe("recuperação de carrinhos abandonados", () => {
  it("identifica busca, datas e indicadores comerciais", () => {
    expect(source).toContain('htmlFor="abandoned-cart-search"');
    expect(source).toContain('id="abandoned-cart-start-date"');
    expect(source).toContain('id="abandoned-cart-end-date"');
    expect(source).toContain('aria-label="Indicadores de carrinhos abandonados"');
  });

  it("estrutura tabelas e ações de recuperação de forma acessível", () => {
    expect(source).toContain('scope="col"');
    expect(source).toContain('aria-label={`Ver detalhes do carrinho de ${cart.clientName || "cliente"}`}');
    expect(source).toContain('aria-label={`Enviar lembrete por e-mail para ${cart.clientName || "cliente"}`}');
    expect(source).toContain('aria-label={`Preparar lembrete por WhatsApp para ${cart.clientName || "cliente"}`}');
    expect(source).toContain('aria-label={`Excluir carrinho de ${cart.clientName || "cliente"}`}');
  });

  it("protege arquivos externos e informa processos destrutivos ou de contato", () => {
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain('aria-busy={deleteMutation.isPending}');
    expect(source).toContain('aria-busy={emailReminderMutation.isPending}');
    expect(source).toContain('id: "abandoned-carts-cleanup"');
    expect(source).toContain('id: "abandoned-carts-delete"');
    expect(source).toContain('id: "abandoned-carts-email-reminder"');
    expect(source).toContain('position: "top-right", duration: 3500');
  });
});
