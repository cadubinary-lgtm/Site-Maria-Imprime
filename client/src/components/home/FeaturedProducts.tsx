import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { PublicProductCard } from "@/components/products/PublicProductCard";
import { HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

export function FeaturedProducts() {
  const { data: products, isLoading } = trpc.products.getAll.useQuery();
  const { customer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";

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

  // Exibe somente produtos ativos na vitrine pública.
  const featured = (products ?? []).filter((product: any) => Boolean(product.isActive)).slice(0, 7);

  return (
    <section className="bg-white py-20 px-4" style={{paddingTop: '24px'}}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-center text-gray-900">Produtos mais procurados</h2>
        <p className="text-center text-gray-600 text-sm mb-12">Confira os favoritos dos nossos clientes</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featured.map((product: any) => (
            <PublicProductCard key={product.id} product={product} priceAudience={priceAudience} />
          ))}
        </div>

        <div className="text-center">
          <Link href="/catalogo">
            <Button size="lg" variant="outline" className={`${HOME_SECONDARY_ACTION_CLASS} px-7 sm:px-8`}>
              Ver todos os produtos <span aria-hidden>→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
