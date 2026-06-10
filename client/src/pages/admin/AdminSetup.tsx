/**
 * Página de Setup Inicial — Criar Primeiro Superadmin
 * Acessível em /admin/setup
 * Só funciona quando não existe nenhum superadmin cadastrado.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function AdminSetup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    setupKey: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: hasSuperAdmin } = trpc.adminAuth.hasSuperAdmin.useQuery();
  const createMutation = trpc.adminAuth.createFirstSuperAdmin.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        setupKey: form.setupKey,
      });
      setSuccess(true);
      setTimeout(() => navigate("/admin/login"), 3000);
    } catch (err: any) {
      setError(err?.message || "Erro ao criar superadmin");
    }
  };

  if (hasSuperAdmin?.exists) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Setup já realizado</h2>
            <p className="text-slate-400 mb-4">O superadmin já foi configurado. Faça login normalmente.</p>
            <Button onClick={() => navigate("/admin/login")} className="bg-orange-500 hover:bg-orange-600">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Superadmin criado!</h2>
            <p className="text-slate-400">Redirecionando para o login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Setup Inicial</h1>
          <p className="text-slate-400 mt-1">Criar primeiro superadministrador</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Configuração do Sistema</CardTitle>
            <CardDescription className="text-slate-400">
              Este formulário só pode ser usado uma vez para criar o primeiro superadmin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Nome completo</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Seu nome"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="admin@mariaimprime.com.br"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Senha (mín. 8 caracteres)</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Confirmar senha</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Chave de setup</Label>
                <Input
                  type="password"
                  value={form.setupKey}
                  onChange={e => setForm(f => ({ ...f, setupKey: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Chave fornecida pelo suporte técnico"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                ) : "Criar Superadmin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
