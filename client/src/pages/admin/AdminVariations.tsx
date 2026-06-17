import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ProductVariationManager } from "@/components/ProductVariationManager";

export default function AdminVariations() {
  const [, navigate] = useLocation();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Variações</h1>
            <p className="text-sm text-gray-500 mt-1">Configure tipos de variação e opções para os produtos</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/produtos")}>
            ← Voltar para Produtos
          </Button>
        </div>

        {/* Gerenciador de Variações */}
        <ProductVariationManager />
      </div>
    </AdminLayout>
  );
}
