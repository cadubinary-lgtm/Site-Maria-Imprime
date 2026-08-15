import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit2 } from "lucide-react";
import { ADMIN_VISUAL_SYSTEM } from "@/lib/admin-visual-system";

export default function SegmentsAdmin() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", icon: "" });

  const { data: segments, isLoading, refetch } = trpc.segments.list.useQuery();
  const createMutation = trpc.segments.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({ name: "", slug: "", icon: "" });
      setEditingId(null);
    },
  });
  const updateMutation = trpc.segments.update.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({ name: "", slug: "", icon: "" });
      setEditingId(null);
    },
  });
  const deleteMutation = trpc.segments.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      alert("Preencha nome e slug");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          slug: formData.slug,
          icon: formData.icon,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          slug: formData.slug,
          icon: formData.icon,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar segmento:", error);
      alert("Erro ao salvar segmento");
    }
  };

  const handleEdit = (segment: any) => {
    setEditingId(segment.id);
    setFormData({
      name: segment.name,
      slug: segment.slug,
      icon: segment.icon || "",
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao deletar segmento");
    }
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className={`${ADMIN_VISUAL_SYSTEM.root} p-6 max-w-6xl mx-auto`}>
      <h1 className="text-3xl font-bold mb-6">Gerenciar Segmentos</h1>

      {/* Formulário */}
      <Card className="p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Cartão de Visita"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="Ex: cartao-visita"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL do Ícone PNG
              </label>
              <Input
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="Ex: /manus-storage/icon.png"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
              {editingId ? "Atualizar" : "Criar"} Segmento
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", slug: "", icon: "" });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Lista de Segmentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments?.map((segment: any) => (
          <Card key={segment.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {segment.icon && (
                  <img
                    src={segment.icon}
                    alt={segment.name}
                    className="w-12 h-12 mb-2"
                  />
                )}
                <h3 className="font-bold text-lg">{segment.name}</h3>
                <p className="text-sm text-gray-600">slug: {segment.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(segment)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={ADMIN_VISUAL_SYSTEM.iconAction}
                  onClick={() => setPendingDelete({ id: segment.id, name: segment.name })}
                  title={`Excluir segmento ${segment.name}`}
                  aria-label={`Excluir segmento ${segment.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>A categoria “{pendingDelete?.name}” será removida permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir categoria
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
