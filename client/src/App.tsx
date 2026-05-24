import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import ProductionDashboard from "./pages/ProductionDashboard";
import OrderTracking from "./pages/OrderTracking";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import SearchResults from "./pages/SearchResults";
import AllProducts from "./pages/AllProducts";
import AdminPanel from "./pages/AdminPanel";
import SegmentsManager from "./pages/SegmentsManager";
import CalculadoraDemo from "./pages/CalculadoraDemo";
import AdminAttributesManager from "./pages/AdminAttributesManager";
import AdminProductAttributesLinker from "./pages/AdminProductAttributesLinker";
import AdminRulesBuilder from "./pages/AdminRulesBuilder";
import { AdminPricingRules } from "./pages/AdminPricingRules";
import AdminRulesManager from "./pages/AdminRulesManager";
import Catalog from "./pages/Catalog";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyAccountPage from "./pages/MyAccountPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";

import ClientsManager from "./pages/ClientsManager";
import FinancialDashboard from "./pages/FinancialDashboard";
import FileValidationManager from "./pages/FileValidationManager";
import AutomationDashboard from "./pages/AutomationDashboard";
import ERPDashboard from "./pages/ERPDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import { useAuth } from "./_core/hooks/useAuth";
import Header from "./components/Header";

function Router() {
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
      <Route path="/" component={Home} />
      <Route path={"/catalogo"} component={Catalog} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={SignupPage} />

      <Route path="/todos-produtos" component={AllProducts} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/busca" component={SearchResults} />
      <Route path="/calculadora-demo" component={CalculadoraDemo} />
      
      {/* Carrinho - acessível para todos, mostra login se não autenticado */}
      <Route path="/carrinho" component={CartPage} />

      {/* Rotas protegidas do cliente */}
      {user ? (
        <>
          <Route path="/minha-conta" component={MyAccountPage} />
          <Route path="/meus-pedidos" component={MyOrdersPage} />
          <Route path="/pedido/:id" component={OrderDetailPage} />
          <Route path="/checkout" component={CheckoutPage} />
        </>
      ) : (
        <>
          <Route path="/minha-conta" component={LoginPage} />
          <Route path="/meus-pedidos" component={LoginPage} />
          <Route path="/pedido/:id" component={LoginPage} />
          <Route path="/checkout" component={LoginPage} />
        </>
      )}
      
      {/* Admin routes - Acessível apenas para admins */}
      {user?.role === "admin" && (
        <>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/produtos" component={AdminProducts} />
          <Route path="/admin/precos" component={AdminPanel} />
          <Route path="/admin/segmentos" component={SegmentsManager} />
          <Route path="/admin/clientes" component={ClientsManager} />
          <Route path="/admin/financeiro" component={FinancialDashboard} />
          <Route path="/admin/validacao-arquivos" component={FileValidationManager} />
        <Route path="/admin/automacao" component={AutomationDashboard} />
        <Route path="/admin/erp" component={ERPDashboard} />
          <Route path="/admin/pedidos" component={AdminOrders} />
          <Route path="/admin/pedidos/:id" component={AdminOrderDetail} />
        <Route path="/admin/atributos" component={AdminAttributesManager} />
        <Route path="/admin/vincular-atributos" component={AdminProductAttributesLinker} />
        <Route path="/admin/regras" component={AdminPricingRules} />
        <Route path="/admin/regras-dinamicas" component={AdminRulesManager} />

        </>
      )}

      {/* Production routes */}
      {user?.role === "production" && (
        <>
          <Route path="/producao" component={ProductionDashboard} />
        </>
      )}

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
