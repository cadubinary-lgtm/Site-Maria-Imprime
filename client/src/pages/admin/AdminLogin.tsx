/**
 * Página de Login para Administradores
 * Autenticação própria via email + senha — independente do Manus OAuth.
 * Acessível em /admin/login
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getDefaultAdminRoute } from "@/lib/adminRouteUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { adminUser, isLoading, login, isLoggingIn, loginError } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Se já está logado, redirecionar para o painel
  useEffect(() => {
    if (!isLoading && adminUser) {
      // Buscar permissões para redirecionar corretamente
      // (superadmin → /admin, operador restrito → primeira rota permitida)
      navigate("/admin"); // será substituído abaixo via myPermissions
    }
  }, [adminUser, isLoading, navigate]);

  // Buscar permissões do operador logado para redirecionamento inteligente
  const { data: myPermissions } = trpc.adminAuth.myPermissions.useQuery(undefined, {
    enabled: !!adminUser && !isLoading,
    retry: false,
  });

  // Quando permissões carregarem, redirecionar para a rota correta
  useEffect(() => {
    if (!isLoading && adminUser && myPermissions !== undefined) {
      const route = getDefaultAdminRoute(adminUser.role, myPermissions);
      navigate(route);
    }
  }, [adminUser, isLoading, myPermissions, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Informe o e-mail");
      return;
    }
    if (!password) {
      setLocalError("Informe a senha");
      return;
    }

    try {
      await login(email, password);
      // Redirecionar para /admin temporariamente; o useEffect acima vai corrigir
      // assim que myPermissions carregar
      navigate("/admin");
    } catch (err: any) {
      setLocalError(err?.message || "Falha no login. Verifique suas credenciais.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" aria-label="Carregando acesso administrativo" />
      </div>
    );
  }

  const errorMessage = localError || loginError;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-600 rounded-2xl mb-4 shadow-lg shadow-pink-500/30">
            <Lock className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-slate-400 mt-1">Gráfica Ponto Digital</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Acesso Restrito</CardTitle>
            <CardDescription className="text-slate-400">
              Entre com suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@mariaimprime.com.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20"
                    autoComplete="email"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" aria-hidden="true" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20"
                    autoComplete="current-password"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold h-11 shadow-lg shadow-pink-500/25 transition-all"
                disabled={isLoggingIn}
                aria-busy={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Painel"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <p className="text-center text-xs text-slate-500">
                Acesso exclusivo para administradores autorizados.
                <br />
                Em caso de problemas, contate o suporte técnico.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} Gráfica Ponto Digital — Sistema Interno
        </p>
      </div>
    </div>
  );
}
