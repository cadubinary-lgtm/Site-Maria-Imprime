import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const ITEMS_PER_PAGE = 12;

export default function Catalog() {
  // Estados
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // Carregar segmentos dinamicamente
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.segments.getAll.useQuery();

  // Mapear segmentos para formato esperado (usando ID numérico)
  const segments = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.id, // Usar ID numérico em vez de slug
      label: `${seg.icon || "📦"} ${seg.name}`,
    }));
  }, [segmentsData]);

  // Carregar todos os produtos
  const { data: products, isLoading } = trpc.products.getAll.useQuery();

  // Definir primeiro segmento como padrão
  const defaultSegment = useMemo(() => {
    return segments.length > 0 ? segments[0].id : 1;
  }, [segments]);

  // Usar segmento padrão se nenhum foi selecionado
  const activeSegment = selectedSegment || defaultSegment;

  // Filtrar produtos por preço e termo de busca
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((p: any) => {
      const price = parseFloat(p.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesPrice && matchesSearch && p.isActive;
    });
  }, [products, priceRange, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddToCart = (productName: string) => {
    setCartCount(c => c + 1);
    // Toast feedback would go here
  };

  if (segmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          {/* Sidebar com Filtros - Coluna Esquerda */}
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
                      segments.map((seg: any) => (
                        <Button
                          key={seg.id}
                          variant={activeSegment === seg.id ? "default" : "outline"}
                          className={`w-full justify-start ${
                            activeSegment === seg.id
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
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

                {/* Informações */}
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 border border-blue-200">
                  <p>
                    <strong>{filteredProducts.length}</strong> produtos encontrados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de Produtos - Coluna Central e Direita */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
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
                  {paginatedProducts.map((product: any) => (
                    <Card key={product.id} className="hover:shadow-lg transition border-gray-200 overflow-hidden">
                      <Link href={`/produto/${product.id}`}>
                        {/* Imagem */}
                        <div className="relative h-40 bg-gray-200 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                              <span className="text-gray-500">Sem imagem</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <CardContent className="p-4">
                        {/* Info */}
                        <h3 className="font-semibold text-base mb-1 text-gray-900 line-clamp-2">{product.name}</h3>
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
                        <div className="mb-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
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
                          className={currentPage === i + 1 ? "bg-orange-500 hover:bg-orange-600" : ""}
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
