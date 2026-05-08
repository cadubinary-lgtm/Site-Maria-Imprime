'use client';

import { useState } from 'react';
import { trpc } from '../lib/trpc';
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
import { Loader2, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  alimentacao: '🍔 Alimentação',
  beleza: '💄 Beleza & Saúde',
  saude: '💄 Beleza & Saúde',
  varejo: '🛍️ Varejo',
  servicos: '🔧 Serviços',
};

export default function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch all products
  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();

  // Update product mutation
  const updateProductMutation = trpc.products.updatePrice.useMutation({
    onSuccess: () => {
      showNotification('success', 'Preço atualizado com sucesso!');
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      showNotification('error', error.message || 'Erro ao atualizar preço');
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

  const handleSavePrice = async (productId: number) => {
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      showNotification('error', 'Preço inválido');
      return;
    }

    await updateProductMutation.mutateAsync({
      productId,
      price: editingPrice,
    });
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-600 mt-2">Gerenciamento de Preços e Catálogos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total de Produtos</p>
            <p className="text-3xl font-bold text-gray-900">{products?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Segmentos</p>
            <p className="text-3xl font-bold text-orange-600">5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Produtos Filtrados</p>
            <p className="text-3xl font-bold text-gray-900">{filteredProducts.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Produto
              </label>
              <Input
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Segmento
              </label>
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
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Produto</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                        {SEGMENT_LABELS[product.segment] || product.segment}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                      {product.description || '-'}
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editingPrice}
                          onChange={(e) => setEditingPrice(e.target.value)}
                          className="w-24"
                          step="0.01"
                        />
                      ) : (
                        <span>R$ {parseFloat(product.price).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSavePrice(product.id)}
                            disabled={updateProductMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(product.id);
                            setEditingPrice(product.price);
                          }}
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
