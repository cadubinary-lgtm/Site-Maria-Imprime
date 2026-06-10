/**
 * Página de Perfil do Administrador
 * Permite alterar nome, e-mail e senha com validação segura.
 * Acessível em /admin/perfil
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle, KeyRound, ShieldCheck, Shield, Wrench,
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { toast } from "sonner";

const roleInfo: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  superadmin: {
    label: "Superadmin",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  admin: {
    label: "Admin",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  production: {
    label: "Produção",
    icon: <Wrench className="h-4 w-4" />,
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Letra minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-500", "bg-red-400", "bg-yellow-500", "bg-blue-400", "bg-green-500"];
  const labels = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : "bg-slate-700"}`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 2 ? "text-red-400" : score === 3 ? "text-yellow-400" : "text-green-400"}`}>
        {labels[score - 1] || "Muito fraca"}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? "text-green-400" : "text-slate-500"}`}>
            <CheckCircle2 className={`h-3 w-3 ${c.ok ? "text-green-400" : "text-slate-600"}`} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { data: admin, isLoading, refetch } = trpc.adminAuth.me.useQuery();
  const changePasswordMutation = trpc.adminAuth.changePassword.useMutation();
  const updateProfileMutation = trpc.adminAuth.updateProfile.useMutation();

  // Formulário de senha
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Formulário de perfil
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Inicializar formulário de perfil quando os dados carregarem
  const role = admin?.role || "admin";
  const ri = roleInfo[role] || roleInfo.admin;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("A nova senha e a confirmação não conferem.");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwForm.newPassword === pwForm.currentPassword) {
      setPwError("A nova senha não pode ser igual à senha atual.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Senha alterada com sucesso!");
    } catch (err: any) {
      setPwError(err?.message || "Erro ao alterar senha.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    try {
      await updateProfileMutation.mutateAsync({
        name: profileForm.name,
        email: profileForm.email,
      });
      setProfileEditing(false);
      refetch();
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      setProfileError(err?.message || "Erro ao atualizar perfil.");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCircle className="h-7 w-7 text-orange-500" />
            Meu Perfil
          </h1>
          <p className="text-gray-500 mt-1">Gerencie suas informações e segurança de acesso</p>
        </div>

        {/* Card: Informações do Perfil */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                <CardDescription>Seu nome e e-mail de acesso ao sistema</CardDescription>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border font-medium ${ri.color}`}>
                {ri.icon}
                {ri.label}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {!profileEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nome</p>
                    <p className="text-gray-900 font-medium">{admin?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">E-mail</p>
                    <p className="text-gray-900 font-medium">{admin?.email}</p>
                  </div>
                </div>
                {admin?.lastLogin && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Último Login</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(admin.lastLogin).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProfileForm({ name: admin?.name || "", email: admin?.email || "" });
                    setProfileEditing(true);
                  }}
                >
                  Editar Informações
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {profileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setProfileEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Card: Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-500" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Use uma senha forte com letras maiúsculas, minúsculas, números e caracteres especiais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pwError}</AlertDescription>
                </Alert>
              )}
              {pwSuccess && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>Senha alterada com sucesso!</AlertDescription>
                </Alert>
              )}

              {/* Senha atual */}
              <div className="space-y-2">
                <Label>Senha atual</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Digite sua senha atual"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrent(v => !v)}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Nova senha */}
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNew(v => !v)}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={pwForm.newPassword} />
              </div>

              {/* Confirmar nova senha */}
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repita a nova senha"
                    className={`pr-10 ${pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirm(v => !v)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                  <p className="text-xs text-red-500">As senhas não conferem</p>
                )}
                {pwForm.confirmPassword && pwForm.confirmPassword === pwForm.newPassword && pwForm.newPassword.length >= 8 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> As senhas conferem
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Alterando senha...</>
                ) : (
                  <><KeyRound className="mr-2 h-4 w-4" /> Alterar Senha</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Aviso de segurança */}
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            <strong>Dica de segurança:</strong> Após alterar a senha, todas as outras sessões ativas serão encerradas automaticamente. Você continuará logado apenas nesta sessão.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
