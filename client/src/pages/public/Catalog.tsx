import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { PublicProductCard } from "@/components/products/PublicProductCard";

const ITEMS_PER_PAGE = 12;

export default function Catalog() {
  const { customer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";
  // Ler segmentId da URL (ex: /catalogo?segmentId=3)
  const urlSegmentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("segmentId");
    return id ? parseInt(id, 10) : null;
  }, []);

  // Carregar segmentos dinamicamente
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.productSegments.getAllSegments.useQuery();

  // Mapear segmentos para formato esperado (usando ID numérico)
  const segments = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.id,
      label: seg.name,
      icon: seg.icon,
    }));
  }, [segmentsData]);

  // Definir segmento inicial: URL param > primeiro segmento disponível
  const [selectedSegment, setSelectedSegment] = useState<number | null>(urlSegmentId);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const { openCart } = useCartDrawer();
  const { data: cartCount = 0 } = trpc.cart.getCount.useQuery();

  // Quando os segmentos carregarem, se não há seleção, usar o primeiro
  useEffect(() => {
    if (segments.length > 0 && selectedSegment === null) {
      setSelectedSegment(segments[0].id);
    }
  }, [segments, selectedSegment]);

  // Segmento ativo (nunca null após carregamento)
  const activeSegment = selectedSegment ?? (segments.length > 0 ? segments[0].id : null);

  // Nome do segmento ativo para exibição no título
  const activeSegmentName = useMemo(() => {
    if (!activeSegment || segments.length === 0) return null;
    return segments.find((s) => s.id === activeSegment)?.label ?? null;
  }, [activeSegment, segments]);

  // Carregar produtos do segmento ativo (usando novo sistema many-to-many)
  const { data: products, isLoading } = trpc.productSegments.getProductsBySegment.useQuery(
    activeSegment as number,
    { enabled: !!activeSegment }
  );

  // Filtrar produtos apenas pelo termo de busca, sem limitar a faixa de preço.
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesSearch && p.isActive;
    });
  }, [products, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSegmentChange = (segId: number) => {
    setSelectedSegment(segId);
    setCurrentPage(1);
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.set("segmentId", String(segId));
    window.history.replaceState({}, "", url.toString());
  };

  if (segmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeSegmentName ? activeSegmentName : "Catálogo de Produtos"}
            </h1>
            {activeSegmentName && (
              <p className="text-gray-500 text-sm mt-1">
                Produtos disponíveis em <span className="font-semibold text-pink-600">{activeSegmentName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Abrir carrinho com ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
            className="flex items-center gap-2 rounded-lg border border-pink-100 bg-pink-50 px-4 py-2 transition-colors hover:bg-pink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
          >
            <ShoppingCart className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-pink-600">{cartCount} itens</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com Filtros */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 lg:sticky lg:top-4">
              <CardContent className="px-6 pb-6 pt-3 space-y-6">
                {/* Segmentos */}
                <div className="space-y-2">
                  <div className="space-y-2">
                    {segments.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum segmento disponível</p>
                    ) : (
                      segments.map((seg) => (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleSegmentChange(seg.id)}
                          aria-pressed={activeSegment === seg.id}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                            activeSegment === seg.id
                              ? "bg-pink-600 text-white shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-pink-50 hover:text-pink-700 border border-gray-200"
                          }`}
                        >
                          <span className="truncate">{seg.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Busca */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-gray-900">Buscar Produto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Nome do produto..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 border-gray-300"
                    />
                  </div>
                </div>

                {/* Contagem */}
                <div className="bg-pink-50 p-3 rounded-lg text-sm text-pink-700 border border-pink-100" aria-live="polite">
                  <p>
                    <strong>{filteredProducts.length}</strong> produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Produtos */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">Nenhum produto encontrado com os filtros selecionados.</p>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid de Produtos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paginatedProducts.map((product) => (
                    <PublicProductCard key={product.id} product={product} priceAudience={priceAudience} />
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i + 1}
                          type="button"
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          aria-label={`Ir para página ${i + 1}`}
                          aria-current={currentPage === i + 1 ? "page" : undefined}
                          className={currentPage === i + 1 ? "bg-pink-600 hover:bg-pink-700" : ""}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
