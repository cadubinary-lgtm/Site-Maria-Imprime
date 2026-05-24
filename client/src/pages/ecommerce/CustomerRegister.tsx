import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Eye, EyeOff, Loader2, UserPlus, ArrowLeft } from "lucide-react";

export default function CustomerRegister() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const register = trpc.customerAuth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
    },
    onError: (err) => {
      // Extrair mensagem amigável de erros Zod (array de issues)
      try {
        const issues = JSON.parse(err.message) as Array<{ message: string }>;
        if (Array.isArray(issues) && issues.length > 0) {
          setError(issues.map(i => i.message).join(" "));
          return;
        }
      } catch {
        // não é JSON, usar mensagem direta
      }
      setError(err.message);
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validações de senha no frontend (antes de enviar ao servidor)
    if (form.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("A senha deve conter ao menos uma letra maiúscula.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("A senha deve conter ao menos um número.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!form.acceptTerms) {
      setError("Você deve aceitar os termos de uso para continuar.");
      return;
    }

    register.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      cpfCnpj: form.cpfCnpj || undefined,
      password: form.password,
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cadastro realizado!</h2>
            <p className="text-gray-600 mb-2">
              Enviamos um email de confirmação para <strong>{form.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar sua conta.
            </p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/login-cliente">Ir para o Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo / Voltar */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-500 mt-1">Cadastre-se para fazer pedidos e acompanhar suas impressões</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-orange-500" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>Preencha seus dados para criar sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="João"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Silva"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="joao@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    value={form.cpfCnpj}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    autoComplete="new-password"
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
                <p className="text-xs text-gray-400">Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 accent-orange-500"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Concordo com os{" "}
                  <Link href="/termos" className="text-orange-600 hover:underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-orange-600 hover:underline">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta Grátis"
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Já tem conta?{" "}
                <Link href="/login-cliente" className="text-orange-600 font-medium hover:underline">
                  Fazer login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
