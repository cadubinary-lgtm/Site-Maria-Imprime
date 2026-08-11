import AdminLayout from "@/components/AdminLayout";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, GripVertical } from "lucide-react";

function SortableHandleOffset({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0" title="Arrastar para reordenar">
      <GripVertical className="w-4 h-4" />
    </span>
  );
}

function SortableVariationItemOffset({ id, children }: { id: number; children: React.ReactNode }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return <div ref={setNodeRef} style={style}>{children}</div>;
}

export default function AdminVariationsOffset() {
  const [, navigate] = useLocation();

  // ── Estado local ──────────────────────────────────────────────────────────
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeRequired, setNewTypeRequired] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");
  const [newOptionNames, setNewOptionNames] = useState<Record<number, string>>({});
  const [newOptionPrices, setNewOptionPrices] = useState<Record<number, string>>({});
  const [newOptionCalcTypes, setNewOptionCalcTypes] = useState<Record<number, string>>({});
  // Estados de edição inline de opção
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingOptionPrice, setEditingOptionPrice] = useState("");
  const [editingOptionCalcType, setEditingOptionCalcType] = useState("unit");

  const CALC_TYPE_OPTIONS = [
    { value: "unit", label: "Unidade" },
    { value: "m2", label: "m² (Metro Quadrado)" },
    { value: "linear", label: "Metro Linear" },
    { value: "package", label: "Pacote" },
  ];

  // ── Queries ───────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: offsetTypes = [], refetch } = trpc.variationsOffset.getGlobal.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createTypeMutation = trpc.variationsOffset.createType.useMutation();
  const updateTypeMutation = trpc.variationsOffset.updateType.useMutation();
  const deleteTypeMutation = trpc.variationsOffset.deleteType.useMutation();
  const createOptionMutation = trpc.variationsOffset.createOption.useMutation();
  const deleteOptionMutation = trpc.variationsOffset.deleteOption.useMutation();
  const updateOptionMutation = trpc.variationsOffset.updateOption.useMutation();
  const reorderTypesMutation = trpc.variationsOffset.reorderTypes.useMutation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = offsetTypes.findIndex((v: any) => v.id === active.id);
    const newIndex = offsetTypes.findIndex((v: any) => v.id === over.id);
    const newOrder = arrayMove(offsetTypes as any[], oldIndex, newIndex);
    try {
      await reorderTypesMutation.mutateAsync({ updates: newOrder.map((v: any, i: number) => ({ id: v.id, order: i })) });
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
    } catch { toast.error("Erro ao reordenar"); }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await createTypeMutation.mutateAsync({
        productId: null,
        type: "material",
        name: newTypeName.trim(),
        isRequired: newTypeRequired,
      });
      setNewTypeName("");
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
      toast.success("Tipo de variação criado!");
    } catch {
      toast.error("Erro ao criar tipo de variação");
    }
  };

  const handleSaveTypeName = async (id: number) => {
    if (!editingTypeName.trim()) return;
    try {
      await updateTypeMutation.mutateAsync({ id, name: editingTypeName.trim() });
      setEditingTypeId(null);
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
    } catch {
      toast.error("Erro ao renomear");
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("Excluir este tipo de variação?")) return;
    try {
      await deleteTypeMutation.mutateAsync({ id });
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
      toast.success("Tipo excluído");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleToggleRequired = async (id: number, current: boolean) => {
    try {
      await updateTypeMutation.mutateAsync({ id, isRequired: !current });
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleAddOption = async (typeId: number) => {
    const name = newOptionNames[typeId]?.trim();
    if (!name) return;
    try {
      await createOptionMutation.mutateAsync({
        variationTypeId: typeId,
        name,
        priceModifier: newOptionPrices[typeId] || "0",
        calculationType: (newOptionCalcTypes[typeId] || "unit") as "unit" | "m2" | "linear" | "package",
      });
      setNewOptionNames(prev => ({ ...prev, [typeId]: "" }));
      setNewOptionPrices(prev => ({ ...prev, [typeId]: "" }));
      setNewOptionCalcTypes(prev => ({ ...prev, [typeId]: "unit" }));
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
      toast.success("Opção adicionada!");
    } catch {
      toast.error("Erro ao adicionar opção");
    }
  };

  const handleStartEditOption = (opt: any) => {
    setEditingOptionId(opt.id);
    setEditingOptionName(opt.name);
    setEditingOptionPrice(opt.priceModifier ?? "0");
    setEditingOptionCalcType(opt.calculationType ?? "unit");
  };

  const handleSaveOption = async (optId: number) => {
    if (!editingOptionName.trim()) return;
    try {
      await updateOptionMutation.mutateAsync({
        id: optId,
        name: editingOptionName.trim(),
        priceModifier: editingOptionPrice || "0",
        calculationType: editingOptionCalcType as "unit" | "m2" | "linear" | "package",
      });
      setEditingOptionId(null);
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
      toast.success("Opção atualizada!");
    } catch {
      toast.error("Erro ao atualizar opção");
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm("Excluir esta opção?")) return;
    try {
      await deleteOptionMutation.mutateAsync({ id: optionId });
      await utils.variationsOffset.getGlobal.invalidate();
      refetch();
    } catch {
      toast.error("Erro ao excluir opção");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Variações Offset</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie tipos de variação exclusivos para produtos de impressão Offset.
              Estas variações são <strong>completamente independentes</strong> das variações de Comunicação Visual.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/variacoescomunicacaovisual")}>
              Comunicação Visual
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/produtos")}>
              ← Voltar para Produtos
            </Button>
          </div>
        </div>

        {/* Formulário de criação */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Adicionar Novo Tipo de Variação Offset</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Nome da Variação</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Ex: Gramatura, Formato, Acabamento..."
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateType()}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Obrigatório?</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                value={newTypeRequired ? "sim" : "nao"}
                onChange={e => setNewTypeRequired(e.target.value === "sim")}
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <Button
              onClick={handleCreateType}
              disabled={createTypeMutation.isPending || !newTypeName.trim()}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de tipos */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(offsetTypes as any[]).map((v: any) => v.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
          {offsetTypes.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white border border-gray-200 rounded-xl">
              <p className="text-sm">Nenhum tipo de variação Offset cadastrado ainda.</p>
              <p className="text-xs mt-1">Use o formulário acima para adicionar o primeiro tipo.</p>
            </div>
          )}

          {offsetTypes.map((vt: any) => {
            const isExpanded = expandedTypes.has(vt.id);
            const isEditing = editingTypeId === vt.id;

            return (
              <SortableVariationItemOffset key={vt.id} id={vt.id}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Cabeçalho do tipo */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2 flex-1">
                    <SortableHandleOffset id={vt.id} />
                    <button
                      onClick={() => toggleExpand(vt.id)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          className="border border-pink-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-400"
                          value={editingTypeName}
                          onChange={e => setEditingTypeName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleSaveTypeName(vt.id);
                            if (e.key === "Escape") setEditingTypeId(null);
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveTypeName(vt.id)} className="text-green-600 hover:text-green-700">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingTypeId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-800 text-sm">{vt.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{vt.options?.length ?? 0} opções</span>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500">Obrigatório:</span>
                      <button
                        onClick={() => handleToggleRequired(vt.id, vt.isRequired)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition ${vt.isRequired ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {vt.isRequired ? "Sim" : "Não"}
                      </button>
                    </div>
                    <button
                      onClick={() => { setEditingTypeId(vt.id); setEditingTypeName(vt.name); }}
                      className="text-gray-400 hover:text-pink-600 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(vt.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Opções (expandido) */}
                {isExpanded && (
                  <div className="px-4 py-3 space-y-2">
                    {/* Lista de opções */}
                   {(vt.options ?? []).map((opt: any) => (
                      <div key={opt.id} className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
                        {editingOptionId === opt.id ? (
                          /* Modo edição inline */
                          <div className="flex gap-2 items-center px-3 py-2">
                            <input
                              className="flex-1 border border-pink-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                              value={editingOptionName}
                              onChange={e => setEditingOptionName(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSaveOption(opt.id); if (e.key === "Escape") setEditingOptionId(null); }}
                              autoFocus
                              placeholder="Nome da opção"
                            />
                            <input
                              className="w-24 border border-pink-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                              type="number"
                              step="0.01"
                              value={editingOptionPrice}
                              onChange={e => setEditingOptionPrice(e.target.value)}
                              placeholder="R$ preço"
                            />
                            <select
                              className="border border-pink-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                              value={editingOptionCalcType}
                              onChange={e => setEditingOptionCalcType(e.target.value)}
                            >
                              {CALC_TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <button onClick={() => handleSaveOption(opt.id)} className="text-green-600 hover:text-green-700 transition">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingOptionId(null)} className="text-gray-400 hover:text-gray-600 transition">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          /* Modo visualização */
                          <div className="flex items-center justify-between py-1.5 px-3">
                            <span className="text-sm text-gray-700">{opt.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {parseFloat(opt.priceModifier ?? "0") !== 0
                                  ? `${parseFloat(opt.priceModifier) > 0 ? "+" : ""}R$ ${parseFloat(opt.priceModifier).toFixed(2)}`
                                  : "R$ 0,00"}
                                /{CALC_TYPE_OPTIONS.find(c => c.value === (opt.calculationType ?? "unit"))?.label ?? "Unidade"}
                              </span>
                              <button
                                onClick={() => handleStartEditOption(opt)}
                                className="text-gray-400 hover:text-pink-600 transition"
                                title="Editar opção"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteOption(opt.id)}
                                className="text-gray-300 hover:text-red-500 transition"
                                title="Excluir opção"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                   ))}

                    {/* Formulário de nova opção */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <input
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="Nome da opção (ex: Couché 90g)"
                        value={newOptionNames[vt.id] ?? ""}
                        onChange={e => setNewOptionNames(prev => ({ ...prev, [vt.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleAddOption(vt.id)}
                      />
                      <input
                        className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="+ R$ preço"
                        type="number"
                        step="0.01"
                        value={newOptionPrices[vt.id] ?? ""}
                        onChange={e => setNewOptionPrices(prev => ({ ...prev, [vt.id]: e.target.value }))}
                      />
                      <select
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                        value={newOptionCalcTypes[vt.id] ?? "unit"}
                        onChange={e => setNewOptionCalcTypes(prev => ({ ...prev, [vt.id]: e.target.value }))}
                      >
                        {CALC_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={() => handleAddOption(vt.id)}
                        disabled={createOptionMutation.isPending || !newOptionNames[vt.id]?.trim()}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </SortableVariationItemOffset>
            );
          })}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </AdminLayout>
  );
}
