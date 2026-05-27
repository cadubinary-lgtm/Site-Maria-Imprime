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
import AdminHome from "./pages/admin/AdminHome";
import AdminProducao from "./pages/admin/AdminProducao";
import AdminVariacoes from "./pages/admin/AdminVariacoes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminAttributesManager from "./pages/admin/AdminAttributesManager";
import AdminProductAttributesLinker from "./pages/admin/AdminProductAttributesLinker";
import { AdminPricingRules } from "./pages/admin/AdminPricingRules";
import AdminRulesBuilder from "./pages/admin/AdminRulesBuilder";
import AdminRulesManager from "./pages/admin/AdminRulesManager";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import ClientsManager from "./pages/admin/ClientsManager";
import AdminCustomers from "./pages/admin/AdminCustomers";
import FileValidationManager from "./pages/admin/FileValidationManager";

// ─── Layout Admin ───────────────────────────────────────────────────────────
import AdminLayout from "./components/admin/AdminLayout";

// ─── Páginas ERP ─────────────────────────────────────────────────────────────
import ERPDashboard from "./pages/erp/ERPDashboard";
import ProductionDashboard from "./pages/erp/ProductionDashboard";
import FinancialDashboard from "./pages/erp/FinancialDashboard";
import AutomationDashboard from "./pages/erp/AutomationDashboard";
import SegmentsManager from "./pages/erp/SegmentsManager";

/**
 * AdminRoutes — só renderiza quando a rota começa com /admin ou /producao.
 * IMPORTANTE: rotas mais específicas DEVEM vir antes das genéricas no Switch.
 */
function AdminRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Role: production
  if (user.role === "production") {
    return (
      <Switch>
        <Route path="/producao">{() => <AdminLayout><ProductionDashboard /></AdminLayout>}</Route>
        <Route>{() => { window.location.href = "/producao"; return null; }}</Route>
      </Switch>
    );
  }

  // Role: não admin
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p className="text-gray-500">Acesso não autorizado.</p>
      </div>
    );
  }

  // ── Admin: rotas mais específicas PRIMEIRO ──────────────────────────────────
  return (
    <Switch>
      {/* ── Pedidos (sub-rota antes da rota pai) ─────────────────────────── */}
      <Route path="/admin/pedidos/:id">{() => <AdminLayout><AdminOrderDetail /></AdminLayout>}</Route>
      <Route path="/admin/pedidos">{() => <AdminLayout><AdminOrders /></AdminLayout>}</Route>

      {/* ── Produção ─────────────────────────────────────────────────────── */}
      <Route path="/admin/producao">{() => <AdminLayout><AdminProducao /></AdminLayout>}</Route>

      {/* ── Produtos & Catálogo ──────────────────────────────────────────── */}
      <Route path="/admin/produtos">{() => <AdminLayout><AdminProducts /></AdminLayout>}</Route>
      <Route path="/admin/variacoes">{() => <AdminLayout><AdminVariacoes /></AdminLayout>}</Route>
      <Route path="/admin/atributos">{() => <AdminLayout><AdminAttributesManager /></AdminLayout>}</Route>
      <Route path="/admin/vincular-atributos">{() => <AdminLayout><AdminProductAttributesLinker /></AdminLayout>}</Route>

      {/* ── Precificação ─────────────────────────────────────────────────── */}
      <Route path="/admin/regras-dinamicas">{() => <AdminLayout><AdminRulesManager /></AdminLayout>}</Route>
      <Route path="/admin/regras-builder">{() => <AdminLayout><AdminRulesBuilder /></AdminLayout>}</Route>
      <Route path="/admin/regras">{() => <AdminLayout><AdminPricingRules /></AdminLayout>}</Route>
      <Route path="/admin/precos">{() => <AdminLayout><AdminPanel /></AdminLayout>}</Route>

      {/* ── CRM ──────────────────────────────────────────────────────────── */}
      <Route path="/admin/clientes-loja">{() => <AdminLayout><AdminCustomers /></AdminLayout>}</Route>
      <Route path="/admin/clientes">{() => <AdminLayout><ClientsManager /></AdminLayout>}</Route>

      {/* ── ERP / Relatórios ─────────────────────────────────────────────── */}
      <Route path="/admin/erp">{() => <AdminLayout><ERPDashboard /></AdminLayout>}</Route>
      <Route path="/admin/financeiro">{() => <AdminLayout><FinancialDashboard /></AdminLayout>}</Route>
      <Route path="/admin/automacao">{() => <AdminLayout><AutomationDashboard /></AdminLayout>}</Route>
      <Route path="/admin/segmentos">{() => <AdminLayout><SegmentsManager /></AdminLayout>}</Route>

      {/* ── Configurações ────────────────────────────────────────────────── */}
      <Route path="/admin/validacao-arquivos">{() => <AdminLayout><FileValidationManager /></AdminLayout>}</Route>
      <Route path="/admin/painel">{() => <AdminLayout><AdminDashboard /></AdminLayout>}</Route>

      {/* ── Painel Admin (dashboard principal) — DEVE ser a última rota /admin */}
      <Route path="/admin">{() => <AdminLayout><AdminHome /></AdminLayout>}</Route>

      {/* ── Fallback admin ───────────────────────────────────────────────── */}
      <Route>{() => <AdminLayout><AdminHome /></AdminLayout>}</Route>
    </Switch>
  );
}

/**
 * Router — rotas públicas e de cliente.
 * NÃO usa useAuth() aqui para não disparar trpc.auth.me em páginas públicas.
 */
function Router() {
  const [location] = useLocation();

  // Rotas admin e produção são tratadas pelo AdminRoutes (sem Header público)
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
      <Route path="/busca" component={SearchResults} />
      <Route path="/calculadora-demo" component={CalculadoraDemo} />

      {/* ── Produto ─────────────────────────────────────────────────────── */}
      <Route path="/produto/:id" component={ProductDetail} />

      {/* ── Confirmação e rastreamento ──────────────────────────────────── */}
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/pedido/acompanhar/:token" component={GuestOrderTracking} />

      {/* ── Autenticação de Clientes ────────────────────────────────────── */}
      <Route path="/cadastro" component={CustomerRegister} />
      <Route path="/login-cliente" component={CustomerLogin} />
      <Route path="/verificar-email" component={VerifyEmail} />
      <Route path="/recuperar-senha" component={ForgotPassword} />
      <Route path="/nova-senha" component={ResetPassword} />
      <Route path="/reenviar-verificacao" component={ResendVerification} />

      {/* ── Carrinho — acessível para todos ────────────────────────────── */}
      <Route path="/carrinho" component={CartPage} />

      {/* ── Área do Cliente ─────────────────────────────────────────────── */}
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
  const [location] = useLocation();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {!location.startsWith("/admin") && !location.startsWith("/producao") && <Header />}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
