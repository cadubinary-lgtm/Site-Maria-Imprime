import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import Header from "@/components/layout/Header";
import { FloatingWhatsAppButton } from "@/components/layout/FloatingWhatsAppButton";
import { CartSidePanel } from "./components/CartSidePanel";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useCartDrawer } from "./contexts/CartDrawerContext";

// ─── Páginas Públicas ────────────────────────────────────────────────────────
import Home from "./pages/public/Home";
import NotFound from "./pages/public/NotFound";
import SignupPage from "./pages/public/SignupPage";
import Catalog from "./pages/public/Catalog";
import AllProducts from "./pages/public/AllProducts";
import SearchResults from "./pages/public/SearchResults";
import CalculadoraDemo from "./pages/public/CalculadoraDemo";
import DocumentationPage from "./pages/public/DocumentationPage";
import ContactPage from "./pages/public/ContactPage";
import PrintTemplatesPage from "./pages/public/PrintTemplatesPage";

// ─── Páginas de E-commerce ───────────────────────────────────────────────────
import ProductDetail from "./pages/ecommerce/ProductDetail";
import CartPage from "./pages/ecommerce/CartPage";
import CheckoutPage from "./pages/ecommerce/CheckoutPage";
import OrderConfirmation from "./pages/ecommerce/OrderConfirmation";
import GuestOrderTracking from "./pages/ecommerce/GuestOrderTracking";
import CustomerRegister from "./pages/ecommerce/CustomerRegister";
import CustomerLogin from "./pages/ecommerce/CustomerLogin";
import SellerQuotationForm from "./pages/seller/SellerQuotationForm";
import VerifyEmail from "./pages/ecommerce/VerifyEmail";
import ForgotPassword from "./pages/ecommerce/ForgotPassword";
import ResetPassword from "./pages/ecommerce/ResetPassword";
import ResendVerification from "./pages/ecommerce/ResendVerification";

// ─── Páginas do Cliente ──────────────────────────────────────────────────────
import MyAccountPage from "./pages/cliente/MyAccountPage";
import MyOrdersPage from "./pages/cliente/MyOrdersPage";
import OrderDetailPage from "./pages/cliente/OrderDetailPage";
import OrderTracking from "./pages/cliente/OrderTracking";

// ─── Páginas Administrativas ─────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminHomeCarousel from "./pages/admin/AdminHomeCarousel";
import AdminProductsDashboard from "./pages/admin/AdminProductsDashboard";
import AdminNewProduct from "./pages/admin/AdminNewProduct";
import AdminVariations from "./pages/admin/AdminVariations";
import AdminVariationsOffset from "./pages/admin/AdminVariationsOffset";
import AdminVariationsCv from "./pages/admin/AdminVariationsCv";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminAttributesManager from "./pages/admin/AdminAttributesManager";
import AdminProductAttributesLinker from "./pages/admin/AdminProductAttributesLinker";
import AdminRulesBuilder from "./pages/admin/AdminRulesBuilder";
import AdminRulesManager from "./pages/admin/AdminRulesManager";
import AdminOrders from "./pages/admin/AdminOrders";
import NewOrders from "./pages/admin/NewOrders";
import AdminKanban from "./pages/admin/AdminKanban";
import AdminProductionKanban from "./pages/admin/AdminProductionKanban";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminOS from "./pages/admin/AdminOS";
import AdminOSPrint from "./pages/admin/AdminOSPrint";
import AdminCompanySettings from "./pages/admin/AdminCompanySettings";
import AdminFooterInformation from "./pages/admin/AdminFooterInformation";
import AdminArtworkGuidelines from "./pages/admin/AdminArtworkGuidelines";
import AdminMariaGuide from "./pages/admin/AdminMariaGuide";
import AdminPrintTemplates from "./pages/admin/AdminPrintTemplates";
import AdminGlobalDeliveryOptions from "./pages/admin/AdminGlobalDeliveryOptions";
import AdminPreImpressao from "./pages/admin/AdminPreImpressao";
import AdminStatusProducao from "./pages/admin/AdminStatusProducao";
import ClientsManager from "./pages/admin/ClientsManager";
import AdminCustomers from "./pages/admin/AdminCustomers";
import ClientesBalcao from "./pages/admin/ClientesBalcao";
import ClientesSite from "./pages/admin/ClientesSite";
import FileValidationManager from "./pages/admin/FileValidationManager";
import { LogisticsDashboard } from "./pages/admin/LogisticsDashboard";
import { CarriersManager } from "./pages/admin/CarriersManager";
import { ShippingRulesManager } from "./pages/admin/ShippingRulesManager";
import CorreiosSettings from "./pages/admin/CorreiosSettings";
import MercadoPagoSettings from "./pages/admin/MercadoPagoSettings";
import { ShipmentsManager } from "./pages/admin/ShipmentsManager";
import { TrackingManager } from "./pages/admin/TrackingManager";

