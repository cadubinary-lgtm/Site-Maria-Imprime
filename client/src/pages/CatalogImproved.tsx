import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

const ITEMS_PER_PAGE = 12;

export default function CatalogImproved() {
  // Carregar segmentos dinamicamente da API
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.segments.getAll.useQuery();

  // Mapear segmentos para formato esperado
  const segments = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.slug,
      label: `${seg.icon || "📦"} ${seg.name}`,
    }));
  }, [segmentsData]);

  // Definir primeiro segmento como padrão
  const defaultSegment = useMemo(() => {
    return segments.length > 0 ? segments[0].id : "alimentacao";
  }, [segments]);

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Usar segmento padrão se nenhum foi selecionado
  const activeSegment = selectedSegment || defaultSegment;

  const { data: products, isLoading } = trpc.products.getBySegment.useQuery(
    { segment: activeSegment },
    { enabled: !!activeSegment }
  );

  // Filtrar produtos por preço e termo de busca
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((p) => {
      const price = parseFloat(p.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPrice && matchesSearch;
    });
  }, [products, priceRange, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddToCart = (productName: string) => {
    setCartCount(c => c + 1);
    toast.success(`${productName} adicionado ao carrinho!`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header com Carrinho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Produtos</h1>
          <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-orange-600">{cartCount} itens</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com Filtros */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200">
              <CardContent className="p-6 space-y-6">
                {/* Segmentos */}
                <div className="space-y-3">
                  <Label className="font-semibold text-gray-900">Segmento</Label>
                  <div className="space-y-2">
                    {segmentsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      </div>
                    ) : segments.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum segmento disponível</p>
                    ) : (
                      segments.map((seg) => (
                        <Button
                          key={seg.id}
                          variant={activeSegment === seg.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedSegment(seg.id);
                            setCurrentPage(1);
                          }}
                        >
                          {seg.label}
                        </Button>
                      ))
                    )}
                  </div>
                </div>

                {/* Busca */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-gray-900">Buscar Produto</Label>
                  <Input
                    id="search"
                    placeholder="Nome do produto..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border-gray-300"
                  />
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

                {/* Informações */}
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 border border-blue-200">
                  <p>
                    <strong>{filteredProducts.length}</strong> produtos encontrados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Produtos */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Nenhum produto encontrado com os filtros selecionados.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paginatedProducts.map((product) => (
                    <Card key={product.id} className="hover:shadow-lg transition border-gray-200">
                      <CardContent className="p-4">
                        {/* Imagem */}
                        <div className="w-full h-40 bg-gray-200 rounded mb-4 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Sem imagem
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <h3 className="font-semibold text-base mb-1 text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Preço */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-orange-500">
                            R$ {parseFloat(product.price).toFixed(2)}
                          </span>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-2">
                          <Link href={`/produto/${product.id}`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              Ver Detalhes
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddToCart(product.name)}
                            className="border-orange-500 text-orange-500 hover:bg-orange-50"
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

                {/* Info de Paginação */}
                <div className="text-center text-sm text-gray-600 mt-4">
                  Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} de{" "}
                  {filteredProducts.length} produtos
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
