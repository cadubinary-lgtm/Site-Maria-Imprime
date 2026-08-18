import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Grid3x3, Layers, Loader2, Package, Search, SearchX } from "lucide-react";
import { formatProductPrice } from "@/lib/productPrice";
import { Link } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export default function SearchResults() {
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
          <p className="text-gray-600" aria-live="polite">
            {searchQuery && (
              <>
                Buscando por: <span className="font-semibold">"{searchQuery}"</span>
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        ) : totalResults === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <SearchX className="w-12 h-12 text-pink-500 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600 mb-4">
                Nenhum resultado encontrado para "{searchQuery}"
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/catalogo" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-pink-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-pink-700">
                  Explorar catálogo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-pink-300 bg-white px-5 text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-50">
                  <Search className="h-4 w-4" aria-hidden="true" /> Fazer nova busca
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Produtos */}
            {results?.products && results.products.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Grid3x3 className="w-5 h-5 text-pink-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Produtos ({results.products.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.products.map((product) => (
                    <Link key={product.id} href={`/produto/${product.id}`}>
                      <Card className="h-full cursor-pointer transition hover:border-pink-200 hover:shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.segment}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <span className="text-2xl font-bold text-pink-600">
                              {formatProductPrice(product, priceAudience)}
                            </span>
                            <span className="inline-flex h-8 items-center rounded-full bg-pink-600 px-3 text-xs font-semibold text-white">
                              Ver detalhes
                            </span>
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
                  <Layers className="w-5 h-5 text-pink-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Categorias ({results.categories.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.categories.map((category) => (
                    <Link key={category.id} href={`/catalogo?segmentId=${category.id}`} className="block h-full">
                    <Card className="h-full cursor-pointer transition hover:border-pink-200 hover:shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-pink-300 bg-white px-4 text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-50">
                          Explorar categoria <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </CardContent>
                    </Card>
                    </Link>
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