// ─── Gerenciador Financeiro (legado - mantido) ───────────────────────────────
import GerenciadorFinanceiroDashboard from "./pages/admin/GerenciadorFinanceiroDashboard";
import ContasReceber from "./pages/admin/ContasReceber";
import ContasRecebidas from "./pages/admin/ContasRecebidas";
import PagamentosRetirada from "./pages/admin/PagamentosRetirada";
import FluxoCaixa from "./pages/admin/FluxoCaixa";
import RelatoriosFinanceiros from "./pages/admin/RelatoriosFinanceiros";

// ─── Gerenciador Financeiro NOVO (router financeiro) ─────────────────────────
import FinanceiroDashboard from "./pages/admin/FinanceiroDashboard";
import FinanceiroContasReceber from "./pages/admin/FinanceiroContasReceber";
import FinanceiroContasRecebidas from "./pages/admin/FinanceiroContasRecebidas";
import FinanceiroPagamentosRetirada from "./pages/admin/FinanceiroPagamentosRetirada";
import FinanceiroFluxoCaixa from "./pages/admin/FinanceiroFluxoCaixa";
import FinanceiroRelatorios from "./pages/admin/FinanceiroRelatorios";
import FinanceiroRecibos from "./pages/admin/FinanceiroRecibos";
import FinanceiroReciboPrint from "./pages/admin/FinanceiroReciboPrint";
import FinanceiroReciboAvulso from "./pages/admin/FinanceiroReciboAvulso";
import FinanceiroReciboAvulsoPrint from "./pages/admin/FinanceiroReciboAvulsoPrint";

// ─── Gestão Fiscal ───────────────────────────────────────────────────────────
import GestaoFiscalDashboard from "./pages/admin/GestaoFiscalDashboard";
import NotasFiscais from "./pages/admin/NotasFiscais";
import ConfiguracoesFiscais from "./pages/admin/ConfiguracoesFiscais";

// ─── Autenticação Própria Admin + Backoffice ──────────────────────────────────
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminsManager from "./pages/admin/AdminsManager";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminCommissions from "./pages/admin/AdminCommissions";

// ─── Orçamentos ──────────────────────────────────────────────────────────────
import AdminQuotations from "./pages/admin/AdminQuotations";
import AdminQuotationForm from "./pages/admin/AdminQuotationForm";
import AdminQuotationDetail from "./pages/admin/AdminQuotationDetail";

// ─── Páginas ERP ─────────────────────────────────────────────────────────────
import ERPDashboard from "./pages/erp/ERPDashboard";
import ProductionDashboard from "./pages/erp/ProductionDashboard";
import FinancialDashboard from "./pages/erp/FinancialDashboard";
import AutomationDashboard from "./pages/erp/AutomationDashboard";
import SegmentsManager from "./pages/erp/SegmentsManager";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerQuotations from "./pages/seller/SellerQuotations";
import SellerCommissions from "./pages/seller/SellerCommissions";
import SellerNewSale from "./pages/seller/SellerNewSale";

/**
 * AdminRoutes — detecta ambiente (Manus vs site) e usa autenticação apropriada.
 * - No Manus: usa Manus OAuth (useAuth)
 * - No site: usa autenticação própria (useAdminAuth)
 * - /admin/login e /admin/setup são rotas públicas (apenas no site)
 */
function AdminRoutes() {
  const [location] = useLocation();
  const isManus = window.location.hostname.includes('manus.computer');

  // ─── No site: rotas públicas de admin (sem auth) ──────────────────────────
  if (!isManus && (location === "/admin/login" || location === "/admin/setup")) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/setup" component={AdminSetup} />
      </Switch>
    );
  }

  // ─── No Manus: usar Manus OAuth; no site: usar adminAuth próprio ──────────
  if (isManus) {
    return <AdminProtectedRoutesManus />;
  } else {
    return <AdminProtectedRoutes />;
  }
}

