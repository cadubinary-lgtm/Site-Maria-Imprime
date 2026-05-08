import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CatalogImproved from "./pages/CatalogImproved";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import ProductionDashboard from "./pages/ProductionDashboard";
import OrderTracking from "./pages/OrderTracking";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import SearchResults from "./pages/SearchResults";
import AllProducts from "./pages/AllProducts";
import AdminPanel from "./pages/AdminPanel";
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
      <Route path={"/catalogo"} component={CatalogImproved} />
      <Route path="/todos-produtos" component={AllProducts} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/meus-pedidos" component={OrderTracking} />
      <Route path="/busca" component={SearchResults} />
      
      {/* Admin routes */}
      {user?.role === "admin" && (
        <>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/produtos" component={AdminProducts} />
          <Route path="/admin/precos" component={AdminPanel} />
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
