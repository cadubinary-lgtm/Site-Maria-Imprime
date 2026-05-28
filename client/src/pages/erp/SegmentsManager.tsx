import AdminLayout from "@/components/AdminLayout";
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Edit2, Save, X, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function SegmentsManager() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSegmentForm, setNewSegmentForm] = useState({
    name: '',
    icon: '',
    slug: '',
  });

  // Fetch all segments
  const { data: segments, isLoading, refetch } = trpc.segments.getAll.useQuery();

  // Update segment mutation
  const updateSegmentMutation = trpc.segments.update.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento atualizado com sucesso!');
      setEditingId(null);
      setEditingName('');
      setEditingIcon('');
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao atualizar segmento');
    },
  });

  // Create segment mutation
  const createSegmentMutation = trpc.segments.create.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento criado com sucesso!');
      setIsCreating(false);
      setNewSegmentForm({
        name: '',
        icon: '',
        slug: '',
      });
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao criar segmento');
    },
  });

  // Delete segment mutation
  const deleteSegmentMutation = trpc.segments.delete.useMutation({
    onSuccess: () => {
      showNotification('success', 'Segmento deletado com sucesso!');
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao deletar segmento');
    },
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveSegment = async (segmentId: number | string) => {
    if (!editingName) {
      showNotification('error', 'Nome do segmento é obrigatório');
      return;
    }

    await updateSegmentMutation.mutateAsync({
      id: Number(segmentId),
      name: editingName,
      icon: editingIcon,
    });
  };

  const handleEditClick = (segment: any) => {
    setEditingId(segment.id);
    setEditingName(segment.name);
    setEditingIcon(segment.icon || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingIcon('');
  };

  const handleCreateSegment = async () => {
    if (!newSegmentForm.name || !newSegmentForm.slug) {
      showNotification('error', 'Nome e slug são obrigatórios');
      return;
    }

    await createSegmentMutation.mutateAsync({
      name: newSegmentForm.name,
      icon: newSegmentForm.icon || undefined,
      slug: newSegmentForm.slug,
    });
  };

  const handleDeleteSegment = async (segmentId: number | string) => {
    if (confirm('Tem certeza que deseja deletar este segmento?')) {
      await deleteSegmentMutation.mutateAsync({ id: Number(segmentId) });
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciador de Segmentos</h1>
            <p className="text-gray-600">Crie e edite os segmentos de negócio</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Segmento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Segmento</DialogTitle>
                <DialogDescription>Adicione um novo segmento de mercado ao catálogo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    value={newSegmentForm.name}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, name: e.target.value })}
                    placeholder="Ex: Alimentação"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ícone/Emoji</label>
                  <Input
                    value={newSegmentForm.icon}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, icon: e.target.value })}
                    placeholder="Ex: 🍔"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <Input
                    value={newSegmentForm.slug}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, slug: e.target.value })}
                    placeholder="Ex: alimentacao"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateSegment}
                    disabled={createSegmentMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {createSegmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Segments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(segments || []).map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">
                      {editingId === segment.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        segment.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === segment.id ? (
                        <Input
                          value={editingIcon}
                          onChange={(e) => setEditingIcon(e.target.value)}
                          className="w-20"
                          maxLength={2}
                        />
                      ) : (
                        <span className="text-2xl">{segment.icon || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {segment.slug}
                    </TableCell>
                    <TableCell>
                      {editingId === segment.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveSegment(segment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancel}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(segment)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSegment(segment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
