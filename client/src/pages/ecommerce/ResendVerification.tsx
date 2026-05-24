import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ResendVerification() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const resend = trpc.customerAuth.resendVerification.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    resend.mutate({ email });
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email reenviado!</h2>
            <p className="text-gray-600 mb-8">
              Se o email <strong>{email}</strong> estiver cadastrado e não verificado, você receberá um novo link em breve.
            </p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/login-cliente">Voltar ao Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/login-cliente" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Reenviar Confirmação</h1>
          <p className="text-gray-500 mt-1">Reenviaremos o link de confirmação para seu email</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-500" />
              Reenviar Email
            </CardTitle>
            <CardDescription>Digite o email que você usou no cadastro</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
                disabled={resend.isPending}
              >
                {resend.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                ) : (
                  "Reenviar Email de Confirmação"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
