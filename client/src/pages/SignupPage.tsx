import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    cpfCnpj: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("E-mail inválido");
      return false;
    }
    if (!formData.whatsapp.trim()) {
      setError("WhatsApp é obrigatório");
      return false;
    }
    if (!formData.cpfCnpj.trim()) {
      setError("CPF/CNPJ é obrigatório");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Senhas não conferem");
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Aqui você implementaria a chamada para criar o usuário
      // Por enquanto, vamos redirecionar para o login do Manus
      const loginUrl = getLoginUrl();
      window.location.href = loginUrl;
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
              <Input
                id="cpfCnpj"
                name="cpfCnpj"
                placeholder="000.000.000-00"
                value={formData.cpfCnpj}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
            >
              Já tenho conta
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Ao criar conta, você concorda com nossos termos de serviço
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
