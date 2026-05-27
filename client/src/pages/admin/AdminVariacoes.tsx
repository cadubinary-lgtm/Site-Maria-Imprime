import { ProductVariationManager } from "@/components/products/ProductVariationManager";

/**
 * Página de Variações — envolve o ProductVariationManager completo.
 * Gerencia variações globais e por produto dentro do AdminLayout.
 */
export default function AdminVariacoes() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Variações de Produtos</h2>
        <p className="text-sm text-slate-500">
          Gerencie tipos de variações globais e vincule-os aos produtos
        </p>
      </div>
      <ProductVariationManager />
    </div>
  );
}
