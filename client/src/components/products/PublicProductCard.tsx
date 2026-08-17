import { Card, CardContent } from "@/components/ui/card";
import { ProductTagBadges } from "@/components/products/ProductTagBadges";
import { trpc } from "@/lib/trpc";
import { getPixDiscountInfo, getProductPaymentPrices, type ProductPriceAudience } from "@/lib/productPrice";
import { getVisibleCardDescriptionLines } from "@/lib/product-card-description";
import { Award, Box, Store, Tag, Zap } from "lucide-react";
import { Link } from "wouter";

type ProductCardData = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  calculationType?: "m2" | "metro_linear" | "pacote" | "unidade" | string | null;
  unit?: string | null;
  minWidth?: string | number | null;
  minHeight?: string | number | null;
  allowPickup?: boolean | null;
  allowMotoExpress?: boolean | null;
  allowedCarriers?: string | null;
  specifications?: string | null;
  tags?: string | null;
  tagPosition?: string | null;
  cardDescription?: string | null;
  price: string | number;
  pixPrice?: string | number | null;
  cardPrice?: string | number | null;
  resellerPrice?: string | number | null;
  pricePerM2?: string | number | null;
  pixPricePerM2?: string | number | null;
  cardPricePerM2?: string | number | null;
  resellerPricePerM2?: string | number | null;
};

type ProductDeliveryOption = {
  name?: string | null;
  daysToDeliver?: number | string | null;
  pricePerM2?: number | string | null;
  isActive?: boolean | null;
};

type RealSpecification = { label: string; value: string };

function formatCurrency(value: number, suffix = "") {
  return `${value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${suffix}`;
}

function parseSpecifications(specifications?: string | null): RealSpecification[] {
  if (!specifications) return [];

  try {
    const parsed = JSON.parse(specifications);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.label === "string" && typeof item.value === "string" && item.label.trim() && item.value.trim())
      .slice(0, 4)
      .map((item) => ({ label: item.label.trim(), value: item.value.trim() }));
  } catch {
    return [];
  }
}

export function PublicProductCard({ product, priceAudience = "final" }: { product: ProductCardData; priceAudience?: ProductPriceAudience }) {
  const { data: deliveryOptions = [] } = trpc.deliveryOptions.getByProduct.useQuery({ productId: product.id });
  const paymentPrices = getProductPaymentPrices(product, priceAudience);
  const pixDiscount = getPixDiscountInfo(product, priceAudience);
  const specifications = parseSpecifications(product.specifications);
  const calculationType = product.calculationType || "unidade";
  const pricingSuffix = paymentPrices.pix.suffix;
  const isReseller = priceAudience === "reseller";
  const sameDayUrgency = calculationType === "m2"
    ? (deliveryOptions as ProductDeliveryOption[]).find((option) =>
        option.isActive !== false && Number(option.daysToDeliver) === 0 && Number(option.pricePerM2) > 0
      )
    : null;
  const cardDescriptionLines = getVisibleCardDescriptionLines(product.cardDescription);

  return (
    <Link href={`/produto/${product.id}`} className="group block">
    <Card className="overflow-hidden border border-gray-200 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square bg-gray-50">
        <ProductTagBadges tags={product.tags} tagPosition={product.tagPosition} />
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
        )}
      </div>

      <CardContent className="px-4 pb-4 pt-1">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-tight text-gray-900">{product.name}</h3>

        {specifications.length > 0 && (
          <div className="mt-3 grid grid-cols-2 border-y border-gray-100 py-2 sm:grid-cols-4">
            {specifications.map((specification, index) => {
              const SpecIcon = [Award, Tag, Box, Store][index] ?? Tag;
              return (
                <div key={`${specification.label}-${specification.value}`} className={`flex min-w-0 flex-col items-center px-1 text-center ${index < specifications.length - 1 ? "border-r border-gray-100" : ""}`}>
                  <SpecIcon className="mb-1 h-4 w-4 text-pink-600" aria-hidden="true" />
                  <span className="line-clamp-1 text-[10px] font-semibold text-gray-700">{specification.label}</span>
                  <span className="line-clamp-1 text-[10px] text-gray-500">{specification.value}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className={`mt-1.5 grid gap-2 ${isReseller ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wide text-emerald-700">{isReseller ? "Preço revendedor" : calculationType === "m2" || calculationType === "metro_linear" ? "A partir de" : "Preço no Pix"}</p>
            <p className="mt-0.5 truncate text-2xl font-extrabold leading-none text-emerald-600">{formatCurrency(paymentPrices.pix.value, pricingSuffix)}</p>
            {!isReseller && <p className="mt-1 text-[10px] font-semibold leading-none text-emerald-700">no Pix{pixDiscount.eligible ? ` (${pixDiscount.percentage}% de desconto)` : ""}</p>}
          </div>
          {!isReseller && (
            <div className="min-w-0 border-l border-gray-200 pl-2">
              <p className="text-[8px] font-bold uppercase tracking-wide text-gray-400">{calculationType === "m2" || calculationType === "metro_linear" ? "A partir de" : "Preço no cartão"}</p>
              <p className="mt-0.5 truncate text-lg font-bold leading-none text-gray-500">{formatCurrency(paymentPrices.card.value, paymentPrices.card.suffix)}</p>
              <p className="mt-1 text-[10px] font-medium leading-none text-gray-500">no Cartão de Crédito</p>
            </div>
          )}
        </div>

        {(cardDescriptionLines.length > 0 || sameDayUrgency) && (
          <div className="mt-2 flex min-w-0 items-start gap-1 text-[9px] font-semibold leading-[1.2] tracking-[-0.015em] text-pink-700">
            <Zap className="h-3 w-3 shrink-0" aria-hidden="true" />
            {cardDescriptionLines.length > 0 ? (
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                {cardDescriptionLines.map((line, index) => <span key={`${line}-${index}`} className="truncate" title={line}>{line}</span>)}
              </span>
            ) : (
              <span className="whitespace-nowrap">Produção no mesmo dia · taxa de urgência de {formatCurrency(Number(sameDayUrgency?.pricePerM2), "/m²")}</span>
            )}
          </div>
        )}

        <span className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-full bg-pink-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md">
          Ver opções
        </span>
      </CardContent>
    </Card>
    </Link>
  );
}
