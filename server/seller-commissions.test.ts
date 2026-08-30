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
const sellerOrdersSource = readFileSync(resolve(root, "client/src/pages/seller/SellerOrders.tsx"), "utf8");
const checkoutRouterSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const checkoutPageSource = readFileSync(resolve(root, "client/src/pages/ecommerce/CheckoutPage.tsx"), "utf8");
const quotationsRouterSource = readFileSync(resolve(root, "server/quotationsRouter.ts"), "utf8");
const quotationFormSource = readFileSync(resolve(root, "client/src/pages/admin/AdminQuotationForm.tsx"), "utf8");
const sellerQuotationFormSource = readFileSync(resolve(root, "client/src/pages/seller/SellerQuotationForm.tsx"), "utf8");
const sellerQuotationsSource = readFileSync(resolve(root, "client/src/pages/seller/SellerQuotations.tsx"), "utf8");
const sellerOrderDetailSource = readFileSync(resolve(root, "client/src/pages/seller/SellerOrderDetail.tsx"), "utf8");
const adminOrderDetailSource = readFileSync(resolve(root, "client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");
const headerSource = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");
const cookieConsentBannerSource = readFileSync(resolve(root, "client/src/components/CookieConsentBanner.tsx"), "utf8");
const orderSummarySource = readFileSync(resolve(root, "client/src/components/orders/OrderSummary.tsx"), "utf8");
const productDetailSource = readFileSync(resolve(root, "client/src/pages/ecommerce/ProductDetail.tsx"), "utf8");
const orderShippingPanelSource = readFileSync(resolve(root, "client/src/components/orders/OrderShippingPanel.tsx"), "utf8");

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
    expect(sellerLayoutSource).toContain('href: "/vendedor/pedidos"');
    expect(appSource).toContain("function SellerRoutes()");
    expect(appSource).toContain('<Route path="/vendedor/comissoes" component={SellerOrders} />');
    expect(appSource).toContain('window.location.replace("/vendedor")');
    expect(adminNavigationSource).toContain('{ label: "Vendedores", href: "/admin/vendedores" }');
    expect(adminNavigationSource).toContain('{ label: "Comissões", href: "/admin/comissoes" }');
  });

  it("vincula uma conta existente sem recriar senha e a converte para o acesso comercial", () => {
    expect(sellerRouterSource).toContain("linkedExistingAccount: Boolean(existing)");
    expect(sellerRouterSource).toContain("if (!existing && !input.password)");
    expect(sellerRouterSource).toContain("if (!adminAccountId)");
    expect(sellerRouterSource).toContain('role: "seller"');
    expect(sellerRouterSource).toContain('action: created.linkedExistingAccount ? "link_existing_account_to_seller" : "create_seller"');
  });

  it("mantém vendedor autenticado no site público após o login comercial", () => {
    expect(customerLoginSource).toContain("trpc.adminAuth.loginSeller.useMutation()");
    expect(customerLoginSource).toContain('window.location.assign("/")');
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

  it("limpa o formulário antes de cada novo cadastro de vendedor", () => {
    expect(adminSellersSource).toContain("const handleCreateOpenChange = (open: boolean) => {");
    expect(adminSellersSource).toContain("if (open) setForm(blank);");
    expect(adminSellersSource).toContain("onOpenChange={handleCreateOpenChange}");
  });

  it("mantém o escopo do vendedor e retorna cliente e comissão da própria venda", () => {
    expect(sellerRouterSource).toContain("eq(orders.sellerId, seller.id)");
    expect(sellerRouterSource).toContain("COALESCE(${clients.name}, ${orders.guestName}, ${orders.deliveryFullName}, 'Cliente')");
    expect(sellerRouterSource).toContain("commissionAmount: sellerCommissions.commissionAmount");
  });

  it("concentra as vendas e as comissões do vendedor em uma única carteira", () => {
    expect(sellerOrdersSource).toContain("Meus Pedidos / Minhas Vendas");
    expect(sellerOrdersSource).toContain("Comissões a receber");
    expect(sellerOrdersSource).toContain("Comissões recebidas");
    expect(sellerOrdersSource).toContain("commissionAmount");
  });

  it("alinha verticalmente os dados da linha de pedido comercial", () => {
    const orderRow = sellerOrdersSource.slice(sellerOrdersSource.indexOf("<tr key={order.id}"), sellerOrdersSource.indexOf("</tr>", sellerOrdersSource.indexOf("<tr key={order.id}")));
    expect(orderRow).toContain('className="align-middle p-4 font-medium"');
    expect((orderRow.match(/align-middle p-4/g) ?? []).length).toBe(7);
  });

  it("filtra pedidos comerciais por status e período sem sair da própria carteira", () => {
    expect(sellerRouterSource).toContain("const sellerOrderFilters = dateFilters.extend");
    expect(sellerRouterSource).toContain("orders: sellerProcedure.input(sellerOrderFilters)");
    expect(sellerRouterSource).toContain("eq(orders.sellerId, seller.id)");
    expect(sellerRouterSource).toContain("if (input.status) conditions.push(eq(orders.status, input.status as any))");
    expect(sellerOrdersSource).toContain("Filtrar pedidos");
    expect(sellerOrdersSource).toContain("Todos os status");
    expect(sellerOrdersSource).toContain("Todo período");
    expect(sellerOrdersSource).toContain("Personalizado");
    expect(sellerOrdersSource).toContain("Limpar filtros");
  });

  it("pesquisa pedidos comerciais por número ou cliente sem ampliar a carteira", () => {
    expect(sellerRouterSource).toContain("search: z.string().trim().max(160).optional()");
    expect(sellerRouterSource).toContain("like(orders.orderNumber, `%${input.search}%`)");
    expect(sellerRouterSource).toContain("like(clients.name, `%${input.search}%`)");
    expect(sellerRouterSource).toContain("like(orders.guestName, `%${input.search}%`)");
    expect(sellerRouterSource).toContain("eq(orders.sellerId, seller.id)");
    expect(sellerOrdersSource).toContain("Buscar por número do pedido ou cliente...");
    expect(sellerOrdersSource).toContain("search: search || undefined");
  });

  it("organiza logística no mesmo padrão compacto do resumo financeiro sem perder dados de entrega", () => {
    expect(orderShippingPanelSource).toContain('rounded-xl border border-gray-200 bg-gray-50');
    expect(orderShippingPanelSource).toContain("Método de entrega");
    expect(orderShippingPanelSource).toContain("Frete");
    expect(orderShippingPanelSource).toContain("Endereço de entrega");
    expect(orderShippingPanelSource).toContain("Local de retirada");
    expect(orderShippingPanelSource).toContain("shippingEstimatedDays");
    expect(orderShippingPanelSource).toContain("deliveryZipCode");
    expect(orderShippingPanelSource).toContain("deliveryStreet");
  });

  it("vincula a sessão de vendedor ao pedido público sem aceitar identificação vinda do navegador", () => {
    expect(checkoutRouterSource).toContain("async function getCheckoutSeller");
    expect(checkoutRouterSource).toContain("const checkoutSeller = await getCheckoutSeller(req)");
    expect(checkoutRouterSource).toContain("sellerId: checkoutSeller?.id ?? null");
    expect(checkoutRouterSource).toContain("sellerName: checkoutSeller?.name ?? null");
    expect(checkoutRouterSource).toContain('ensureSellerCommissionForOrder(commissionDb, orderId, { source: "seller_order" })');
    expect(checkoutRouterSource).toContain('`seller_${cartSeller.id}`');
    expect(checkoutRouterSource).toContain('`seller_${checkoutSeller.id}`');
  });

  it("exige nome e e-mail do cliente quando o checkout está em modo vendedor", () => {
    expect(checkoutPageSource).toContain("const isSellerCheckout = adminUser?.role === \"seller\"");
    expect(checkoutPageSource).toContain('"Nome do Cliente"');
    expect(checkoutPageSource).toContain('"E-mail do Cliente"');
    expect(checkoutPageSource).toContain("O cliente receberá a confirmação e as atualizações do pedido neste e-mail.");
  });

  it("reserva a carteira global e o cadastro de vendedores ao Superadmin", () => {
    expect(sellerRouterSource).toContain('if (role !== "superadmin")');
    expect(adminNavigationSource).toContain('user?.role === "superadmin"');
    expect(adminSellersSource).toContain('adminUser?.role === "superadmin"');
  });

  it("autoriza pagamento na retirada individualmente e bloqueia tentativas sem liberação", () => {
    expect(sellerRouterSource).toContain("allowStorePickupPayment: z.boolean().optional().default(false)");
    expect(checkoutRouterSource).toContain('input.paymentMethod === "pagar_na_retirada" && !checkoutSeller.allowStorePickupPayment');
    expect(checkoutPageSource).toContain("const canUsePickupPayment = isSellerCheckout");
    expect(checkoutPageSource).toContain("{canUsePickupPayment && (");
    expect(adminSellersSource).toContain("Liberar retirada");
    expect(adminSellersSource).toContain("Pagamento na retirada");
  });

  it("reutiliza o formulário profissional de orçamentos na central do vendedor", () => {
    expect(sellerQuotationFormSource).toContain("<AdminQuotationForm />");
    expect(sellerQuotationFormSource).toContain("<SellerLayout");
    expect(appSource).toContain('path="/vendedor/orcamentos/novo" component={SellerQuotationForm}');
    expect(quotationFormSource).toContain('window.location.pathname.startsWith("/vendedor/")');
    expect(quotationFormSource).toContain("Vendedor responsável");
    expect(quotationFormSource).toContain("disabled={isSellerMode}");
  });

  it("vincula autoria e impede acesso de vendedor a orçamento de outra carteira", () => {
    expect(quotationsRouterSource).toContain("getSellerQuotationScope");
    expect(quotationsRouterSource).toContain("sellerId: seller?.id");
    expect(quotationsRouterSource).toContain('"Você só pode acessar seus próprios orçamentos."');
    expect(quotationsRouterSource).toContain('"Você só pode editar seus próprios orçamentos."');
    expect(quotationsRouterSource).toContain('"Você só pode converter seus próprios orçamentos."');
    expect(quotationsRouterSource).toContain("responsibleName: seller?.name ?? input.responsibleName");
  });

  it("mantém a rolagem e todos os perfis de cliente no orçamento comercial", () => {
    expect(quotationFormSource).toContain('"h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain');
    expect(quotationFormSource).toContain('value: "revendedor", label: "Revendedor"');
    expect(quotationFormSource).toContain('value: "agencia", label: "Agência"');
    expect(quotationFormSource).toContain('c.clientType === "revendedor" ? "Revendedor"');
    expect(quotationFormSource).toContain('c.clientType === "agencia" ? "Agência"');
    expect(quotationsRouterSource).toContain("WHEN 'reseller' THEN 'revendedor'");
    expect(quotationsRouterSource).toContain("WHEN 'agency' THEN 'agencia'");
  });

  it("oferece retorno à loja preservando a sessão comercial do vendedor", () => {
    expect(sellerLayoutSource).toContain('href="/"');
    expect(sellerLayoutSource).toContain("Voltar para a loja");
    expect(sellerLayoutSource).toContain("Ir para a loja");
  });

  it("expõe detalhes e históricos somente pelas consultas com escopo da carteira", () => {
    expect(sellerRouterSource).toContain("orderDetail: sellerProcedure");
    expect(sellerRouterSource).toContain("orderHistory: sellerProcedure");
    expect(sellerRouterSource).toContain("productionHistory: sellerProcedure");
    expect(sellerRouterSource).toContain("and(eq(orders.id, input.id), eq(orders.sellerId, seller.id))");
    expect(sellerRouterSource).toContain("and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))");
    expect(appSource).toContain('path="/vendedor/pedidos/:id" component={SellerOrderDetail}');
    expect(sellerOrderDetailSource).toContain("sellerMode");
    expect(adminOrderDetailSource).toContain("trpc.sellers.seller.orderDetail.useQuery");
    expect(adminOrderDetailSource).toContain("trpc.sellers.seller.orderHistory.useQuery");
    expect(adminOrderDetailSource).toContain("trpc.sellers.seller.productionHistory.useQuery");
  });

  it("preserva no vendedor o acompanhamento em leitura e bloqueia operações no cliente e no servidor", () => {
    expect(adminOrderDetailSource).toContain("!sellerMode && <div className=\"flex items-center gap-2\">");
    expect(adminOrderDetailSource).toContain("!sellerMode && <div className=\"border-t pt-4 space-y-3\">");
    expect(adminOrderDetailSource).toContain("!sellerMode && (o.status === \"com_problemas\"");
    expect(adminOrderDetailSource).toContain("!sellerMode && o.paymentStatus !== \"pago\"");
    expect(checkoutRouterSource).toContain("function requireOrderOperationalAccess");
    expect(checkoutRouterSource).toContain("requireOrderOperationalAccess(ctx);");
    expect(checkoutRouterSource).toContain("getOrderById: adminAnyProcedure");
    expect(paymentSource).toContain('ctx as any).adminUser?.role === "seller"');
  });

  it("protege cada ação comercial de orçamento pela carteira autenticada", () => {
    expect(quotationsRouterSource).toContain("getQuotationForCommercialAction");
    expect(quotationsRouterSource).toContain("Você só pode operar orçamentos da sua própria carteira.");
    expect(quotationsRouterSource).toContain("const { quotation: existing } = await getQuotationForCommercialAction");
    expect(quotationsRouterSource).toContain("await getQuotationForCommercialAction(db, ctx, input.id);");
    expect(quotationsRouterSource).toContain("const { quotation: original } = await getQuotationForCommercialAction");
  });

  it("entrega ao vendedor a mesma visão operacional de orçamento sem expor lixeira administrativa", () => {
    expect(sellerRouterSource).toContain("sellerQuotationFilters");
    expect(sellerRouterSource).toContain("expiresAt: quotations.expiresAt");
    expect(sellerRouterSource).toContain("clientEmail: clients.email");
    expect(sellerRouterSource).toContain("return { rows, kpis, total: kpis.totalAtivos }");
    expect(sellerQuotationsSource).toContain('"Data", "Validade", "Valor", "Status", "Próximo procedimento", "Ações"');
    expect(sellerQuotationsSource).toContain("Acompanhamento operacional");
    expect(sellerQuotationsSource).toContain("getQuotationProcedure(quote.status, quote.convertedOrderId)");
    expect(sellerQuotationsSource).toContain("Duplicar");
    expect(sellerQuotationsSource).toContain("Marcar aprovado");
    expect(sellerQuotationsSource).toContain("Confirmar conversão");
    expect(sellerQuotationsSource).not.toContain("Mover para lixeira");
  });

  it("impede remoção de orçamento por vendedor mesmo em uma chamada direta", () => {
    expect(quotationsRouterSource).toContain("Vendedores não podem excluir orçamentos");
  });
  it("mantém a estrutura do cabeçalho e remove o atalho de cookies após a decisão", () => {
    expect(headerSource).toContain('className="md:hidden flex items-center justify-between px-4"');
    expect(headerSource).toContain('className="flex items-center self-center cursor-pointer"');
    expect(cookieConsentBannerSource).toContain("!hasDecided");
    expect(cookieConsentBannerSource).not.toContain("Preferências de cookies</button>");
  });
  it("mantém o resumo do pedido fechado por padrão e permite expandi-lo manualmente", () => {
    expect(orderSummarySource).toContain("const [isExpanded, setIsExpanded] = React.useState(false);");
    expect(orderSummarySource).toContain("aria-expanded={isExpanded}");
    expect(orderSummarySource).toContain("{isExpanded && <CardContent");
    expect(orderSummarySource).toContain("onQuantityChange");
    expect(orderSummarySource).toContain("onAddToCart");
  });
  it("recolhe somente os dados superiores no resumo efetivamente exibido no configurador", () => {
    expect(productDetailSource).toContain("const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);");
    expect(productDetailSource).toContain('id="product-order-summary-content"');
    expect(productDetailSource).toContain("Previsão de Entrega");
    expect(productDetailSource).toContain("{/* Quantidade */}");
    expect(productDetailSource).toContain("{/* Totais */}");
    expect(productDetailSource.indexOf("</div>}", productDetailSource.indexOf("Previsão de Entrega"))).toBeLessThan(productDetailSource.indexOf("{/* Quantidade */}"));
  });
});