/** Painel comercial independente, visível apenas para a conta de vendedor. */
function SellerRoutes() {
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" /></div>;
  }
  if (!adminUser) {
    window.location.replace("/admin/login");
    return null;
  }
  return (
    <Switch>
      <Route path="/vendedor" component={SellerOrders} />
      <Route path="/vendedor/pedidos" component={SellerOrders} />
      <Route path="/vendedor/orcamentos" component={SellerQuotations} />
      <Route path="/vendedor/orcamentos/novo" component={SellerQuotationForm} />
      <Route path="/vendedor/orcamentos/:id/editar" component={SellerQuotationForm} />
      <Route path="/vendedor/vendas/nova" component={SellerNewSale} />
      <Route path="/vendedor/comissoes" component={SellerOrders} />
    </Switch>
  );
}

/**
 * AdminProtectedRoutesManus — verifica Manus OAuth (para o preview do Manus).
 * Usa useAuth do Manus OAuth para autenticação.
 */
function AdminProtectedRoutesManus() {
  // Rotas específicas do ambiente de prévia
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Não autenticado no Manus → redirecionar para login do Manus
  if (!user || user.role !== "admin") {
    window.location.href = getLoginUrl();
    return null;
  }

// Rotas protegidas do ambiente de prévia
return (
<Switch>
<Route path="/admin/configuracoes-site/rodape" component={AdminFooterInformation} />
<Route path="/admin/configuracoes-site/normas-de-arte" component={AdminArtworkGuidelines} />
<Route path="/admin/configuracoes-site/guia-da-maria" component={AdminMariaGuide} />
<Route path="/admin/configuracoes-site/gabaritos" component={AdminPrintTemplates} />
	      <Route path="/admin/vendedores" component={AdminSellers} />
	      <Route path="/admin/comissoes" component={AdminCommissions} />
      <Route path="/admin/configuracoes-site/dados-da-empresa" component={AdminCompanySettings} />
<Route path="/admin/relatorios" component={AdminDashboard} />
      <Route path="/admin/financeiro/recibos/avulso/novo" component={FinanceiroReciboAvulso} />
      <Route path="/admin/financeiro/recibos/avulso/:id/editar" component={FinanceiroReciboAvulso} />
      <Route path="/admin/financeiro/recibos/avulso/:id/imprimir" component={FinanceiroReciboAvulsoPrint} />
      <Route path="/admin/financeiro/recibos/:id/imprimir" component={FinanceiroReciboPrint} />
      <Route path="/admin/financeiro/recibos" component={FinanceiroRecibos} />
      {/* Rotas acessíveis para todos os roles admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/produtos/dashboard" component={AdminProductsDashboard} />
      <Route path="/admin/produtos/carrossel" component={AdminHomeCarousel} />
      <Route path="/admin/produtos" component={AdminProducts} />
      <Route path="/admin/novo-produto" component={AdminNewProduct} />
      <Route path="/admin/variacoes" component={AdminVariations} />
      <Route path="/admin/variacoesoffset" component={AdminVariationsOffset} />
      <Route path="/admin/variacoescomunicacaovisual" component={AdminVariationsCv} />
      <Route path="/admin/atributos" component={AdminAttributesManager} />
      <Route path="/admin/vincular-atributos" component={AdminProductAttributesLinker} />
      <Route path="/admin/regras-builder" component={AdminRulesBuilder} />
      <Route path="/admin/regras-dinamicas" component={AdminRulesManager} />
      <Route path="/admin/pedidos/kanban" component={AdminKanban} />
      <Route path="/admin/producao/kanban" component={AdminProductionKanban} />
      <Route path="/admin/pedidos/novos" component={NewOrders} />
      <Route path="/admin/pedidos" component={AdminOrders} />
      <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
      <Route path="/admin/orcamentos" component={AdminQuotations} />
      <Route path="/admin/orcamentos/novo" component={AdminQuotationForm} />
      <Route path="/admin/orcamentos/:id/editar" component={AdminQuotationForm} />
      <Route path="/admin/orcamentos/:id" component={AdminQuotationDetail} />
      <Route path="/admin/os" component={AdminOS} />
      <Route path="/admin/os/:id" component={AdminOSPrint} />
      <Route path="/admin/dados-da-empresa" component={AdminCompanySettings} />
      <Route path="/admin/pre-impressao" component={AdminPreImpressao} />
      <Route path="/admin/status-producao" component={AdminStatusProducao} />
      <Route path="/admin/clientes" component={ClientsManager} />
      <Route path="/admin/clientes-loja" component={AdminCustomers} />
      <Route path="/admin/clientes-balcao" component={ClientesBalcao} />
      <Route path="/admin/clientes-site" component={ClientesSite} />
      <Route path="/admin/validacao-arquivos" component={FileValidationManager} />
      <Route path="/admin/erp" component={ERPDashboard} />
      <Route path="/admin/financeiro" component={FinancialDashboard} />
      <Route path="/admin/automacao" component={AutomationDashboard} />
      <Route path="/admin/segmentos" component={SegmentsManager} />
      <Route path="/admin/logistica" component={LogisticsDashboard} />
      <Route path="/admin/logistica/configuracoes" component={CorreiosSettings} />
      <Route path="/admin/logistica/transportadoras" component={CarriersManager} />
      <Route path="/admin/logistica/regras-frete" component={ShippingRulesManager} />
      <Route path="/admin/logistica/expedicao" component={ShipmentsManager} />
      <Route path="/admin/logistica/rastreamento" component={TrackingManager} />
      {/* Mercado Pago */}
      <Route path="/admin/pagamentos/mercadopago" component={MercadoPagoSettings} />
      {/* Gerenciador Financeiro (legado) */}
      <Route path="/admin/gerenciador-financeiro" component={GerenciadorFinanceiroDashboard} />
      <Route path="/admin/gerenciador-financeiro/receber" component={ContasReceber} />
      <Route path="/admin/gerenciador-financeiro/recebidas" component={ContasRecebidas} />
      <Route path="/admin/gerenciador-financeiro/retirada" component={PagamentosRetirada} />
      <Route path="/admin/gerenciador-financeiro/fluxo" component={FluxoCaixa} />
      <Route path="/admin/gerenciador-financeiro/relatorios" component={RelatoriosFinanceiros} />
      {/* Gerenciador Financeiro NOVO */}
      <Route path="/admin/financeiro-dashboard" component={FinanceiroDashboard} />
      <Route path="/admin/financeiro/receber" component={FinanceiroContasReceber} />
      <Route path="/admin/financeiro/recebidas" component={FinanceiroContasRecebidas} />
      <Route path="/admin/financeiro/retirada" component={FinanceiroPagamentosRetirada} />
      <Route path="/admin/financeiro/fluxo" component={FinanceiroFluxoCaixa} />
      <Route path="/admin/financeiro/relatorios" component={FinanceiroRelatorios} />
      {/* Gestão Fiscal */}
      <Route path="/admin/fiscal" component={GestaoFiscalDashboard} />
      <Route path="/admin/fiscal/notas" component={NotasFiscais} />
      <Route path="/admin/fiscal/configuracoes" component={ConfiguracoesFiscais} />
      {/* Painel de Produção */}
      <Route path="/producao" component={ProductionDashboard} />
      {/* Backoffice */}
      <Route path="/admin/administradores" component={AdminsManager} />
      <Route path="/admin/auditoria" component={AuditLogs} />
      <Route path="/admin/perfil" component={AdminProfile} />
      <Route path="/admin/usuarios" component={AdminUsuarios} />
    </Switch>
  );
}

