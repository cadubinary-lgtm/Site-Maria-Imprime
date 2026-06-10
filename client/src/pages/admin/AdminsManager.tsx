/**
 * Aba "Administradores" no backoffice
 * Permite: listar, criar, editar, resetar senha, ativar/desativar admins
 * Acessível em /admin/administradores
 * Apenas superadmin pode criar/editar/desativar admins.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  UserPlus, KeyRound, Power, Pencil, ShieldCheck, Shield, Wrench,
  Loader2, AlertCircle, Users
} from "lucide-react";
import { toast } from "sonner";

type AdminRow = {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "production";
  status: "active" | "inactive";
  lastLogin: number | null;
  createdAt: number;
};

const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  superadmin: { label: "Superadmin", icon: <ShieldCheck className="h-3 w-3" />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  production: { label: "Produção", icon: <Wrench className="h-3 w-3" />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export default function AdminsManager() {
  const { adminUser } = useAdminAuth();
  const isSuperAdmin = adminUser?.role === "superadmin";

  const { data: admins, isLoading, refetch } = trpc.adminAuth.listAdmins.useQuery();
  const createMutation = trpc.adminAuth.createAdmin.useMutation();
  const updateMutation = trpc.adminAuth.updateAdmin.useMutation();
  const resetPasswordMutation = trpc.adminAuth.resetAdminPassword.useMutation();
  const toggleStatusMutation = trpc.adminAuth.toggleAdminStatus.useMutation();

  // Modais
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<AdminRow | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<AdminRow | null>(null);

  // Formulário de criação
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" as const });
  const [createError, setCreateError] = useState<string | null>(null);

  // Formulário de edição
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "admin" as "superadmin" | "admin" | "production" });

  // Formulário de reset de senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createMutation.mutateAsync(createForm);
      toast.success("Administrador criado com sucesso!");
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", role: "admin" });
      refetch();
    } catch (err: any) {
      setCreateError(err?.message || "Erro ao criar administrador");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    try {
      await updateMutation.mutateAsync({ id: showEdit.id, ...editForm });
      toast.success("Administrador atualizado!");
      setShowEdit(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPassword) return;
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não conferem");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({ id: showResetPassword.id, newPassword });
      toast.success("Senha resetada com sucesso!");
      setShowResetPassword(null);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao resetar senha");
    }
  };

  const handleToggleStatus = async (admin: AdminRow) => {
    const newStatus = admin.status === "active" ? "inactive" : "active";
    try {
      await toggleStatusMutation.mutateAsync({ id: admin.id, status: newStatus });
      toast.success(newStatus === "active" ? "Administrador ativado!" : "Administrador desativado!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar status");
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return "Nunca";
    return new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            Administradores
          </h1>
          <p className="text-slate-400 mt-1">Gerencie os administradores do sistema</p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Administrador
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <Alert className="bg-amber-950/30 border-amber-700/50 text-amber-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você pode visualizar os administradores. Apenas superadmins podem criar, editar ou desativar.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Nome</TableHead>
                  <TableHead className="text-slate-400">E-mail</TableHead>
                  <TableHead className="text-slate-400">Perfil</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Último Login</TableHead>
                  {isSuperAdmin && <TableHead className="text-slate-400 text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(admins || []).map((admin: AdminRow) => {
                  const roleInfo = roleLabels[admin.role] || roleLabels.admin;
                  return (
                    <TableRow key={admin.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">{admin.name}</TableCell>
                      <TableCell className="text-slate-300">{admin.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${roleInfo.color}`}>
                          {roleInfo.icon}
                          {roleInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.status === "active" ? "default" : "secondary"}
                          className={admin.status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-slate-700 text-slate-400"
                          }
                        >
                          {admin.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{formatDate(admin.lastLogin)}</TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                              title="Editar"
                              onClick={() => {
                                setShowEdit(admin);
                                setEditForm({ name: admin.name, email: admin.email, role: admin.role });
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-yellow-400 hover:bg-slate-700"
                              title="Resetar senha"
                              onClick={() => setShowResetPassword(admin)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            {admin.id !== adminUser?.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 hover:bg-slate-700 ${admin.status === "active" ? "text-slate-400 hover:text-red-400" : "text-slate-400 hover:text-green-400"}`}
                                title={admin.status === "active" ? "Desativar" : "Ativar"}
                                onClick={() => handleToggleStatus(admin)}
                                disabled={toggleStatusMutation.isPending}
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {(!admins || admins.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhum administrador cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Criar Admin */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Administrador</DialogTitle>
            <DialogDescription className="text-slate-400">
              Crie um novo acesso administrativo ao sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label className="text-slate-300">Nome completo</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">E-mail</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Senha (mín. 8 caracteres)</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Perfil</Label>
              <Select
                value={createForm.role}
                onValueChange={v => setCreateForm(f => ({ ...f, role: v as any }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  <SelectItem value="superadmin" className="text-white">Superadmin</SelectItem>
                  <SelectItem value="production" className="text-white">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Admin */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Administrador</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">E-mail</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Perfil</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v as any }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  <SelectItem value="superadmin" className="text-white">Superadmin</SelectItem>
                  <SelectItem value="production" className="text-white">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowEdit(null)} className="text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Resetar Senha */}
      <Dialog open={!!showResetPassword} onOpenChange={() => setShowResetPassword(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription className="text-slate-400">
              Defina uma nova senha para <strong className="text-white">{showResetPassword?.name}</strong>.
              Todas as sessões ativas serão encerradas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Repita a senha"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowResetPassword(null)} className="text-slate-400">
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resetar Senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
