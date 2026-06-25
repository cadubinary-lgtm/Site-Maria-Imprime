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
  const [editingSlug, setEditingSlug] = useState('');
  const [editingIcon, setEditingIcon] = useState('');
  const [editingIconFile, setEditingIconFile] = useState<File | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSegmentForm, setNewSegmentForm] = useState({
    name: '',
    icon: '',
    slug: '',
  });
  const [newSegmentIconFile, setNewSegmentIconFile] = useState<File | null>(null);

  // Fetch all segments
  const { data: segments, isLoading, refetch } = trpc.segments.getAll.useQuery();

  // Update segment mutation
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
      setNewSegmentIconFile(null);
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

  const handleIconUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload-segment-icon', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        showNotification('error', error.error || 'Erro ao fazer upload do ícone');
        return null;
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      showNotification('error', 'Erro ao fazer upload do ícone');
      return null;
    }
  };

  const handleSaveSegment = async (segmentId: number | string) => {
    if (!editingName) {
      showNotification('error', 'Nome do segmento é obrigatório');
      return;
    }

    let iconUrl = editingIcon;
    
    if (editingIconFile) {
      setUploadingIcon(true);
      const uploadedUrl = await handleIconUpload(editingIconFile);
      setUploadingIcon(false);
      
      if (!uploadedUrl) return;
      iconUrl = uploadedUrl;
    }

    await updateSegmentMutation.mutateAsync({
      id: Number(segmentId),
      name: editingName,
      slug: editingSlug,
      icon: iconUrl,
    });
  };

  const handleEditClick = (segment: any) => {
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
    if (!newSegmentForm.name || !newSegmentForm.slug) {
      showNotification('error', 'Nome e slug são obrigatórios');
      return;
    }

    let iconUrl = newSegmentForm.icon;
    
    if (newSegmentIconFile) {
      setUploadingIcon(true);
      const uploadedUrl = await handleIconUpload(newSegmentIconFile);
      setUploadingIcon(false);
      
      if (!uploadedUrl) return;
      iconUrl = uploadedUrl;
    }

    await createSegmentMutation.mutateAsync({
      name: newSegmentForm.name,
      icon: iconUrl || undefined,
      slug: newSegmentForm.slug,
    });
  };

  const handleDeleteSegment = async (segmentId: number | string) => {
    if (confirm('Tem certeza que deseja deletar este segmento?')) {
      await deleteSegmentMutation.mutateAsync({ id: Number(segmentId) });
    }
  };

  return (
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
                    placeholder="Ex: Adesivos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ícone (PNG ou WebP)</label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewSegmentIconFile(e.target.files[0]);
                        }
                      }}
                      className="flex-1"
                    />
                    {newSegmentIconFile && (
                      <span className="text-sm text-green-600 flex items-center">
                        ✓ {newSegmentIconFile.name}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <Input
                    value={newSegmentForm.slug}
                    onChange={(e) => setNewSegmentForm({ ...newSegmentForm, slug: e.target.value })}
                    placeholder="Ex: adesivos"
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
                    disabled={createSegmentMutation.isPending || uploadingIcon}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {createSegmentMutation.isPending || uploadingIcon ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploadingIcon ? 'Enviando ícone...' : 'Criando...'}
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
                        <div className="flex gap-2 items-center">
                          <Input
                            type="file"
                            accept="image/png,image/webp"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setEditingIconFile(e.target.files[0]);
                              }
                            }}
                            className="flex-1 h-8"
                          />
                          {(editingIconFile || editingIcon) && (
                            <img
                              src={editingIconFile ? URL.createObjectURL(editingIconFile) : editingIcon}
                              alt="preview"
                              className="w-8 h-8 object-contain"
                            />
                          )}
                        </div>
                      ) : segment.icon ? (
                        <img
                          src={segment.icon}
                          alt={segment.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {editingId === segment.id ? (
                        <Input
                          value={editingSlug}
                          onChange={(e) => setEditingSlug(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        segment.slug
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === segment.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveSegment(segment.id)}
                            disabled={uploadingIcon}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {uploadingIcon ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
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
  );
}
