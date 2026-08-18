import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ProductVariationManager } from "@/components/ProductVariationManager";
import { ArrowLeft } from "lucide-react";

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
          <Button
            type="button"
            variant="outline"
            className="border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800"
            onClick={() => navigate("/admin/produtos")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar para Produtos
          </Button>
        </div>

        {/* Gerenciador de Variações */}
        <ProductVariationManager />
      </div>
    </AdminLayout>
  );
}
