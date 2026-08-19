import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Edit2, Save, X, CheckCircle, AlertCircle, Plus, Trash2, GripVertical, ImageIcon, Layers3 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '@/components/AdminLayout';
import { SEGMENTS_PAGE_CONTENT_CLASS } from '@/lib/segments-page-layout';
import { canExecuteConfirmedDelete } from '@/lib/admin-delete-confirmation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { clearSegmentIconDraft } from '@/lib/segment-icon-draft';

// Tipo local para o segmento
type SegmentItem = {
  id: number;
  name: string;
  icon: string | null;
  slug: string;
  position: number;
  createdAt: Date;
};

// Componente de linha arrastável
function SortableRow({
  segment,
  index,
  editingId,
  editingName,
  editingSlug,
  editingIcon,
  editingIconFile,
  uploadingIcon,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onNameChange,
  onSlugChange,
  onIconFileChange,
  onRemoveIcon,
}: {
  segment: SegmentItem;
  index: number;
  editingId: number | null;
  editingName: string;
  editingSlug: string;
  editingIcon: string;
  editingIconFile: File | null;
  uploadingIcon: boolean;
  onEdit: (segment: SegmentItem) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  onDelete: (segment: SegmentItem) => void;
  onNameChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onIconFileChange: (f: File) => void;
  onRemoveIcon: (segment: SegmentItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: segment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#fdf2f8' : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const isEditing = editingId === segment.id;

  return (
    <tr ref={setNodeRef} style={style} className="border-b hover:bg-gray-50 transition-colors">
      {/* Handle de arrastar */}
      <td className="px-3 py-3 w-10">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-gray-400 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 cursor-grab active:cursor-grabbing"
          title="Arrastar para reordenar"
          aria-label={`Reordenar segmento ${segment.name}`}
        >
          <GripVertical className="w-5 h-5" aria-hidden="true" />
        </button>
      </td>

      {/* Posição */}
      <td className="px-3 py-3 w-10 text-center text-sm text-gray-400 font-mono">
        {index + 1}
      </td>

      {/* Nome */}
      <td className="px-3 py-3 font-medium">
        {isEditing ? (
          <Input
            value={editingName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full"
            aria-label={`Nome do segmento ${segment.name}`}
          />
        ) : (
          segment.name
        )}
      </td>

      {/* Ícone */}
      <td className="px-3 py-3">
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept="image/png,image/webp"
              aria-label={`Enviar ícone para ${segment.name}`}
              onChange={(e) => {
                if (e.target.files?.[0]) onIconFileChange(e.target.files[0]);
              }}
              className="flex-1 h-8"
            />
            {(editingIconFile || editingIcon) && (
              <div className="flex items-center gap-1">
                <img
                  src={editingIconFile ? URL.createObjectURL(editingIconFile) : editingIcon}
                  alt="Prévia do ícone selecionado"
                  className="w-8 h-8 object-contain"
                />
                <Button size="icon" variant="ghost" type="button" onClick={() => onRemoveIcon(segment)} className="h-8 w-8 text-gray-400 hover:bg-pink-50 hover:text-pink-600" aria-label={`Remover ícone de ${segment.name}`} title="Remover ícone">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : segment.icon ? (
          <img src={segment.icon} alt="" className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Slug */}
      <td className="px-3 py-3 text-gray-500 text-sm">
        {isEditing ? (
          <Input
            value={editingSlug}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full"
            aria-label={`Slug do segmento ${segment.name}`}
          />
        ) : (
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{segment.slug}</code>
        )}
      </td>

      {/* Ações */}
      <td className="px-3 py-3">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onSave(segment.id)}
              disabled={uploadingIcon}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingIcon ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} aria-label={`Cancelar edição de ${segment.name}`}>
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(segment)} aria-label={`Editar segmento ${segment.name}`}>
              <Edit2 className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(segment)} className="h-8 w-8 text-gray-400 hover:bg-pink-50 hover:text-pink-600" aria-label={`Excluir segmento ${segment.name}`} title="Excluir segmento">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function SegmentsManager() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingSlug, setEditingSlug] = useState('');
  const [editingIcon, setEditingIcon] = useState('');
  const [editingIconFile, setEditingIconFile] = useState<File | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSegmentForm, setNewSegmentForm] = useState({ name: '', icon: '', slug: '' });
  const [newSegmentIconFile, setNewSegmentIconFile] = useState<File | null>(null);
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [segmentPendingDeletion, setSegmentPendingDeletion] = useState<SegmentItem | null>(null);
  const [segmentIconPendingRemoval, setSegmentIconPendingRemoval] = useState<SegmentItem | null>(null);

  const { data: segments, isLoading, refetch } = trpc.segments.getAll.useQuery();

  const updateSegmentMutation = trpc.segments.update.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento atualizado com sucesso!');
      setEditingId(null);
      setEditingName('');
      setEditingSlug('');
      setEditingIcon('');
      setEditingIconFile(null);
      refetch();
    },
    onError: (error) => showNotification('error', error.message || 'Erro ao atualizar segmento'),
  });

  const createSegmentMutation = trpc.segments.create.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento criado com sucesso!');
      setIsCreating(false);
      setNewSegmentForm({ name: '', icon: '', slug: '' });
      setNewSegmentIconFile(null);
      setLocalOrder(null);
      refetch();
    },
    onError: (error) => showNotification('error', error.message || 'Erro ao criar segmento'),
  });

  const deleteSegmentMutation = trpc.segments.delete.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento deletado com sucesso!');
      setLocalOrder(null);
      refetch();
    },
    onError: (error) => showNotification('error', error.message || 'Erro ao deletar segmento'),
  });

  const reorderSegmentMutation = trpc.segments.reorder.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleIconUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload-segment-icon', { method: 'POST', body: formData });
      if (!response.ok) {
        const error = await response.json();
        showNotification('error', error.error || 'Erro ao fazer upload do ícone');
        return null;
      }
      const data = await response.json();
      return data.url;
    } catch {
      showNotification('error', 'Erro ao fazer upload do ícone');
      return null;
    }
  };

  const handleSaveSegment = async (segmentId: number) => {
    if (!editingName) { showNotification('error', 'Nome é obrigatório'); return; }
    let iconUrl = editingIcon;
    if (editingIconFile) {
      setUploadingIcon(true);
      const uploaded = await handleIconUpload(editingIconFile);
      setUploadingIcon(false);
      if (!uploaded) return;
      iconUrl = uploaded;
    }
    await updateSegmentMutation.mutateAsync({ id: segmentId, name: editingName, slug: editingSlug, icon: iconUrl });
  };

  const handleEditClick = (segment: SegmentItem) => {
    setEditingId(segment.id);
    setEditingName(segment.name);
    setEditingSlug(segment.slug);
    setEditingIcon(segment.icon || '');
    setEditingIconFile(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingSlug('');
    setEditingIcon('');
    setEditingIconFile(null);
  };

  const handleCreateSegment = async () => {
    if (!newSegmentForm.name || !newSegmentForm.slug) { showNotification('error', 'Nome e slug são obrigatórios'); return; }
    let iconUrl = newSegmentForm.icon;
    if (newSegmentIconFile) {
      setUploadingIcon(true);
      const uploaded = await handleIconUpload(newSegmentIconFile);
      setUploadingIcon(false);
      if (!uploaded) return;
      iconUrl = uploaded;
    }
    await createSegmentMutation.mutateAsync({ name: newSegmentForm.name, icon: iconUrl || undefined, slug: newSegmentForm.slug });
  };

  const handleDeleteSegment = async () => {
    if (!canExecuteConfirmedDelete(segmentPendingDeletion)) return;
    await deleteSegmentMutation.mutateAsync({ id: segmentPendingDeletion.id });
    setSegmentPendingDeletion(null);
  };

  const handleRemoveSegmentIcon = () => {
    if (!canExecuteConfirmedDelete(segmentIconPendingRemoval)) return;
    const draft = clearSegmentIconDraft();
    setEditingIcon(draft.icon);
    setEditingIconFile(draft.iconFile);
    setSegmentIconPendingRemoval(null);
  };

  // Montar lista ordenada
  const baseSegments: SegmentItem[] = (segments as SegmentItem[] | undefined) || [];
  const orderedSegments = localOrder
    ? localOrder.map((id) => baseSegments.find((s) => s.id === id)).filter(Boolean) as SegmentItem[]
    : baseSegments;
  const segmentMetrics = {
    total: baseSegments.length,
    withIcon: baseSegments.filter((segment) => Boolean(segment.icon)).length,
    withoutIcon: baseSegments.filter((segment) => !segment.icon).length,
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSegments.findIndex((s) => s.id === active.id);
    const newIndex = orderedSegments.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedSegments, oldIndex, newIndex);
    setLocalOrder(newOrder.map((s) => s.id));

    // Persistir no banco: enviar todas as posições novas
    setIsSavingOrder(true);
    try {
      // Usar reorder iterativamente para mover o item para a posição correta
      // Estratégia: enviar a sequência de swaps necessários
      // Mais simples: chamar uma mutation de bulk update de posições
      // Como só temos reorder (up/down), vamos usar um endpoint de bulk
      await saveBulkOrder(newOrder);
    } catch {
      showNotification('error', 'Erro ao salvar nova ordem');
      setLocalOrder(null);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const saveBulkOrder = async (ordered: SegmentItem[]) => {
    // Salvar posições em paralelo usando o endpoint de reorder
    // Fazemos isso atualizando cada segmento com sua nova posição via updateSegment
    // Para isso, vamos chamar o endpoint de update passando a nova posição
    // Como updateSegment não aceita position, vamos usar a abordagem de swaps sequenciais
    // Melhor: usar fetch direto para um endpoint de bulk
    const response = await fetch('/api/reorder-segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: ordered.map((s, i) => ({ id: s.id, position: i + 1 })) }),
    });
    if (!response.ok) throw new Error('Falha ao salvar ordem');
    refetch();
  };

  return (
    <AdminLayout>
    <div className={SEGMENTS_PAGE_CONTENT_CLASS}>
      {/* Notification */}
      {notification && (
        <div role={notification.type === 'error' ? 'alert' : 'status'} aria-live="polite" className={`fixed top-4 right-4 p-4 rounded-lg flex items-center gap-2 z-50 shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" aria-hidden="true" /> : <AlertCircle className="w-5 h-5" aria-hidden="true" />}
          {notification.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-600">Catálogo</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold text-slate-900">
              <span className="rounded-xl bg-pink-600 p-2 text-white shadow-sm shadow-pink-200"><Layers3 className="h-5 w-5" aria-hidden="true" /></span>
              Gerenciador de Segmentos
            </h1>
            <p className="mt-2 text-sm text-slate-600">Organize a ordem de exibição e os elementos visuais que ajudam clientes a descobrir o catálogo.</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700 text-white focus-visible:ring-pink-300">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Novo Segmento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Segmento</DialogTitle>
                <DialogDescription>Adicione um novo segmento de mercado ao catálogo.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); handleCreateSegment(); }}>
                <div>
                  <label htmlFor="new-segment-name" className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    id="new-segment-name"
                    value={newSegmentForm.name}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, name: e.target.value })}
                    placeholder="Ex: Adesivos"
                  />
                </div>
                <div>
                  <label htmlFor="new-segment-icon" className="block text-sm font-medium mb-1">Ícone (PNG ou WebP)</label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      id="new-segment-icon"
                      accept="image/png,image/webp"
                      onChange={(e) => { if (e.target.files?.[0]) setNewSegmentIconFile(e.target.files[0]); }}
                      className="flex-1"
                    />
                    {newSegmentIconFile && (
                      <span className="text-sm text-green-600 flex items-center">✓ {newSegmentIconFile.name}</span>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="new-segment-slug" className="block text-sm font-medium mb-1">Slug *</label>
                  <Input
                    id="new-segment-slug"
                    value={newSegmentForm.slug}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, slug: e.target.value })}
                    placeholder="Ex: adesivos"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="flex-1 border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800">Cancelar</Button>
                  <Button
                    type="submit"
                    disabled={createSegmentMutation.isPending || uploadingIcon}
                    aria-busy={createSegmentMutation.isPending || uploadingIcon}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white focus-visible:ring-pink-300"
                  >
                    {createSegmentMutation.isPending || uploadingIcon ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadingIcon ? 'Enviando ícone...' : 'Criando...'}</>
                    ) : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Indicadores dos segmentos">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Segmentos ativos</p><p className="mt-1 text-2xl font-bold text-slate-900">{segmentMetrics.total}</p><p className="mt-1 text-xs leading-5 text-slate-500">Disponíveis para organizar o catálogo</p></div><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><Layers3 className="h-5 w-5" aria-hidden="true" /></span></div>
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Com ícone</p><p className="mt-1 text-2xl font-bold text-slate-900">{segmentMetrics.withIcon}</p><p className="mt-1 text-xs leading-5 text-slate-500">Possuem identificação visual cadastrada</p></div><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><ImageIcon className="h-5 w-5" aria-hidden="true" /></span></div>
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Sem ícone</p><p className="mt-1 text-2xl font-bold text-slate-900">{segmentMetrics.withoutIcon}</p><p className="mt-1 text-xs leading-5 text-slate-500">Continuam disponíveis sem imagem configurada</p></div><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><ImageIcon className="h-5 w-5" aria-hidden="true" /></span></div>
        </section>

        {/* Saving indicator */}
        {isSavingOrder && (
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Salvando nova ordem...
          </div>
        )}

        {/* Drag hint */}
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
          <GripVertical className="w-4 h-4" aria-hidden="true" />
          Arraste pelo ícone ou use o teclado para reordenar
        </div>

        {/* Segments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando segmentos" />
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedSegments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
                      <th scope="col" className="px-3 py-3 w-10"><span className="sr-only">Reordenar</span></th>
                      <th scope="col" className="px-3 py-3 w-10">#</th>
                      <th scope="col" className="px-3 py-3">Nome</th>
                      <th scope="col" className="px-3 py-3">Ícone</th>
                      <th scope="col" className="px-3 py-3">Slug</th>
                      <th scope="col" className="px-3 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedSegments.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">Nenhum segmento cadastrado. Use “Novo Segmento” para organizar o catálogo.</td></tr> : orderedSegments.map((segment, index) => (
                      <SortableRow
                        key={segment.id}
                        segment={segment}
                        index={index}
                        editingId={editingId}
                        editingName={editingName}
                        editingSlug={editingSlug}
                        editingIcon={editingIcon}
                        editingIconFile={editingIconFile}
                        uploadingIcon={uploadingIcon}
                        onEdit={handleEditClick}
                        onSave={handleSaveSegment}
                        onCancel={handleCancel}
                        onDelete={setSegmentPendingDeletion}
                        onNameChange={setEditingName}
                        onSlugChange={setEditingSlug}
                        onIconFileChange={setEditingIconFile}
                        onRemoveIcon={setSegmentIconPendingRemoval}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
      </div>
      <AlertDialog open={Boolean(segmentPendingDeletion)} onOpenChange={(open) => !open && setSegmentPendingDeletion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmento?</AlertDialogTitle>
            <AlertDialogDescription>O segmento {segmentPendingDeletion?.name ? <strong>“{segmentPendingDeletion.name}”</strong> : "selecionado"} será removido do catálogo. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSegment} className="bg-red-600 text-white hover:bg-red-700">Excluir segmento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(segmentIconPendingRemoval)} onOpenChange={(open) => !open && setSegmentIconPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ícone do segmento?</AlertDialogTitle>
            <AlertDialogDescription>O ícone de {segmentIconPendingRemoval?.name ? <strong>“{segmentIconPendingRemoval.name}”</strong> : "este segmento"} será removido. O segmento continuará cadastrado e a alteração será aplicada ao salvar a edição.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSegmentIcon} className="bg-red-600 text-white hover:bg-red-700">Remover ícone</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
