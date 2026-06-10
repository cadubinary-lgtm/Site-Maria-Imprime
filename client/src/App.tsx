import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Header from "./components/Header";

// ─── Páginas Públicas ────────────────────────────────────────────────────────
import Home from "./pages/public/Home";
import NotFound from "./pages/public/NotFound";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import Catalog from "./pages/public/Catalog";
import AllProducts from "./pages/public/AllProducts";
import SearchResults from "./pages/public/SearchResults";
import CalculadoraDemo from "./pages/public/CalculadoraDemo";

// ─── Páginas de E-commerce ───────────────────────────────────────────────────
import ProductDetail from "./pages/ecommerce/ProductDetail";
import CartPage from "./pages/ecommerce/CartPage";
import CheckoutPage from "./pages/ecommerce/CheckoutPage";
import OrderConfirmation from "./pages/ecommerce/OrderConfirmation";
import GuestOrderTracking from "./pages/ecommerce/GuestOrderTracking";
import CustomerRegister from "./pages/ecommerce/CustomerRegister";
import CustomerLogin from "./pages/ecommerce/CustomerLogin";
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
import AdminPanel from "./pages/admin/AdminPanel";
import AdminAttributesManager from "./pages/admin/AdminAttributesManager";
import AdminProductAttributesLinker from "./pages/admin/AdminProductAttributesLinker";
import AdminRulesBuilder from "./pages/admin/AdminRulesBuilder";
import AdminRulesManager from "./pages/admin/AdminRulesManager";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminKanban from "./pages/admin/AdminKanban";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminOS from "./pages/admin/AdminOS";
import AdminOSPrint from "./pages/admin/AdminOSPrint";
import ClientsManager from "./pages/admin/ClientsManager";
import AdminCustomers from "./pages/admin/AdminCustomers";
import FileValidationManager from "./pages/admin/FileValidationManager";
import LogisticsDashboard from "./pages/admin/LogisticsDashboard";
import CarriersManager from "./pages/admin/CarriersManager";
import ShippingRulesManager from "./pages/admin/ShippingRulesManager";
import CorreiosSettings from "./pages/admin/CorreiosSettings";
import ShipmentsManager from "./pages/admin/ShipmentsManager";
import TrackingManager from "./pages/admin/TrackingManager";

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

// ─── Gestão Fiscal ───────────────────────────────────────────────────────────
import GestaoFiscalDashboard from "./pages/admin/GestaoFiscalDashboard";
import NotasFiscais from "./pages/admin/NotasFiscais";
import ConfiguracoesFiscais from "./pages/admin/ConfiguracoesFiscais";

// ─── Autenticação Própria Admin + Backoffice ──────────────────────────────────
import AdminLogin from "./pages/admin/AdminLogin";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminsManager from "./pages/admin/AdminsManager";
import AuditLogs from "./pages/admin/AuditLogs";

// ─── Páginas ERP ─────────────────────────────────────────────────────────────
import ERPDashboard from "./pages/erp/ERPDashboard";
import ProductionDashboard from "./pages/erp/ProductionDashboard";
import FinancialDashboard from "./pages/erp/FinancialDashboard";
import AutomationDashboard from "./pages/erp/AutomationDashboard";
import SegmentsManager from "./pages/erp/SegmentsManager";

/**
 * AdminRoutes — só renderiza quando a rota começa com /admin ou /producao.
 * useAuth() (Manus OAuth) é chamado APENAS aqui, nunca globalmente.
 * Isso evita que trpc.auth.me.useQuery() execute em páginas públicas.
 */
function AdminRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {user?.role === "admin" && (
        <>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/produtos" component={AdminProducts} />
          <Route path="/admin/atributos" component={AdminAttributesManager} />
          <Route path="/admin/vincular-atributos" component={AdminProductAttributesLinker} />
          <Route path="/admin/regras-builder" component={AdminRulesBuilder} />
          <Route path="/admin/regras-dinamicas" component={AdminRulesManager} />
          <Route path="/admin/pedidos/kanban" component={AdminKanban} />
          <Route path="/admin/pedidos" component={AdminOrders} />
          <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
          <Route path="/admin/os" component={AdminOS} />
          <Route path="/admin/os/:id" component={AdminOSPrint} />
          <Route path="/admin/clientes" component={ClientsManager} />
          <Route path="/admin/clientes-loja" component={AdminCustomers} />
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
          {/* Gerenciador Financeiro (legado - mantido acessível) */}
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
          {/* Backoffice: Administradores e Auditoria */}
          <Route path="/admin/administradores" component={AdminsManager} />
          <Route path="/admin/auditoria" component={AuditLogs} />
        </>
      )}
      {user?.role === "production" && (
        <Route path="/producao" component={ProductionDashboard} />
      )}
      {/* Se não autenticado ou sem role, redireciona para login */}
      {!loading && !user && (
        <Route>
          {() => {
            window.location.href = "/login";
            return null;
          }}
        </Route>
      )}
    </Switch>
  );
}

/**
 * Router — rotas públicas e de cliente.
 * NÃO usa useAuth() aqui para não disparar trpc.auth.me em páginas públicas.
 */
function Router() {
  const [location] = useLocation();

  // Rotas de login/setup admin são públicas (não precisam de auth)
  if (location === "/admin/login" || location === "/admin/setup") {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/setup" component={AdminSetup} />
      </Switch>
    );
  }

  // Rotas admin e produção são tratadas pelo AdminRoutes
  if (location.startsWith("/admin") || location.startsWith("/producao")) {
    return <AdminRoutes />;
  }

  return (
    <Switch>
      {/* ── Rotas Públicas ─────────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalog} />
      <Route path="/login" component={LoginPage} />
      <Route path="/todos-produtos" component={AllProducts} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/pedido/acompanhar/:token" component={GuestOrderTracking} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/calculadora-demo" component={CalculadoraDemo} />

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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Header />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
