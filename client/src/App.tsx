import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ClientCatalog from "./pages/ClientCatalog";
import AdminDashboard from "./pages/AdminDashboard";
import ProductionDashboard from "./pages/ProductionDashboard";
import OrderTracking from "./pages/OrderTracking";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import { useAuth } from "./_core/hooks/useAuth";

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
      <Route path="/catalogo" component={ClientCatalog} />
      <Route path="/produto/:id" component={ProductDetail} />
      <Route path="/confirmacao/:orderNumber" component={OrderConfirmation} />
      <Route path="/meus-pedidos" component={OrderTracking} />
      
      {/* Admin routes */}
      {user?.role === "admin" && (
        <>
          <Route path="/admin" component={AdminDashboard} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
