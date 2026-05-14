import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Carregar todos os produtos
  const { data: products, isLoading } = trpc.products.getAll.useQuery();

  // Carregar segmentos
  const { data: segments } = trpc.segments.getAll.useQuery();

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesSegment = selectedSegment === "all" || product.segment === selectedSegment;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesSegment && matchesCategory && product.isActive;
    });
  }, [products, searchTerm, selectedSegment, selectedCategory]);

  // Obter categorias únicas
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Catálogo de Produtos</h1>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Segmento */}
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Segmentos</SelectItem>
                {segments?.map((segment) => (
                  <SelectItem key={segment.id} value={segment.slug}>
                    {segment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Categoria */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Produtos */}
      <div className="container mx-auto px-4 py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/produto/${product.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  {/* Imagem */}
                  <div className="relative h-48 bg-slate-200 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-300">
                        <span className="text-slate-500">Sem imagem</span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <CardDescription className="text-xs text-slate-500">
                        {product.category}
                        {product.subcategory && ` • ${product.subcategory}`}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pb-4">
                    {/* Descrição */}
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {product.description || "Sem descrição"}
                    </p>

                    {/* Tipo de Cálculo */}
                    <div className="mb-4 p-2 bg-slate-100 rounded text-xs text-slate-700">
                      <span className="font-semibold">Unidade:</span>{" "}
                      {product.calculationType === "m2"
                        ? "m²"
                        : product.calculationType === "metro_linear"
                          ? "Metro Linear"
                          : product.calculationType === "pacote"
                            ? "Pacote"
                            : "Unidade"}
                    </div>

                    {/* Preço e Botão */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-red-600">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
