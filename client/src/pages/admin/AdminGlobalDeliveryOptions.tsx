import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Clock, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getAdminContextualReturnTarget } from "@/lib/adminNavigation";

type GlobalDeliveryOption = {
  id: number;
  name: string;
  daysToDeliver: number;
  pricePerM2: string;
  isActive: boolean;
  order: number;
};

const EMPTY_DRAFT = { id: 0, name: "", daysToDeliver: 0, pricePerM2: "0", isActive: true };

export default function AdminGlobalDeliveryOptions() {
  const [location, setLocation] = useLocation();
  const returnTarget = getAdminContextualReturnTarget(location);
  const utils = trpc.useUtils();
  const { data: options = [], isLoading } = trpc.globalDeliveryOptions.getAll.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [toDelete, setToDelete] = useState<GlobalDeliveryOption | null>(null);

  const createMutation = trpc.globalDeliveryOptions.create.useMutation({
    onSuccess: () => { utils.globalDeliveryOptions.getAll.invalidate(); setDialogOpen(false); toast.success("Prazo criado com sucesso."); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.globalDeliveryOptions.update.useMutation({
    onSuccess: () => { utils.globalDeliveryOptions.getAll.invalidate(); setDialogOpen(false); toast.success("Prazo atualizado."); },
    onError: (e) => toast.error(e.message),
  });
  const removeMutation = trpc.globalDeliveryOptions.remove.useMutation({
    onSuccess: () => { utils.globalDeliveryOptions.getAll.invalidate(); setToDelete(null); toast.success("Prazo removido."); },
    onError: (e) => toast.error(e.message),
  });
  const reorderMutation = trpc.globalDeliveryOptions.reorder.useMutation({
    onSuccess: () => utils.globalDeliveryOptions.getAll.invalidate(),
  });

  const openCreate = () => { setDraft(EMPTY_DRAFT); setDialogOpen(true); };
  const openEdit = (opt: GlobalDeliveryOption) => {
    setDraft({ id: opt.id, name: opt.name, daysToDeliver: opt.daysToDeliver, pricePerM2: opt.pricePerM2, isActive: opt.isActive });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) { toast.error("Informe o nome do prazo."); return; }
    const priceNum = parseFloat(String(draft.pricePerM2).replace(",", ".")) || 0;
    if (draft.id) {
      updateMutation.mutate({ id: draft.id, name: draft.name.trim(), daysToDeliver: draft.daysToDeliver, pricePerM2: priceNum, isActive: draft.isActive });
    } else {
      createMutation.mutate({ name: draft.name.trim(), daysToDeliver: draft.daysToDeliver, pricePerM2: priceNum, isActive: draft.isActive });
    }
  };

  const handleMove = (id: number, direction: -1 | 1) => {
    const sorted = [...options].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((o) => o.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    reorderMutation.mutate({ orderedIds: reordered.map((o) => o.id) });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const sorted = [...options].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prazos Padrão</h1>
          <p className="mt-1 text-sm text-gray-500">
            Prazos cadastrados aqui aparecem automaticamente ao criar um novo produto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation(returnTarget.path)} className="gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
          </Button>
          <Button onClick={openCreate} className="gap-1.5 bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="h-4 w-4" /> Novo Prazo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Nenhum prazo cadastrado ainda.</p>
          <Button onClick={openCreate} variant="outline" size="sm" className="mt-4 gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50">
            <Plus className="h-3.5 w-3.5" /> Adicionar primeiro prazo
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((opt, index) => (
            <div key={opt.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <Clock className="h-4 w-4 shrink-0 text-pink-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{opt.name}</p>
                <p className="text-xs text-gray-500">
                  {opt.daysToDeliver === 0 ? "Mesmo dia" : `${opt.daysToDeliver} dia${opt.daysToDeliver !== 1 ? "s" : ""} útei${opt.daysToDeliver !== 1 ? "s" : "l"}`}
                  {parseFloat(opt.pricePerM2) > 0 ? ` · R$ ${parseFloat(opt.pricePerM2).toFixed(2).replace(".", ",")}/m²` : ""}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${opt.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {opt.isActive ? "Ativo" : "Inativo"}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleMove(opt.id, -1)} disabled={index === 0} aria-label="Mover para cima"><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleMove(opt.id, 1)} disabled={index === sorted.length - 1} aria-label="Mover para baixo"><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(opt as GlobalDeliveryOption)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setToDelete(opt as GlobalDeliveryOption)} aria-label="Excluir" className="text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar prazo" : "Novo prazo"}</DialogTitle>
            <DialogDescription>Configure o prazo de produção que ficará disponível para todos os produtos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="gdo-name">Nome *</Label>
              <Input id="gdo-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ex.: Prazo Normal, Mesmo Dia, 24 Horas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gdo-days">Dias úteis de produção</Label>
              <Input id="gdo-days" type="number" min={0} value={draft.daysToDeliver} onChange={(e) => setDraft((d) => ({ ...d, daysToDeliver: Math.max(0, parseInt(e.target.value) || 0) }))} />
              <p className="text-xs text-gray-400">Use 0 para "Mesmo Dia".</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gdo-price">Taxa adicional por m² (R$)</Label>
              <Input id="gdo-price" inputMode="decimal" value={draft.pricePerM2} onChange={(e) => setDraft((d) => ({ ...d, pricePerM2: e.target.value }))} placeholder="0,00" />
              <p className="text-xs text-gray-400">Deixe 0 para prazos sem taxa adicional.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div>
                <Label htmlFor="gdo-active" className="font-semibold text-gray-900">Ativo</Label>
                <p className="text-xs text-gray-500">Prazos inativos não aparecem em novos produtos.</p>
              </div>
              <Switch id="gdo-active" checked={draft.isActive} onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-pink-600 hover:bg-pink-700 text-white">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {draft.id ? "Salvar alterações" : "Criar prazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prazo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o prazo <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && removeMutation.mutate({ id: toDelete.id })} className="bg-red-600 hover:bg-red-700 text-white">
              {removeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
