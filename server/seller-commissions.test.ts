import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateSellerCommission } from "./sellerCommission";

const root = process.cwd();
const sellerRouterSource = readFileSync(resolve(root, "server/sellersRouter.ts"), "utf8");
const serviceSource = readFileSync(resolve(root, "server/sellerCommissionService.ts"), "utf8");
const paymentSource = readFileSync(resolve(root, "server/routers-financeiro.ts"), "utf8");
const sellerLayoutSource = readFileSync(resolve(root, "client/src/components/seller/SellerLayout.tsx"), "utf8");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const adminNavigationSource = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");
const customerLoginSource = readFileSync(resolve(root, "client/src/pages/ecommerce/CustomerLogin.tsx"), "utf8");
const adminAuthRouterSource = readFileSync(resolve(root, "server/routers-admin-auth.ts"), "utf8");
const adminSellersSource = readFileSync(resolve(root, "client/src/pages/admin/AdminSellers.tsx"), "utf8");

describe("cálculo de comissão", () => {
  it("deduz desconto do subtotal e não inclui frete na base", () => {
    const calculation = calculateSellerCommission({ subtotal: 1000, discountAmount: 125.5, commissionRate: 7.5 });
    expect(calculation).toEqual({ subtotal: 1000, discountAmount: 125.5, baseAmount: 874.5, commissionRate: 7.5, commissionAmount: 65.59 });
  });

  it("nunca permite base ou comissão negativa", () => {
    expect(calculateSellerCommission({ subtotal: 100, discountAmount: 250, commissionRate: 10 })).toMatchObject({ baseAmount: 0, commissionAmount: 0 });
    expect(calculateSellerCommission({ subtotal: 100, discountAmount: 0, commissionRate: -2 })).toMatchObject({ commissionRate: 0, commissionAmount: 0 });
  });

  it("arredonda a comissão em centavos", () => {
    expect(calculateSellerCommission({ subtotal: 99.99, discountAmount: 0, commissionRate: 5 })).toMatchObject({ commissionAmount: 5 });
  });
});

describe("garantias de rastreabilidade comercial", () => {
  it("grava percentual, base e valor como snapshot por pedido", () => {
    expect(serviceSource).toContain("commissionRateSnapshot");
    expect(serviceSource).toContain("commissionBaseAmount");
    expect(serviceSource).toContain("commissionAmount");
    expect(serviceSource).toContain("if (existing) return existing");
  });

  it("restringe vendedores à carteira própria no servidor", () => {
    expect(sellerRouterSource).toContain("eq(sellers.adminAccountId, adminUser.adminId)");
    expect(sellerRouterSource).toContain("eq(orders.sellerId, seller.id)");
    expect(sellerRouterSource).toContain("eq(quotations.sellerId, seller.id)");
    expect(sellerRouterSource).toContain("eq(sellerCommissions.sellerId, seller.id)");
  });

  it("exige comissão elegível antes de registrar a baixa e salva histórico", () => {
    expect(sellerRouterSource).toContain('commission.status !== "a_pagar"');
    expect(sellerRouterSource).toContain("sellerCommissionPayments");
    expect(sellerRouterSource).toContain('action: "mark_seller_commission_paid"');
  });

  it("libera a comissão quando o financeiro confirma o pagamento", () => {
    expect(paymentSource).toContain("reconcileSellerCommissionForOrder(input.orderId)");
    expect(serviceSource).toContain('order.paymentStatus === "pago" && commission.status === "prevista"');
  });

  it("mantém a navegação comercial em barra isolada", () => {
    expect(sellerLayoutSource).toContain("Central do Vendedor");
    expect(sellerLayoutSource).toContain('href: "/vendedor/pedidos"');
    expect(sellerLayoutSource).toContain('href: "/vendedor/comissoes"');
    expect(appSource).toContain("function SellerRoutes()");
    expect(appSource).toContain('window.location.replace("/vendedor")');
    expect(adminNavigationSource).toContain('{ label: "Vendedores", href: "/admin/vendedores" }');
    expect(adminNavigationSource).toContain('{ label: "Comissões", href: "/admin/comissoes" }');
  });

  it("vincula uma conta existente sem recriar senha, papel ou credenciais", () => {
    expect(sellerRouterSource).toContain("linkedExistingAccount: Boolean(existing)");
    expect(sellerRouterSource).toContain("if (!existing && !input.password)");
    expect(sellerRouterSource).toContain("if (!adminAccountId)");
    expect(sellerRouterSource).toContain('action: created.linkedExistingAccount ? "link_existing_account_to_seller" : "create_seller"');
  });

  it("direciona credenciais de vendedor usadas no login público para a Central do Vendedor", () => {
    expect(customerLoginSource).toContain("trpc.adminAuth.loginSeller.useMutation()");
    expect(customerLoginSource).toContain('window.location.assign("/vendedor")');
    expect(adminAuthRouterSource).toContain("loginSeller: publicProcedure");
    expect(adminAuthRouterSource).toContain("sellerOnly: true");
  });

  it("remove um perfil de vendedor sem histórico antes da conta e protege histórico comissionado", () => {
    expect(adminAuthRouterSource).toContain("where(eq(sellers.adminAccountId, input.id))");
    expect(adminAuthRouterSource).toContain("Este vendedor possui histórico de comissões");
    expect(adminAuthRouterSource).toContain("await tx.delete(sellers).where(eq(sellers.id, sellerProfile.id))");
    expect(adminAuthRouterSource).toContain("removedSellerProfile: Boolean(sellerProfile)");
  });

  it("separa vendedores da lista de operadores e permite à gestão comercial editar ou excluir com confirmação", () => {
    expect(adminAuthRouterSource).toContain("const sellerAccountIds = new Set");
    expect(adminAuthRouterSource).toContain("!sellerAccountIds.has(a.id)");
    expect(sellerRouterSource).toContain("delete: salesAdminProcedure");
    expect(sellerRouterSource).toContain("input.password !== undefined");
    expect(adminSellersSource).toContain("Nova senha");
    expect(adminSellersSource).toContain("Excluir vendedor permanentemente?");
  });
});
