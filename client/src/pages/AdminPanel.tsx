import React, { useState, useMemo } from 'react';
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
// import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit2, Save, X } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  alimentacao: '🍔 Alimentação',
  beleza: '💄 Beleza & Saúde',
  saude: '💄 Beleza & Saúde',
  varejo: '🛍️ Varejo',
  servicos: '🔧 Serviços',
};

export default function AdminPanel() {
  // const { toast } = useToast();
  const toast = {
    title: (obj: any) => console.log(obj),
  } as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Fetch all products
  const { data: products, isLoading, refetch } = trpc.products.getAll.useQuery();

  // Update product mutation
  const updateProductMutation = trpc.products.updatePrice.useMutation({
    onSuccess: () => {
      console.log('Preço atualizado com sucesso!');
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      console.error('Erro ao atualizar preço:', error.message);
    },
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSegment =
        !selectedSegment || product.segment === selectedSegment;

      return matchesSearch && matchesSegment;
    });
  }, [products, searchTerm, selectedSegment]);

  const handleSavePrice = async (productId: number) => {
    if (!editingPrice || isNaN(parseFloat(editingPrice))) {
      console.error('Preço inválido');
      return;
    }

    await updateProductMutation.mutateAsync({
      productId,
      price: editingPrice,
    });
  };

  const handleEditPrice = (productId: number, currentPrice: string) => {
    setEditingId(productId);
    setEditingPrice(currentPrice);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingPrice('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de Preços e Catálogos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Total de Produtos</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {products?.length || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Segmentos</div>
            <div className="text-3xl font-bold text-orange-500 mt-2">5</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium">Produtos Filtrados</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {filteredProducts.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Produto
              </label>
              <Input
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Segmento
              </label>
              <Select value={selectedSegment || "all"} onValueChange={(val) => setSelectedSegment(val === "all" ? "" : val)}>
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

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSegment('');
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Produto</TableHead>
                  <TableHead className="font-semibold">Segmento</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold text-right">Preço</TableHead>
                  <TableHead className="font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {SEGMENT_LABELS[product.segment] || product.segment}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                        {product.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-gray-600">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            R$ {parseFloat(product.price).toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingId === product.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSavePrice(product.id)}
                              disabled={updateProductMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={updateProductMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEditPrice(product.id, product.price)
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Exibindo {filteredProducts.length} de {products?.length || 0} produtos</p>
        </div>
      </div>
    </div>
  );
}
