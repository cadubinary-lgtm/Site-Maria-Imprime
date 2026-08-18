import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Search } from "lucide-react";
import { useLocation } from "wouter";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleBrowseCatalog = () => {
    setLocation("/catalogo");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-slate-50 p-4" aria-labelledby="not-found-title">
      <Card className="w-full max-w-lg border border-pink-100 bg-white/90 shadow-lg backdrop-blur-sm">
        <CardContent className="py-8 text-center sm:py-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-pink-100 motion-safe:animate-pulse" aria-hidden="true" />
              <AlertCircle className="relative h-16 w-16 text-pink-600" aria-hidden="true" />
            </div>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">Erro 404</p>

          <h1 id="not-found-title" className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Página não encontrada</h1>

          <p role="alert" className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-600">
            O endereço acessado não existe ou pode ter sido movido. Você pode voltar ao início ou explorar o catálogo.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className={`${HOME_PRIMARY_ACTION_CLASS} w-full sm:w-auto`}
            >
              <Home className="w-4 h-4" />
              Voltar ao início
            </Button>
            <Button onClick={handleBrowseCatalog} variant="outline" className={`${HOME_SECONDARY_ACTION_CLASS} w-full sm:w-auto`}>
              <Search className="w-4 h-4" />
              Explorar catálogo
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
