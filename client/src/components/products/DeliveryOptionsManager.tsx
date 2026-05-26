import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Trash2, Edit2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface DeliveryOptionData {
  id?: number;
  productId?: number;
  name: string;
  daysToDeliver: number;
  pricePerM2: number;
  isActive: boolean;
  order: number;
}

interface DeliveryOptionsManagerProps {
  /** Se fornecido, persiste no banco (modo edição). Se omitido, opera em memória (modo criação). */
  productId?: number;
  /** Tipo de cobrança do produto: 'm2' ou 'unit'. Adapta rótulos e cálculos. */
  calculationType?: string;
  /** Callback chamado sempre que a lista muda (modo offline) */
  onChange?: (options: DeliveryOptionData[]) => void;
  /** Valor inicial (modo offline) */
  initialOptions?: DeliveryOptionData[];
}

const DEFAULT_OPTIONS: DeliveryOptionData[] = [
  { name: "Prazo Normal", daysToDeliver: 5, pricePerM2: 0, isActive: true, order: 0 },
  { name: "24 Horas", daysToDeliver: 1, pricePerM2: 10, isActive: true, order: 1 },
  { name: "Mesmo Dia", daysToDeliver: 0, pricePerM2: 20, isActive: true, order: 2 },
];

export function DeliveryOptionsManager({
  productId,
  calculationType,
  onChange,
  initialOptions,
}: DeliveryOptionsManagerProps) {
  const isOfflineMode = !productId;
  // Determinar se é cobrança por m² ou por unidade
  const isM2 = !calculationType || calculationType === "m2";
  // Rótulo do campo de valor adicional
  const priceLabel = isM2 ? "Valor Adicional por m² (R$)" : "Valor Adicional por Unidade (R$)";
  const priceSuffix = isM2 ? "/m²" : "/unid.";

  const [options, setOptions] = useState<DeliveryOptionData[]>(() => {
    if (isOfflineMode) {
      return initialOptions ?? DEFAULT_OPTIONS.map((o, i) => ({ ...o, id: -(i + 1) }));
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    daysToDeliver: 5,
    pricePerM2: 0,
    isActive: true,
  });

  // Modo online: buscar prazos do banco (para qualquer tipo de produto)
  const { data: deliveryOptions, isLoading } = trpc.deliveryOptions.getByProduct.useQuery(
    { productId: productId! },
    { enabled: !isOfflineMode }
  );

  useEffect(() => {
    if (!isOfflineMode && deliveryOptions) {
      setOptions(deliveryOptions as DeliveryOptionData[]);
    }
  }, [deliveryOptions, isOfflineMode]);

  // Notificar pai quando lista muda (modo offline)
  useEffect(() => {
    if (isOfflineMode && onChange) {
      onChange(options);
    }
  }, [options, isOfflineMode, onChange]);

  // Mutations (modo online)
  const createMutation = trpc.deliveryOptions.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Prazo criado com sucesso!");
      const newOption: DeliveryOptionData = {
        id: data?.id ?? Date.now(),
        productId,
        ...formData,
        order: options.length,
      };
      setOptions((prev) => [...prev, newOption]);
      resetForm();
    },
    onError: (error) => toast.error(`Erro ao criar prazo: ${error.message}`),
  });

  const updateMutation = trpc.deliveryOptions.update.useMutation({
    onSuccess: () => {
      toast.success("Prazo atualizado com sucesso!");
      setOptions((prev) =>
        prev.map((o) => (o.id === editingId ? { ...o, ...formData } : o))
      );
      resetForm();
    },
    onError: (error) => toast.error(`Erro ao atualizar prazo: ${error.message}`),
  });

  const deleteMutation = trpc.deliveryOptions.delete.useMutation({
    onSuccess: () => {
      toast.success("Prazo removido!");
      setOptions((prev) => prev.filter((o) => o.id !== editingId));
      setEditingId(null);
    },
    onError: (error) => toast.error(`Erro ao deletar prazo: ${error.message}`),
  });

  const reorderMutation = trpc.deliveryOptions.reorder.useMutation({
    onError: (error) => toast.error(`Erro ao reordenar: ${error.message}`),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", daysToDeliver: 5, pricePerM2: 0, isActive: true });
    setIsOpen(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (isOfflineMode) {
      // Modo offline: apenas atualiza estado local
      if (editingId !== null) {
        setOptions((prev) =>
          prev.map((o) => (o.id === editingId ? { ...o, ...formData } : o))
        );
      } else {
        const newId = -(Date.now()); // ID temporário negativo
        setOptions((prev) => [
          ...prev,
          { id: newId, ...formData, order: prev.length },
        ]);
      }
      resetForm();
    } else {
      // Modo online: persiste no banco
      if (editingId !== null) {
        updateMutation.mutate({ id: editingId, ...formData });
      } else {
        createMutation.mutate({ productId: productId!, ...formData, order: options.length });
      }
    }
  };

  const handleEdit = (option: DeliveryOptionData) => {
    setEditingId(option.id ?? null);
    setFormData({
      name: option.name,
      daysToDeliver: option.daysToDeliver,
      pricePerM2: option.pricePerM2,
      isActive: option.isActive,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja remover este prazo?")) return;
    if (isOfflineMode) {
      setOptions((prev) => prev.filter((o) => o.id !== id));
    } else {
      setEditingId(id);
      deleteMutation.mutate({ id });
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
    const reordered = newOptions.map((o, i) => ({ ...o, order: i }));
    setOptions(reordered);
    if (!isOfflineMode) {
      reorderMutation.mutate({
        updates: reordered
          .filter((o) => o.id !== undefined && o.id > 0)
          .map((o) => ({ id: o.id!, order: o.order })),
      });
    }
  };

  const moveDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    const reordered = newOptions.map((o, i) => ({ ...o, order: i }));
    setOptions(reordered);
    if (!isOfflineMode) {
      reorderMutation.mutate({
        updates: reordered
          .filter((o) => o.id !== undefined && o.id > 0)
          .map((o) => ({ id: o.id!, order: o.order })),
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Prazos de Produção</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", daysToDeliver: 5, pricePerM2: 0, isActive: true });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo Prazo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId !== null ? "Editar Prazo" : "Novo Prazo"}</DialogTitle>
              <DialogDescription>
                {editingId !== null
                  ? "Edite as informações do prazo de entrega."
                  : "Adicione um novo prazo de entrega para este produto."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Prazo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Prazo Normal, 24 Horas, Mesmo Dia"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dias Úteis</label>
                <Input
                  type="number"
                  value={formData.daysToDeliver}
                  onChange={(e) =>
                    setFormData({ ...formData, daysToDeliver: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{priceLabel}</label>
                <Input
                  type="number"
                  value={formData.pricePerM2}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerM2: parseFloat(e.target.value) || 0 })
                  }
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isM2
                    ? "Valor extra cobrado por m² quando este prazo é selecionado."
                    : "Valor extra cobrado por unidade quando este prazo é selecionado."}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked as boolean })
                  }
                />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Ativo
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {editingId !== null ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!isOfflineMode && isLoading ? (
          <p className="text-sm text-gray-500">Carregando prazos...</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum prazo configurado. Clique em "Novo Prazo" para adicionar.
          </p>
        ) : (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs text-gray-500">
                    {option.daysToDeliver} dias úteis
                    {Number(option.pricePerM2) > 0 && (
                      <> • R$ {Number(option.pricePerM2).toFixed(2)}{priceSuffix}</>
                    )}
                    {!option.isActive && (
                      <span className="ml-1 text-red-400">• Inativo</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Mover para cima"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => moveDown(index)}
                    disabled={index === options.length - 1}
                    title="Mover para baixo"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleEdit(option)}
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(option.id!)}
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
