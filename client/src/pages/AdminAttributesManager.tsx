import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AttributeType = "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures";

export default function AdminAttributesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "select" as AttributeType,
    description: "",
  });

  // Carregar atributos
  const { data: attributes, isLoading, refetch } = trpc.attributes.listAttributes.useQuery();

  // Mutations
  const createMutation = trpc.attributes.createAttribute.useMutation({
    onSuccess: () => {
      toast.success("Atributo criado com sucesso!");
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.attributes.updateAttribute.useMutation({
    onSuccess: () => {
      toast.success("Atributo atualizado com sucesso!");
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.attributes.deleteAttribute.useMutation({
    onSuccess: () => {
      toast.success("Atributo deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", type: "select", description: "" });
    setEditingAttribute(null);
  };

  const handleOpenDialog = (attribute?: any) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setFormData({
        name: attribute.name,
        slug: attribute.slug,
        type: attribute.type,
        description: attribute.description || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingAttribute) {
      updateMutation.mutate({
        id: editingAttribute.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este atributo?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Atributos</h1>
          <p className="text-gray-600 mt-2">Cadastre atributos globais reutilizáveis para seus produtos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Atributo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAttribute ? "Editar Atributo" : "Novo Atributo"}</DialogTitle>
              <DialogDescription>
                {editingAttribute
                  ? "Atualize os dados do atributo"
                  : "Crie um novo atributo global reutilizável"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Material, Acabamento, Cor"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Ex: material, acabamento, cor"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Componente *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as AttributeType })}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Botões</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="card">Cards</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                    <SelectItem value="numeric">Campo Numérico</SelectItem>
                    <SelectItem value="text">Campo de Texto</SelectItem>
                    <SelectItem value="measures">Medidas Personalizadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {attributes && attributes.length > 0 ? (
            attributes.map((attr: any) => (
              <Card key={attr.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{attr.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                          {attr.slug}
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {attr.type}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(attr)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(attr.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {attr.description && (
                  <CardContent>
                    <p className="text-sm text-gray-600">{attr.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Nenhum atributo cadastrado</p>
                <p className="text-sm text-gray-400 mt-2">Clique em "Novo Atributo" para começar</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
