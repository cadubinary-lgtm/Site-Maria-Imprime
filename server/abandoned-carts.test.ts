import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dbPath = resolve(process.cwd(), "server/db.ts");
const routerPath = resolve(process.cwd(), "server/abandonedCartsRouter.ts");
const schedulePath = resolve(process.cwd(), "server/abandonedCartsSchedule.ts");
const adminPagePath = resolve(process.cwd(), "client/src/pages/admin/AdminAbandonedCarts.tsx");
const ordersPagePath = resolve(process.cwd(), "client/src/pages/admin/AdminOrders.tsx");
const menuPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");

describe("módulo de carrinhos abandonados", () => {
  it("agrupa carrinhos pela última atividade e preserva a regra de 48 horas", () => {
    const source = readFileSync(dbPath, "utf8");

    expect(source).toContain("export async function getAbandonedCartSummaries");
    expect(source).toContain("DATE_ADD(MAX(ci.updatedAt), INTERVAL 48 HOUR)");
    expect(source).toContain("clientName");
    expect(source).toContain("clientEmail");
    expect(source).toContain("emailReminderSentAt");
    expect(source).toContain("whatsappReminderOpenedAt");
    expect(source).toContain("HAVING MAX(updatedAt) < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 48 HOUR)");
    expect(source).toContain("DELETE ci");
  });

  it("restringe a limpeza automática a chamadas autenticadas de tarefas agendadas", () => {
    const source = readFileSync(schedulePath, "utf8");

    expect(source).toContain("if (!user.isCron || !user.taskUid)");
    expect(source).toContain("cleanupExpiredAbandonedCarts()");
  });

  it("mantém consulta e limpeza manual protegidas por autenticação administrativa", () => {
    const source = readFileSync(routerPath, "utf8");

    expect(source).toContain("list: adminProcedure.query");
    expect(source).toContain("details: adminProcedure.input(cartIdentitySchema).query");
    expect(source).toContain("deleteOne: adminProcedure.input(cartIdentitySchema).mutation");
    expect(source).toContain("sendEmailReminder: adminProcedure.input(cartIdentitySchema).mutation");
    expect(source).toContain("markWhatsAppReminderOpened: adminProcedure.input(cartIdentitySchema.safeExtend");
    expect(source).toContain("cleanupExpired: adminProcedure.mutation");
    expect(source).toContain("history: adminProcedure.query");
  });

  it("expõe a página no menu de Vendas e mostra a política de retenção", () => {
    const pageSource = readFileSync(adminPagePath, "utf8");
    const ordersSource = readFileSync(ordersPagePath, "utf8");
    const menuSource = readFileSync(menuPath, "utf8");

    expect(pageSource).toContain("48 horas após a última atividade");
    expect(pageSource).toContain("Limpar expirados");
    expect(ordersSource).toContain('get("view") === "carrinho-abandonado"');
    expect(menuSource).toContain('href: "/admin/pedidos?view=carrinho-abandonado"');
  });

  it("limita exclusão manual a um carrinho identificado e retorna seus itens", () => {
    const source = readFileSync(dbPath, "utf8");
    const pageSource = readFileSync(adminPagePath, "utf8");

    expect(source).toContain("export async function getAbandonedCartDetails");
    expect(source).toContain("export async function deleteAbandonedCart");
    expect(source).toContain("WHERE ci.userId <=> ${identity.userId}");
    expect(source).toContain("WHERE userId <=> ${identity.userId}");
    expect(pageSource).toContain("trpc.abandonedCarts.details.useQuery");
    expect(pageSource).toContain("trpc.abandonedCarts.deleteOne.useMutation");
    expect(pageSource).toContain("trpc.abandonedCarts.sendEmailReminder.useMutation");
    expect(pageSource).toContain("Excluir este carrinho?");
  });

  it("oferece filtros de cliente e período, dados completos e canais de lembrete", () => {
    const pageSource = readFileSync(adminPagePath, "utf8");
    const emailSource = readFileSync(resolve(process.cwd(), "server/emailService.ts"), "utf8");

    expect(pageSource).toContain("Buscar por nome ou e-mail do cliente...");
    expect(pageSource).toContain('type="date"');
    expect(pageSource).toContain("Dados cadastrados do cliente");
    expect(pageSource).toContain("Enviar lembrete por e-mail?");
    expect(pageSource).toContain("https://wa.me/");
    expect(emailSource).toContain("sendAbandonedCartReminderEmail");
  });

  it("registra e informa visualmente o canal de lembrete já acionado", () => {
    const dbSource = readFileSync(dbPath, "utf8");
    const pageSource = readFileSync(adminPagePath, "utf8");

    expect(dbSource).toContain("recordAbandonedCartReminder");
    expect(pageSource).toContain("E-mail enviado");
    expect(pageSource).toContain("WhatsApp preparado");
    expect(pageSource).toContain("Não enviado");
  });

  it("preserva um histórico antes da exclusão definitiva dos carrinhos", () => {
    const dbSource = readFileSync(dbPath, "utf8");
    const pageSource = readFileSync(adminPagePath, "utf8");

    expect(dbSource).toContain("archiveCartRows");
    expect(dbSource).toContain("getDeletedAbandonedCartHistory");
    expect(dbSource).toContain('archiveCartRows(rowsToArchive, "automatic")');
    expect(pageSource).toContain("Histórico de carrinhos excluídos");
  });
});