/**
 * AdminProtectedRoutes — verifica sessão adminAuth própria.
 * Separado de AdminRoutes para que o hook useAdminAuth só seja chamado
 * quando a rota NÃO é /admin/login ou /admin/setup.
 */
function AdminProtectedRoutes() {
  // Rotas específicas do domínio oficial
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Não autenticado → redirecionar para /admin/login (NÃO para /login do Manus)
  if (!adminUser) {
    window.location.replace("/admin/login");
    return null;
  }

  if (adminUser.role === "seller") {
    window.location.replace("/vendedor");
    return null;
  }

// Rotas protegidas do domínio oficial
return (
<Switch>
<Route path="/admin/configuracoes-site/rodape" component={AdminFooterInformation} />
<Route path="/admin/configuracoes-site/normas-de-arte" component={AdminArtworkGuidelines} />
<Route path="/admin/configuracoes-site/guia-da-maria" component={AdminMariaGuide} />
<Route path="/admin/configuracoes-site/gabaritos" component={AdminPrintTemplates} />
<Route path="/admin/configuracoes-site/prazos-padrao" component={AdminGlobalDeliveryOptions} />
	      <Route path="/admin/vendedores" component={AdminSellers} />
	      <Route path="/admin/comissoes" component={AdminCommissions} />
      <Route path="/admin/configuracoes-site/dados-da-empresa" component={AdminCompanySettings} />
<Route path="/admin/relatorios" component={AdminDashboard} />
      <Route path="/admin/financeiro/recibos/avulso/novo" component={FinanceiroReciboAvulso} />
      <Route path="/admin/financeiro/recibos/avulso/:id/editar" component={FinanceiroReciboAvulso} />
      <Route path="/admin/financeiro/recibos/avulso/:id/imprimir" component={FinanceiroReciboAvulsoPrint} />
      <Route path="/admin/financeiro/recibos/:id/imprimir" component={FinanceiroReciboPrint} />
      <Route path="/admin/financeiro/recibos" component={FinanceiroRecibos} />
      {/* Rotas acessíveis para todos os roles admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/produtos/dashboard" component={AdminProductsDashboard} />
      <Route path="/admin/produtos/carrossel" component={AdminHomeCarousel} />
      <Route path="/admin/produtos" component={AdminProducts} />
      <Route path="/admin/novo-produto" component={AdminNewProduct} />
      <Route path="/admin/variacoes" component={AdminVariations} />
      <Route path="/admin/variacoesoffset" component={AdminVariationsOffset} />
      <Route path="/admin/variacoescomunicacaovisual" component={AdminVariationsCv} />
      <Route path="/admin/atributos" component={AdminAttributesManager} />
      <Route path="/admin/vincular-atributos" component={AdminProductAttributesLinker} />
      <Route path="/admin/regras-builder" component={AdminRulesBuilder} />
      <Route path="/admin/regras-dinamicas" component={AdminRulesManager} />
      <Route path="/admin/pedidos/kanban" component={AdminKanban} />
      <Route path="/admin/producao/kanban" component={AdminProductionKanban} />
      <Route path="/admin/pedidos/novos" component={NewOrders} />
      <Route path="/admin/pedidos" component={AdminOrders} />
      <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
      <Route path="/admin/orcamentos" component={AdminQuotations} />
      <Route path="/admin/orcamentos/novo" component={AdminQuotationForm} />
      <Route path="/admin/orcamentos/:id/editar" component={AdminQuotationForm} />
      <Route path="/admin/orcamentos/:id" component={AdminQuotationDetail} />
      <Route path="/admin/os" component={AdminOS} />
      <Route path="/admin/os/:id" component={AdminOSPrint} />
      <Route path="/admin/dados-da-empresa" component={AdminCompanySettings} />
      <Route path="/admin/pre-impressao" component={AdminPreImpressao} />
      <Route path="/admin/status-producao" component={AdminStatusProducao} />
      <Route path="/admin/clientes" component={ClientsManager} />
      <Route path="/admin/clientes-loja" component={AdminCustomers} />
      <Route path="/admin/clientes-balcao" component={ClientesBalcao} />
      <Route path="/admin/clientes-site" component={ClientesSite} />
      <Route path="/admin/validacao-arquivos" component={FileValidationManager} />
      <Route path="/admin/erp" component={ERPDashboard} />
      <Route path="/admin/financeiro" component={FinancialDashboard} />
      <Route path="/admin/automacao" component={AutomationDashboard} />
      <Route path="/admin/segmentos" component={SegmentsManager} />
      <Route path="/admin/logistica" component={LogisticsDashboard} />
      <Route path="/admin/logistica/configuracoes" component={CorreiosSettings} />
      <Route path="/admin/logistica/transportadoras" component={CarriersManager} />
      <Route path="/admin/logistica/regras-frete" component={ShippingRulesManager} />
      <Route path="/admin/logistica/expedicao" component={ShipmentsManager} />
      <Route path="/admin/logistica/rastreamento" component={TrackingManager} />
      {/* Mercado Pago */}
      <Route path="/admin/pagamentos/mercadopago" component={MercadoPagoSettings} />
      {/* Gerenciador Financeiro (legado) */}
      <Route path="/admin/gerenciador-financeiro" component={GerenciadorFinanceiroDashboard} />
      <Route path="/admin/gerenciador-financeiro/receber" component={ContasReceber} />
      <Route path="/admin/gerenciador-financeiro/recebidas" component={ContasRecebidas} />
      <Route path="/admin/gerenciador-financeiro/retirada" component={PagamentosRetirada} />
      <Route path="/admin/gerenciador-financeiro/fluxo" component={FluxoCaixa} />
      <Route path="/admin/gerenciador-financeiro/relatorios" component={RelatoriosFinanceiros} />
      {/* Gerenciador Financeiro NOVO */}
      <Route path="/admin/financeiro-dashboard" component={FinanceiroDashboard} />
      <Route path="/admin/financeiro/receber" component={FinanceiroContasReceber} />
      <Route path="/admin/financeiro/recebidas" component={FinanceiroContasRecebidas} />
      <Route path="/admin/financeiro/retirada" component={FinanceiroPagamentosRetirada} />
      <Route path="/admin/financeiro/fluxo" component={FinanceiroFluxoCaixa} />
      <Route path="/admin/financeiro/relatorios" component={FinanceiroRelatorios} />
      {/* Gestão Fiscal */}
      <Route path="/admin/fiscal" component={GestaoFiscalDashboard} />
      <Route path="/admin/fiscal/notas" component={NotasFiscais} />
      <Route path="/admin/fiscal/configuracoes" component={ConfiguracoesFiscais} />
      {/* Painel de Produção */}
      <Route path="/producao" component={ProductionDashboard} />
      {/* Backoffice */}
      <Route path="/admin/administradores" component={AdminsManager} />
      <Route path="/admin/auditoria" component={AuditLogs} />
      <Route path="/admin/perfil" component={AdminProfile} />
      <Route path="/admin/usuarios" component={AdminUsuarios} />
    </Switch>
  );
}

