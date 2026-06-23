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
      <section className="bg-gray-50 py-20 px-4">
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
    <section className="bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">Produtos mais procurados</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featured.map((product: any, idx: number) => (
            <Link key={product.id} href={`/produto/${product.id}`}>
              <Card className="cursor-pointer hover:shadow-xl transition-all h-full group overflow-hidden">
                {/* Badge */}
                {BADGES[idx] && (
                  <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full inline-block m-3">
                    {BADGES[idx]}
                  </div>
                )}

                <CardContent className="pt-6">
                  {/* Product icon/image placeholder */}
                  <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-40 group-hover:scale-105 transition-transform">
                    <div className="text-5xl">
                      {product.segment === "varejo" && "📦"}
                      {product.segment === "servicos" && "🔧"}
                      {product.segment === "alimentacao" && "🍔"}
                      {product.segment === "beleza" && "💄"}
                      {!["varejo", "servicos", "alimentacao", "beleza"].includes(product.segment) && "📄"}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
                  <p className="text-2xl font-bold text-pink-600 mb-4">R$ {parseFloat(product.price).toFixed(2)}</p>

                  <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full font-semibold">
                    Ver opções
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/catalogo">
            <Button size="lg" variant="outline" className="border-pink-600 text-pink-600 hover:bg-pink-50 rounded-full px-8">
              Ver todos os produtos →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
