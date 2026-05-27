'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, Edit2, Save, X, CheckCircle, AlertCircle, Camera, Plus } from 'lucide-react';
import { DeliveryOptionsManager, type DeliveryOptionData } from '@/components/products/DeliveryOptionsManager';

const SEGMENT_LABELS: Record<string, string> = {
  alimentacao: '🍔 Alimentação',
  beleza: '💄 Beleza & Saúde',
  saude: '💄 Beleza & Saúde',
  varejo: '🛍️ Varejo',
  servicos: '🔧 Serviços',
};

// Segmentos padrão como fallback
const DEFAULT_SEGMENTS = [
  { value: 'alimentacao', label: '🍔 Alimentação' },
  { value: 'beleza', label: '💄 Beleza & Saúde' },
  { value: 'varejo', label: '🛍️ Varejo' },
  { value: 'servicos', label: '🔧 Serviços' },
  { value: 'revendedores', label: '🏭 REVENDEDORES' },
];

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState<string>('');
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingSegment, setEditingSegment] = useState<string>('');
  const [editingImageUrl, setEditingImageUrl] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    price: '',
    segment: 'servicos',
    imageUrl: '',
    calculationType: 'unidade',
    pricePerM2: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
  });
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptionData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all products
  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();

  // Fetch all segments dynamically
  const { data: segmentsData, isLoading: segmentsLoading, error: segmentsError } = trpc.segments.getAll.useQuery();
  
  // Debug: log dados de segmentos
  useEffect(() => {
    console.log('Segments Query Status:', {
      isLoading: segmentsLoading,
      hasData: !!segmentsData,
      dataLength: segmentsData?.length || 0,
      error: segmentsError?.message,
      data: segmentsData,
    });
  }, [segmentsData, segmentsLoading, segmentsError]);
  
  // Converter segmentos da API para formato esperado com useMemo
  const SEGMENTS = useMemo(() => {
    console.log('SEGMENTS useMemo called with:', { segmentsData, length: segmentsData?.length });
    if (segmentsData && segmentsData.length > 0) {
      const mapped = segmentsData.map((seg: any) => ({
        value: seg.slug,
        label: `${seg.icon || '📦'} ${seg.name}`,
      }));
      console.log('Mapped SEGMENTS:', mapped);
      return mapped;
    }
    console.log('Using DEFAULT_SEGMENTS');
    return DEFAULT_SEGMENTS;
  }, [segmentsData]);

  // Update product mutation
  const updateProductMutation = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      showNotification('success', 'Produto atualizado com sucesso!');
      setEditingId(null);
      setEditingName('');
      setEditingDescription('');
      setEditingPrice('');
      setEditingSegment('');
      setEditingImageUrl('');
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao atualizar produto');
    },
  });

  // Create delivery option mutation (usado após criar produto)
  const createDeliveryOptionMutation = trpc.deliveryOptions.create.useMutation();

  // Create product mutation
  const createProductMutation = trpc.admin.createProduct.useMutation({
    onSuccess: async (newProduct: any) => {
      // Salvar os prazos de produção ativos para o novo produto
      const activeOptions = deliveryOptions.filter(opt => opt.isActive);
      if (activeOptions.length > 0 && newProduct?.id) {
        try {
          await Promise.all(
            activeOptions.map((opt, idx) =>
              createDeliveryOptionMutation.mutateAsync({
                productId: newProduct.id,
                name: opt.name,
                daysToDeliver: opt.daysToDeliver,
                pricePerM2: opt.pricePerM2,
                isActive: true,
                order: idx,
              })
            )
          );
        } catch (e) {
          console.error('Erro ao criar prazos:', e);
        }
      }
      showNotification('success', 'Produto criado com sucesso!');
      setIsCreatingProduct(false);
      setNewProductForm({
        name: '',
        description: '',
        price: '',
        segment: 'servicos',
        imageUrl: '',
        calculationType: 'unidade',
        pricePerM2: '',
        minWidth: '',
        maxWidth: '',
        minHeight: '',
        maxHeight: '',
      });
      setDeliveryOptions([]);
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao criar produto');
    },
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter products
  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = !selectedSegment || product.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const handleSaveProduct = async (productId: number) => {
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      showNotification('error', 'Preço inválido');
      return;
    }

    await updateProductMutation.mutateAsync({
      productId,
      name: editingName || undefined,
      description: editingDescription || undefined,
      price: editingPrice,
      segment: (editingSegment as any) || undefined,
      imageUrl: editingImageUrl || undefined,
    });
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    setEditingName(product.name);
    setEditingDescription(product.description || '');
    setEditingPrice(product.price);
    setEditingSegment(product.segment);
    setEditingImageUrl(product.imageUrl || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDescription('');
    setEditingPrice('');
    setEditingSegment('');
    setEditingImageUrl('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar formato de imagem
      const allowedFormats = ['image/jpeg', 'image/png'];
      if (!allowedFormats.includes(file.type)) {
        showNotification('error', 'Apenas formatos JPG e PNG são aceitos');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao fazer upload da foto');
        }
        
        const { url } = await response.json();
        setEditingImageUrl(url);
        showNotification('success', 'Foto enviada com sucesso! Clique em salvar para confirmar.');
      } catch (error) {
        showNotification('error', error instanceof Error ? error.message : 'Erro ao fazer upload da foto');
      }
    }
  };

  const handleCreatePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar formato de imagem
      const allowedFormats = ['image/jpeg', 'image/png'];
      if (!allowedFormats.includes(file.type)) {
        showNotification('error', 'Apenas formatos JPG e PNG são aceitos');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao fazer upload da foto');
        }
        
        const { url } = await response.json();
        setNewProductForm({ ...newProductForm, imageUrl: url });
        showNotification('success', 'Foto enviada com sucesso!');
      } catch (error) {
        showNotification('error', error instanceof Error ? error.message : 'Erro ao fazer upload da foto');
      }
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductForm.name || !newProductForm.price) {
      showNotification('error', 'Nome e preço são obrigatórios');
      return;
    }

    if (isNaN(parseFloat(newProductForm.price))) {
      showNotification('error', 'Preço inválido');
      return;
    }

    await createProductMutation.mutateAsync({
      name: newProductForm.name,
      description: newProductForm.description || undefined,
      price: newProductForm.price,
      segment: newProductForm.segment as any,
      imageUrl: newProductForm.imageUrl || undefined,
      calculationType: (newProductForm as any).calculationType || 'unidade',
      pricePerM2: (newProductForm as any).pricePerM2 || undefined,
      minWidth: (newProductForm as any).minWidth ? (newProductForm as any).minWidth : undefined,
      maxWidth: (newProductForm as any).maxWidth ? (newProductForm as any).maxWidth : undefined,
      minHeight: (newProductForm as any).minHeight ? (newProductForm as any).minHeight : undefined,
      maxHeight: (newProductForm as any).maxHeight ? (newProductForm as any).maxHeight : undefined,
    });
  };

  return (
    <div className="bg-gray-50 p-8">
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

      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel Admin</h1>
            <p className="text-gray-600">Gerenciamento de Preços e Catálogos</p>
          </div>
          <Dialog open={isCreatingProduct} onOpenChange={setIsCreatingProduct}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Produto</DialogTitle>
                <DialogDescription>Preencha os dados do novo produto para adicioná-lo ao catálogo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <Input
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    placeholder="Descrição do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Cobrança</label>
                  <Select value={(newProductForm as any).calculationType || 'unidade'} onValueChange={(val) => setNewProductForm({ ...newProductForm, calculationType: val } as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidade">Unidade</SelectItem>
                      <SelectItem value="m2">m² (Metro Quadrado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newProductForm as any).calculationType === 'm2' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço por m²</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(newProductForm as any).pricePerM2}
                        onChange={(e) => setNewProductForm({ ...newProductForm, pricePerM2: e.target.value } as any)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Largura Mín (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(newProductForm as any).minWidth}
                          onChange={(e) => setNewProductForm({ ...newProductForm, minWidth: e.target.value } as any)}
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Largura Máx (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(newProductForm as any).maxWidth}
                          onChange={(e) => setNewProductForm({ ...newProductForm, maxWidth: e.target.value } as any)}
                          placeholder="10.0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Altura Mín (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(newProductForm as any).minHeight}
                          onChange={(e) => setNewProductForm({ ...newProductForm, minHeight: e.target.value } as any)}
                          placeholder="1.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Altura Máx (m)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(newProductForm as any).maxHeight}
                          onChange={(e) => setNewProductForm({ ...newProductForm, maxHeight: e.target.value } as any)}
                          placeholder="10.0"
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* Prazos de Produção — mesmo componente do Editar Produto */}
                <DeliveryOptionsManager
                  calculationType={(newProductForm as any).calculationType || 'unidade'}
                  onChange={setDeliveryOptions}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Segmento</label>
                  <Select value={newProductForm.segment} onValueChange={(val) => setNewProductForm({ ...newProductForm, segment: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((seg) => (
                        <SelectItem key={seg.value} value={seg.value}>
                          {seg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Foto</label>
                  <button
                    onClick={() => createFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Camera className="w-4 h-4" />
                    {newProductForm.imageUrl ? 'Mudar foto' : 'Selecionar foto'}
                  </button>
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleCreatePhotoUpload}
                    className="hidden"
                  />
                  {newProductForm.imageUrl && (
                    <p className="text-sm text-gray-600 mt-1">Selecionado: {newProductForm.imageUrl}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingProduct(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={createProductMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {createProductMutation.isPending ? (
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Total de Produtos</p>
            <p className="text-3xl font-bold">{products?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Segmentos</p>
            <p className="text-3xl font-bold">5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm mb-2">Produtos Filtrados</p>
            <p className="text-3xl font-bold">{filteredProducts.length}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Buscar Produto</label>
              <Input
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Segmento</label>
              <Select value={selectedSegment || 'all'} onValueChange={(val) => setSelectedSegment(val === 'all' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os segmentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os segmentos</SelectItem>
                  <SelectItem value="alimentacao">🍔 Alimentação</SelectItem>
                  <SelectItem value="beleza">💄 Beleza & Saúde</SelectItem>
                  <SelectItem value="varejo">🛍️ Varejo</SelectItem>
                  <SelectItem value="servicos">🔧 Serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSegment('');
            }}
          >
            Limpar Filtros
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {editingId === product.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        product.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <Select value={editingSegment} onValueChange={setEditingSegment}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEGMENTS.map((seg) => (
                              <SelectItem key={seg.value} value={seg.value}>
                                {seg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                          {SEGMENT_LABELS[product.segment] || product.segment}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                      {editingId === product.id ? (
                        <Input
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        product.description || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          className="w-full"
                          type="number"
                          step="0.01"
                        />
                      ) : (
                        `R$ ${parseFloat(product.price).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-1 p-1 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-gray-600 text-sm">
                          {product.imageUrl ? '✓ Sim' : '-'}
                        </span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveProduct(product.id)}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
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
