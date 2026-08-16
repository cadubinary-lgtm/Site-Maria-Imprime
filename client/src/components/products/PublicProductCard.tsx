import { Card, CardContent } from "@/components/ui/card";
import { ProductTagBadges } from "@/components/products/ProductTagBadges";
import { trpc } from "@/lib/trpc";
import { getPixDiscountInfo, getProductPaymentPrices, type ProductPriceAudience } from "@/lib/productPrice";
import { Award, Box, Clock3, Maximize2, Package, Store, Tag, Truck } from "lucide-react";
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
  daysToDeliver?: number | string | null;
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

function getProductionLabel(options: ProductDeliveryOption[]) {
  const days = options
    .filter((option) => option.isActive !== false)
    .map((option) => Number(option.daysToDeliver))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!days.length) return null;

  const first = Math.min(...days);
  const last = Math.max(...days);
  if (first === last) return `${first} ${first === 1 ? "dia útil" : "dias úteis"}`;
  return `${first} a ${last} dias úteis`;
}

function getMinimumArea(product: ProductCardData) {
  const width = Number(product.minWidth);
  const height = Number(product.minHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return width * height;
}

function hasAllowedCarriers(value?: string | null) {
  if (!value) return false;
  try {
    return Array.isArray(JSON.parse(value)) && JSON.parse(value).length > 0;
  } catch {
    return false;
  }
}

export function PublicProductCard({ product, priceAudience = "final" }: { product: ProductCardData; priceAudience?: ProductPriceAudience }) {
  const { data: deliveryOptions = [] } = trpc.deliveryOptions.getByProduct.useQuery({ productId: product.id });
  const paymentPrices = getProductPaymentPrices(product, priceAudience);
  const pixDiscount = getPixDiscountInfo(product, priceAudience);
  const specifications = parseSpecifications(product.specifications);
  const productionLabel = getProductionLabel(deliveryOptions as ProductDeliveryOption[]);
  const minimumArea = getMinimumArea(product);
  const calculationType = product.calculationType || "unidade";
  const pricingSuffix = paymentPrices.pix.suffix;
  const isReseller = priceAudience === "reseller";
  const logisticsLabel = product.allowPickup
    ? "Retirada disponível"
    : product.allowMotoExpress
      ? "Moto express disponível"
      : hasAllowedCarriers(product.allowedCarriers)
        ? "Transportadoras disponíveis"
        : null;

  const operationalFacts = [
    calculationType === "m2" || calculationType === "metro_linear"
      ? { icon: Maximize2, label: "Cobrança", value: minimumArea ? `Área mín. ${minimumArea.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²` : calculationType === "m2" ? "Por m²" : "Por metro linear" }
      : { icon: Package, label: "Cobrança", value: calculationType === "pacote" ? "Por pacote" : "Por unidade" },
    productionLabel ? { icon: Clock3, label: "Produção", value: productionLabel } : null,
    logisticsLabel ? { icon: Truck, label: "Entrega", value: logisticsLabel } : null,
  ].filter(Boolean) as Array<{ icon: typeof Box; label: string; value: string }>;

  return (
    <Link href={`/produto/${product.id}`} className="group block h-full">
    <Card className="h-full overflow-hidden border border-gray-200 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <ProductTagBadges tags={product.tags} tagPosition={product.tagPosition} />
        {pixDiscount.eligible && (
          <span className="absolute left-2 top-2 z-20 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            Desconto no Pix
          </span>
        )}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Sem imagem</div>
        )}
      </div>

      <CardContent className="flex h-full flex-col px-4 pb-4 pt-4">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{product.description}</p>}

        {specifications.length > 0 && (
          <div className="mt-4 grid grid-cols-2 border-y border-gray-100 py-3 sm:grid-cols-4">
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

        <div className={`mt-4 grid gap-3 ${isReseller ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{isReseller ? "Preço revendedor" : calculationType === "m2" || calculationType === "metro_linear" ? "A partir de" : "Preço no Pix"}</p>
            <p className="mt-0.5 truncate text-xl font-bold text-emerald-600">{formatCurrency(paymentPrices.pix.value, pricingSuffix)}</p>
            {!isReseller && <p className="text-[11px] font-semibold text-emerald-700">no Pix{pixDiscount.eligible ? ` (${pixDiscount.percentage}% de desconto)` : ""}</p>}
          </div>
          {!isReseller && (
            <div className="min-w-0 border-l border-gray-200 pl-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{calculationType === "m2" || calculationType === "metro_linear" ? "A partir de" : "Preço no cartão"}</p>
              <p className="mt-0.5 truncate text-xl font-bold text-gray-500">{formatCurrency(paymentPrices.card.value, paymentPrices.card.suffix)}</p>
              <p className="text-[11px] font-medium text-gray-500">no Cartão de Crédito</p>
            </div>
          )}
        </div>

        {operationalFacts.length > 0 && (
          <div className="mt-4 grid grid-cols-1 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {operationalFacts.map((fact) => {
              const FactIcon = fact.icon;
              return (
                <div key={fact.label} className="flex items-center gap-2 px-2 py-2 sm:px-1">
                  <FactIcon className="h-4 w-4 shrink-0 text-gray-700" aria-hidden="true" />
                  <span className="min-w-0 text-[11px] leading-tight text-gray-600"><strong className="block text-gray-800">{fact.label}</strong>{fact.value}</span>
                </div>
              );
            })}
          </div>
        )}

        <span className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full bg-pink-600 text-sm font-semibold text-white shadow-sm transition-all group-hover:bg-pink-700 group-hover:shadow-md">
          Ver opções
        </span>
      </CardContent>
    </Card>
    </Link>
  );
}
