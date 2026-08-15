import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Grid3x3, Layers } from "lucide-react";
import { formatProductPrice } from "@/lib/productPrice";
import { Link } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function SearchResults() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { customer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";

  // Extrair query da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    setSearchQuery(q);
  }, []);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const totalResults = (results?.products.length || 0) +
    (results?.categories.length || 0) +
    (results?.materials.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resultados da Busca
          </h1>
          <p className="text-gray-600">
            {searchQuery && (
              <>
                Buscando por: <span className="font-semibold">"{searchQuery}"</span>
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : totalResults === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Nenhum resultado encontrado para "{searchQuery}"
              </p>
              <Link href="/catalogo">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Ver Catálogo Completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Produtos */}
            {results?.products && results.products.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Grid3x3 className="w-5 h-5 text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Produtos ({results.products.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.products.map((product) => (
                    <Link key={product.id} href={`/produto/${product.id}`}>
                      <Card className="hover:shadow-lg transition cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.segment}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-2xl font-bold text-orange-500">
                              {formatProductPrice(product, priceAudience)}
                            </span>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                              Ver Detalhes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Categorias */}
            {results?.categories && results.categories.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-blue-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Categorias ({results.categories.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.categories.map((category) => (
                    <Card
                      key={category.id}
                      className="hover:shadow-lg transition cursor-pointer"
                      onClick={() => navigate(`/categoria/${category.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/categoria/${category.id}`)}
                        >
                          Explorar Categoria
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Materiais */}
            {results?.materials && results.materials.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-green-500" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Materiais ({results.materials.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.materials.map((material) => (
                    <Card key={material.id} className="hover:shadow-lg transition">
                      <CardHeader>
                        <CardTitle className="text-lg">{material.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {material.description && (
                          <p className="text-gray-600 text-sm">{material.description}</p>
                        )}
                        <div className="text-2xl font-bold text-green-600">
                          +R$ {parseFloat(material.priceModifier).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
