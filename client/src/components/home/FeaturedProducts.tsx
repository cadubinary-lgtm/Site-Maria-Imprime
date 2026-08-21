import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, PackageSearch } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { PublicProductCard } from "@/components/products/PublicProductCard";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

export function FeaturedProducts() {
  const { data: products, isLoading, isError } = trpc.products.getAll.useQuery();
  const { customer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";

  if (isLoading) {
    return (
      <section className="bg-white px-4 py-16" aria-label="Carregando produtos em destaque">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando produtos em destaque" />
          </div>
        </div>
      </section>
    );
  }

  // Exibe somente produtos ativos na vitrine pública.
  const featured = (products ?? []).filter((product: any) => Boolean(product.isActive)).slice(0, 7);

  return (
    <section className="bg-white px-4 pt-10 pb-3 sm:pt-12 sm:pb-4" aria-labelledby="featured-products-title">
      <div className="mx-auto max-w-7xl">
        <h2 id="featured-products-title" className="mb-3 text-center text-3xl font-bold text-gray-900">Produtos em destaque</h2>
        <p className="mb-6 text-center text-sm text-gray-600 sm:mb-8">Conheça opções para os seus materiais de comunicação visual.</p>

        {isError ? (
          <div role="alert" className="mx-auto mb-10 max-w-xl rounded-2xl border border-pink-100 bg-pink-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-pink-600" aria-hidden="true" />
            <p className="mt-3 font-semibold text-gray-900">Não foi possível carregar os destaques agora.</p>
            <p className="mt-1 text-sm text-gray-600">Você ainda pode explorar o catálogo completo.</p>
          </div>
        ) : featured.length > 0 ? (
          <div className="featured-products-grid mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5 xl:grid-cols-6 xl:gap-3 sm:mb-8">
            {featured.map((product: any) => (
              <PublicProductCard key={product.id} product={product} priceAudience={priceAudience} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mb-10 max-w-xl rounded-2xl border border-pink-100 bg-pink-50 p-6 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-pink-600" aria-hidden="true" />
            <p className="mt-3 font-semibold text-gray-900">Novos produtos serão exibidos aqui em breve.</p>
            <p className="mt-1 text-sm text-gray-600">Explore o catálogo para conhecer as opções disponíveis.</p>
          </div>
        )}

        <div className="text-center">
          <Link href="/catalogo">
            <Button size="lg" variant={isError || featured.length === 0 ? "default" : "outline"} className={`${isError || featured.length === 0 ? HOME_PRIMARY_ACTION_CLASS : HOME_SECONDARY_ACTION_CLASS} px-7 sm:px-8`}>
              Ver todos os produtos <span aria-hidden>→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
