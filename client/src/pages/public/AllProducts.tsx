import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getProductPrice } from "@/lib/productPrice";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { PublicProductCard } from "@/components/products/PublicProductCard";

export default function AllProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const { customer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";

  // Rolar para o topo ao montar a página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Carregar segmentos dinamicamente da API
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.productSegments.getAllSegments.useQuery();

  // Mapear segmentos para formato esperado
  const segments = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.id,
      label: `${seg.icon || '📦'} ${seg.name}`,
    }));
  }, [segmentsData]);

  const { data: products, isLoading } = trpc.products.getAll.useQuery();
  const { data: segmentProducts, isLoading: segmentProductsLoading } = trpc.productSegments.getProductsBySegment.useQuery(
    selectedSegmentId || 0,
    { enabled: selectedSegmentId !== null },
  );

  const filteredAndSortedProducts = useMemo(() => {
    const productsToFilter = selectedSegmentId === null ? products : segmentProducts;
    if (!productsToFilter) return [];

    let filtered = productsToFilter.filter((product) => Boolean(product.isActive));

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === 'price') {
      filtered = [...filtered].sort((a, b) => getProductPrice(a, priceAudience).value - getProductPrice(b, priceAudience).value);
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, segmentProducts, searchTerm, selectedSegmentId, sortBy, priceAudience]);



  if (isLoading || (selectedSegmentId !== null && segmentProductsLoading)) {
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-foreground">Buscar por segmento</h2>
                <p className="mt-1 text-xs text-gray-400">Escolha uma categoria para filtrar os produtos.</p>
              </div>
              <nav aria-label="Filtrar produtos por segmento" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <Button
                  type="button"
                  variant={selectedSegmentId === null ? 'default' : 'outline'}
                  onClick={() => setSelectedSegmentId(null)}
                  className={`h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm ${selectedSegmentId === null ? 'bg-pink-600 hover:bg-pink-700' : 'hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700'}`}
                >
                  Todos os segmentos
                </Button>
                {segmentsLoading ? (
                  <div className="col-span-full flex items-center gap-2 px-2 py-3 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando segmentos...
                  </div>
                ) : segments.map((seg) => (
                  <Button
                    key={seg.id}
                    type="button"
                    variant={selectedSegmentId === seg.id ? 'default' : 'outline'}
                    onClick={() => setSelectedSegmentId(seg.id)}
                    className={`h-auto justify-start whitespace-normal px-3 py-2 text-left text-sm ${selectedSegmentId === seg.id ? 'bg-pink-600 hover:bg-pink-700' : 'hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700'}`}
                  >
                    {seg.label}
                  </Button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Buscar
                  </label>
                  <Input
                    placeholder="Nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price')}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                  >
                    <option value="name">Nome</option>
                    <option value="price">Preço</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-6 text-sm text-gray-400">
              Mostrando {filteredAndSortedProducts.length} de {products?.length || 0} produtos
            </div>

            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedProducts.map((product) => (
                  <PublicProductCard key={product.id} product={product} priceAudience={priceAudience} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="mb-4 text-gray-400">Nenhum produto encontrado</p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSegmentId(null);
                  }}
                  variant="outline"
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
