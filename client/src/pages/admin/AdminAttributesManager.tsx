import AdminLayout from "@/components/AdminLayout";
import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader2, Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

type AttributeType = "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures";

export default function AdminAttributesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "select" as AttributeType,
    description: "",
    basePrice: 0,
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
    setFormData({ name: "", slug: "", type: "select", description: "", basePrice: 0 });
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
        basePrice: Number(attribute.basePrice) || 0,
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

  // Filtrar atributos por busca
  const filteredAttributes = useMemo(() => {
    if (!attributes) return [];
    if (!searchQuery.trim()) return attributes;
    
    const query = searchQuery.toLowerCase();
    return attributes.filter((attr: any) => 
      attr.name.toLowerCase().includes(query) ||
      attr.slug.toLowerCase().includes(query)
    );
  }, [attributes, searchQuery]);

  return (
    <AdminLayout>
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
              <div>
                <Label htmlFor="basePrice">Preço (R$)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
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

      {/* Campo de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar atributo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAttributes && filteredAttributes.length > 0 ? (
            filteredAttributes.map((attr: any) => (
              <Card key={attr.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle>{attr.name}</CardTitle>
                        {attr.basePrice > 0 && (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                            +R$ {Number(attr.basePrice).toFixed(2)}
                          </span>
                        )}
                      </div>
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
                <p className="text-gray-500">
                  {attributes && attributes.length > 0
                    ? "Nenhum atributo encontrado com esse termo"
                    : "Nenhum atributo cadastrado"}
                </p>
                {attributes && attributes.length > 0 && (
                  <p className="text-sm text-gray-400 mt-2">Tente uma busca diferente</p>
                )}
                {!attributes || attributes.length === 0 && (
                  <p className="text-sm text-gray-400 mt-2">Clique em "Novo Atributo" para começar</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
