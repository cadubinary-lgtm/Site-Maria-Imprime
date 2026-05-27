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
import { AdminPricingRules } from "./pages/admin/AdminPricingRules";
import AdminRulesBuilder from "./pages/admin/AdminRulesBuilder";
import AdminRulesManager from "./pages/admin/AdminRulesManager";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import ClientsManager from "./pages/admin/ClientsManager";
import AdminCustomers from "./pages/admin/AdminCustomers";
import FileValidationManager from "./pages/admin/FileValidationManager";

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
          <Route path="/admin/precos" component={AdminPanel} />
          <Route path="/admin/atributos" component={AdminAttributesManager} />
          <Route path="/admin/vincular-atributos" component={AdminProductAttributesLinker} />
          <Route path="/admin/regras" component={AdminPricingRules} />
          <Route path="/admin/regras-builder" component={AdminRulesBuilder} />
          <Route path="/admin/regras-dinamicas" component={AdminRulesManager} />
          <Route path="/admin/pedidos" component={AdminOrders} />
          <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
          <Route path="/admin/clientes" component={ClientsManager} />
          <Route path="/admin/clientes-loja" component={AdminCustomers} />
          <Route path="/admin/validacao-arquivos" component={FileValidationManager} />
          <Route path="/admin/erp" component={ERPDashboard} />
          <Route path="/admin/financeiro" component={FinancialDashboard} />
          <Route path="/admin/automacao" component={AutomationDashboard} />
          <Route path="/admin/segmentos" component={SegmentsManager} />
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
