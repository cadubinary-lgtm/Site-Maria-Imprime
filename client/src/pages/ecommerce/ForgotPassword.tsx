import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { HOME_PRIMARY_ACTION_CLASS } from "@/lib/homeActionStyles";

function maskCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "não informado";
  return `•••• ${digits.slice(-4)}`;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const cpfReference = new URLSearchParams(window.location.search).get("cpf");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.customerAuth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    requestReset.mutate({ email });
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-12 text-center" aria-live="polite">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email enviado!</h2>
            <p className="text-gray-600 mb-2">
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá as instruções em breve.
            </p>
            <p className="text-gray-400 text-sm mb-8">Verifique também a pasta de spam.</p>
            <Button asChild className={`w-full ${HOME_PRIMARY_ACTION_CLASS}`}>
              <Link href="/login-cliente">Voltar ao Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/login-cliente" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Recuperar Senha</h1>
          <p className="text-gray-500 mt-1">Enviaremos um link para redefinir sua senha</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-pink-600" />
              Esqueci minha senha
            </CardTitle>
            <CardDescription>Digite seu email cadastrado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {cpfReference && <p className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">CPF/CNPJ informado: <strong>{maskCpfCnpj(cpfReference)}</strong>. Digite abaixo o e-mail vinculado a este cadastro.</p>}

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full ${HOME_PRIMARY_ACTION_CLASS}`}
                disabled={requestReset.isPending}
              >
                {requestReset.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
