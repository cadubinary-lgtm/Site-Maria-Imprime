import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatProductPrice } from "@/lib/productPrice";
import { Slider } from "@/components/ui/slider";
import { ProductTagBadges } from "@/components/products/ProductTagBadges";

const ITEMS_PER_PAGE = 12;

export default function Catalog() {
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
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

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

  // Filtrar produtos por preço e termo de busca
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const price = parseFloat(p.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesPrice && matchesSearch && p.isActive;
    });
  }, [products, priceRange, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddToCart = (productName: string) => {
    setCartCount((c) => c + 1);
  };

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
          <div className="flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-lg border border-pink-100">
            <ShoppingCart className="w-5 h-5 text-pink-500" />
            <span className="font-semibold text-pink-600">{cartCount} itens</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com Filtros */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* Segmentos */}
                <div className="space-y-3">
                  <Label className="font-semibold text-gray-900">Segmento</Label>
                  <div className="space-y-2">
                    {segments.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum segmento disponível</p>
                    ) : (
                      segments.map((seg) => (
                        <button
                          key={seg.id}
                          onClick={() => handleSegmentChange(seg.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                            activeSegment === seg.id
                              ? "bg-pink-600 text-white shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-pink-50 hover:text-pink-700 border border-gray-200"
                          }`}
                        >
                          {seg.icon && (
                            <img src={seg.icon} alt={seg.label} className="w-5 h-5 flex-shrink-0" />
                          )}
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

                {/* Faixa de Preço */}
                <div className="space-y-3">
                  <Label className="font-semibold text-gray-900">Faixa de Preço</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>R$ {priceRange[0]}</span>
                    <span>R$ {priceRange[1]}</span>
                  </div>
                </div>

                {/* Contagem */}
                <div className="bg-pink-50 p-3 rounded-lg text-sm text-pink-700 border border-pink-100">
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
                    onClick={() => {
                      setSearchTerm("");
                      setPriceRange([0, 1000]);
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
                    <Card key={product.id} className="group hover:shadow-lg transition border-gray-200 overflow-hidden">
                      <Link href={`/produto/${product.id}`}>
                        {/* Imagem sangrada no topo */}
                        <div className="relative aspect-square bg-gray-50 overflow-hidden rounded-t-xl -mt-6 -mx-6">
                          <ProductTagBadges tags={(product as any).tags} tagPosition={(product as any).tagPosition} />
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-sm">Sem imagem</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-base mb-1 text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-xs text-gray-500 mb-2">
                            {product.category}
                            {product.subcategory && ` • ${product.subcategory}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description || "Sem descrição"}
                        </p>

                        {/* Tipo de Cálculo */}
                        <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100">
                          <span className="font-semibold">Unidade:</span>{" "}
                          {product.calculationType === "m2"
                            ? "m²"
                            : product.calculationType === "metro_linear"
                              ? "Metro Linear"
                              : product.calculationType === "pacote"
                                ? "Pacote"
                                : "Unidade"}
                        </div>

                        {/* Preço e Botões */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-pink-600">
                            {formatProductPrice(product)}
                          </span>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-2">
                          <Link href={`/produto/${product.id}`} className="flex-1">
                            <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                              Ver Detalhes
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddToCart(product.name)}
                            className="border-pink-500 text-pink-500 hover:bg-pink-50"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className={currentPage === i + 1 ? "bg-pink-600 hover:bg-pink-700" : ""}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
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
