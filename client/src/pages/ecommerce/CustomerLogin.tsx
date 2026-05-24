import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, LogIn, ArrowLeft, Mail } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const EMAIL_NOT_VERIFIED_MSG = "Confirme seu email antes de fazer login";

export default function CustomerLogin() {
  const [, navigate] = useLocation();
  const { refetch } = useCustomerAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const login = trpc.customerAuth.login.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/minha-conta");
    },
    onError: (err) => {
      if (err.message.includes(EMAIL_NOT_VERIFIED_MSG)) {
        setEmailNotVerified(true);
        setError("");
      } else {
        setEmailNotVerified(false);
        setError(err.message);
      }
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    login.mutate(form);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Voltar */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Área do Cliente</h1>
          <p className="text-gray-500 mt-1">Acesse sua conta para acompanhar seus pedidos</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <LogIn className="w-5 h-5 text-orange-500" />
              Login
            </CardTitle>
            <CardDescription>Entre com seu email e senha</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {emailNotVerified && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Mail className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-800">
                    <p className="font-medium mb-1">Email não confirmado</p>
                    <p className="text-sm mb-3">
                      Enviamos um link de confirmação para <strong>{form.email}</strong>.
                      Verifique sua caixa de entrada e a pasta de spam.
                    </p>
                    <Link
                      href={`/reenviar-verificacao?email=${encodeURIComponent(form.email)}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 underline"
                    >
                      Reenviar email de confirmação
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="/recuperar-senha" className="text-xs text-orange-600 hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Sua senha"
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">ou</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Não tem conta?{" "}
                <Link href="/cadastro" className="text-orange-600 font-medium hover:underline">
                  Criar conta grátis
                </Link>
              </p>

              <p className="text-center text-xs text-gray-400 pt-2">
                Não recebeu o email de confirmação?{" "}
                <Link href="/reenviar-verificacao" className="text-orange-600 hover:underline">
                  Reenviar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
