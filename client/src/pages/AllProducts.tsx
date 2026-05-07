import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function AllProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');

  const { data: products, isLoading } = trpc.products.getAll.useQuery();

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Filter by segment
    if (selectedSegment) {
      filtered = filtered.filter((p) => p.segment === selectedSegment);
    }

    // Sort
    if (sortBy === 'price') {
      filtered = [...filtered].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, searchTerm, selectedSegment, sortBy]);

  const segments = [
    { value: 'alimentacao', label: '🍔 Alimentação' },
    { value: 'beleza', label: '💄 Beleza & Saúde' },
    { value: 'varejo', label: '🛍️ Varejo' },
    { value: 'servicos', label: '🔧 Serviços' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Todos os Produtos</h1>
        <p className="text-gray-400 mb-8">
          Encontre a solução perfeita para seu negócio
        </p>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Buscar
              </label>
              <Input
                placeholder="Nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Segment Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Segmento
              </label>
              <select
                value={selectedSegment || ''}
                onChange={(e) => setSelectedSegment(e.target.value || null)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="">Todos os segmentos</option>
                {segments.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="name">Nome</option>
                <option value="price">Preço</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {segments.map((seg) => (
              <Button
                key={seg.value}
                variant={selectedSegment === seg.value ? 'default' : 'outline'}
                onClick={() =>
                  setSelectedSegment(selectedSegment === seg.value ? null : seg.value)
                }
                className={
                  selectedSegment === seg.value
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : ''
                }
              >
                {seg.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 text-sm text-gray-400">
          Mostrando {filteredAndSortedProducts.length} de {products?.length || 0} produtos
        </div>

        {/* Products Grid */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <Link key={product.id} href={`/produto/${product.id}`}>
                <a className="block group">
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {product.imageUrl && (
                      <div className="w-full h-48 bg-gray-800 overflow-hidden">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-orange-500">
                          R$ {product.price}
                        </span>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Nenhum produto encontrado</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedSegment(null);
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
