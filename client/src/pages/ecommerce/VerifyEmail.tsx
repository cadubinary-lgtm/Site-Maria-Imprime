import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  );
  const [message, setMessage] = useState("");

  const verify = trpc.customerAuth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message);
    },
  });

  useEffect(() => {
    if (token) {
      verify.mutate({ token });
    }
  }, [token]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Verificando seu email...</h2>
            <p className="text-gray-500 mt-2">Aguarde um momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Email confirmado!</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/login-cliente">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Link inválido</h2>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                <Link href="/reenviar-verificacao">Solicitar novo link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login-cliente">Voltar ao Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Confirme seu email</h2>
          <p className="text-gray-600 mb-8">
            Acesse o link enviado para seu email para ativar sua conta.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/reenviar-verificacao">Não recebi o email</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