/**
 * Router — rotas públicas e de cliente.
 * NÃO usa useAuth() aqui para não disparar trpc.auth.me em páginas públicas.
 */
function Router() {
  const [location] = useLocation();

  // Rotas admin e produção são tratadas pelo AdminRoutes (inclui /admin/login)
  if (location.startsWith("/admin") || location.startsWith("/producao")) {
    return <AdminRoutes />;
  }

  if (location.startsWith("/vendedor")) {
    return <SellerRoutes />;
  }

  return (
    <Switch>
      {/* ── Rotas Públicas ─────────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalog} />
      <Route path="/gabaritos" component={PrintTemplatesPage} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/todos-produtos" component={AllProducts} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/pedido/acompanhar/:token" component={GuestOrderTracking} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/calculadora-demo" component={CalculadoraDemo} />
      <Route path="/contato" component={ContactPage} />
      <Route path="/documentos" component={DocumentationPage} />
      <Route path="/documentos/:documentId" component={DocumentationPage} />

      {/* ── Autenticação de Clientes ────────────────────────────────────── */}
      <Route path="/cadastro" component={CustomerRegister} />
      <Route path="/login-cliente" component={CustomerLogin} />
      <Route path="/verificar-email" component={VerifyEmail} />
      <Route path="/recuperar-senha" component={ForgotPassword} />
      <Route path="/nova-senha" component={ResetPassword} />
      <Route path="/reenviar-verificacao" component={ResendVerification} />

      {/* ── Carrinho — acessível para todos ────────────────────────────── */}
      <Route path="/carrinho" component={CartPage} />

      {/* ── Área do Cliente (proteção interna via CustomerAuthContext) ──── */}
      <Route path="/minha-conta" component={MyAccountPage} />
      <Route path="/meus-pedidos" component={MyOrdersPage} />
      <Route path="/pedido/:id" component={OrderDetailPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/rastreamento/:id" component={OrderTracking} />

      {/* ── 404 ────────────────────────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isOpen } = useCartDrawer();
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin") || location.startsWith("/producao") || location.startsWith("/vendedor");

  useEffect(() => {
    if (isAdminRoute) return;

    const resetPublicScroll = () => {
      document.getElementById("public-site-scroll-container")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const frameId = window.requestAnimationFrame(resetPublicScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [isAdminRoute, location]);

  // Rotas admin não usam o Header do e-commerce nem o CartSidePanel
  if (isAdminRoute) {
    return <Router />;
  }

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Coluna principal: 70% quando carrinho aberto, 100% quando fechado */}
      <div className={`flex min-w-0 flex-col transition-all duration-300 ${isOpen ? "w-[70%]" : "w-full"}`}>
        <Header />
        <div id="public-site-scroll-container" className="flex-1">
          <Router />
        </div>
        <FloatingWhatsAppButton />
        <CookieConsentBanner />
      </div>
      {/* Coluna do carrinho: 30% fixo quando aberto */}
      {isOpen && <CartSidePanel />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppLayout />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
