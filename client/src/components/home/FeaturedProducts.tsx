import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const BADGES = ["Mais vendido", "Promoção", "Destaque", "Novo", "Recomendado", "Exclusivo", ""];

export function FeaturedProducts() {
  const { data: products, isLoading } = trpc.products.getAll.useQuery();

  if (isLoading) {
    return (
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        </div>
      </section>
    );
  }

  // Pega 7 produtos aleatórios
  const featured = products?.slice(0, 7) || [];

  return (
    <section className="bg-white py-20 px-4" style={{paddingTop: '24px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center text-gray-900">Produtos mais procurados</h2>
        <p className="text-center text-gray-600 text-sm mb-12">Confira os favoritos dos nossos clientes</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featured.map((product: any, idx: number) => (
            <Link key={product.id} href={`/produto/${product.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-all h-full border border-gray-100 shadow-sm">
                {/* Badge */}
                {BADGES[idx] && (
                  <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full inline-block m-3">
                    {BADGES[idx]}
                  </div>
                )}

                {/* Product image - padronizado h-40 igual ao catalogo */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl">
                      {product.segment === "varejo" && "📦"}
                      {product.segment === "servicos" && "🔧"}
                      {product.segment === "alimentacao" && "🍔"}
                      {product.segment === "beleza" && "💄"}
                      {!["varejo", "servicos", "alimentacao", "beleza"].includes(product.segment) && "📄"}
                    </div>
                  )}
                </div>

                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-4 font-light">{product.description}</p>
                  <p className="text-xl font-bold text-pink-600 mb-4">R$ {parseFloat(product.price).toFixed(2)}</p>

                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold text-sm h-9 transition-all shadow-sm hover:shadow-md">
                    Ver opções
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/catalogo">
            <Button size="lg" variant="outline" className="border-pink-600 text-pink-600 hover:bg-pink-50 rounded-full px-8 font-semibold">
              Ver todos os produtos →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
