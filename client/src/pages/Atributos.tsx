import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AttributeWithValues {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  icon?: string;
  basePrice?: number;
  displayOrder?: number;
  values?: Array<{
    id: number;
    value: string;
    slug: string;
    priceModifier?: number;
    timeModifier?: number;
    weightModifier?: number;
  }>;
}

const MAIN_ATTRIBUTES = {
  'impressao': {
    label: 'TIPO DE IMPRESSÃO',
    keywords: ['impressão', 'frente', 'verso', 'preto', 'colorida', '4/0', '4/4']
  },
  'material': {
    label: 'TIPO DE MATERIAL',
    keywords: ['material', 'couchê', 'offset', 'kraft', 'sulfite', 'vinil', 'pvc', 'acm']
  },
  'papel': {
    label: 'TIPO DE PAPEL',
    keywords: ['papel', '90g', '115g', '150g', '170g', '210g', '250g', '300g']
  },
  'acabamento': {
    label: 'TIPO DE ACABAMENTO',
    keywords: ['acabamento', 'laminação', 'verniz', 'soft touch', 'corte', 'dobra', 'vinco']
  },
  'cor': {
    label: 'TIPO DE COR',
    keywords: ['cor', 'colorida', 'preto', 'branco', 'cmyk', 'pantone']
  },
  'formato': {
    label: 'TIPO DE FORMATO',
    keywords: ['formato', 'a4', 'a5', 'a6', 'personalizado', 'quadrado']
  },
  'quantidade': {
    label: 'QUANTIDADE',
    keywords: ['quantidade', '100', '250', '500', '1000', '3000']
  },
};

export default function Atributos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Carregar atributos globais
  const { data: attributes, isLoading } = trpc.attributes.listAttributes.useQuery();

  // Mutation para deletar atributo
  const deleteMutation = trpc.attributes.deleteAttribute.useMutation({
    onSuccess: () => {
      toast.success("Atributo deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Funcao para determinar a categoria de um atributo
  const getAttributeCategory = (attr: AttributeWithValues): string | null => {
    const lowerName = attr.name.toLowerCase();
    const lowerSlug = attr.slug.toLowerCase();
    
    for (const [categoryId, categoryData] of Object.entries(MAIN_ATTRIBUTES)) {
      const keywords = categoryData.keywords;
      const matches = keywords.some(keyword => 
        lowerName.includes(keyword) || lowerSlug.includes(keyword)
      );
      if (matches) {
        return categoryId;
      }
    }
    return null;
  };

  // Filtrar atributos por categoria principal e busca
  const filteredAttributes = (attributes || []).filter((attr: AttributeWithValues) => {
    const category = getAttributeCategory(attr);
    const hasMainCategory = category !== null;
    const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return hasMainCategory && matchesSearch;
  });

  // Agrupar atributos por categoria
  const groupedAttributes = filteredAttributes.reduce((acc: Record<string, AttributeWithValues[]>, attr: AttributeWithValues) => {
    const category = getAttributeCategory(attr);
    if (category) {
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(attr);
    }
    return acc;
  }, {} as Record<string, AttributeWithValues[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Atributos</h1>
            <p className="text-gray-600 mt-2">Cadastre atributos globais reutilizáveis para seus produtos</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Atributo
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-8 py-6">
        {/* Campo de Busca */}
        <div className="mb-6">
          <Input
            placeholder="Buscar atributo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Lista de Atributos por Categoria */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : Object.keys(groupedAttributes).length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nenhum atributo encontrado nas 7 categorias principais</p>
            </div>
          ) : (
            Object.entries(MAIN_ATTRIBUTES).map(([categoryId, categoryData]) => {
              const categoryAttrs = groupedAttributes[categoryId] || [];
              if (categoryAttrs.length === 0) return null;

              return (
                <div key={categoryId} className="space-y-4">
                  {/* Cabeçalho da Categoria */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{categoryData.label}</h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {categoryAttrs.length} atributo{categoryAttrs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Lista de Atributos da Categoria */}
                  <div className="space-y-3">
                    {categoryAttrs.map((attr: AttributeWithValues) => (
                      <div key={attr.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                        {/* Cabeçalho do Atributo */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{attr.name}</h3>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {attr.slug}
                              </span>
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {attr.type}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(attr.id)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(attr.id)}
                              className="text-red-600 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Descrição */}
                        {attr.description && (
                          <p className="text-sm text-gray-600 mb-4">{attr.description}</p>
                        )}

                        {/* Valores do Atributo */}
                        {attr.values && attr.values.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-semibold mb-2">VALORES:</p>
                            <div className="flex flex-wrap gap-2">
                              {attr.values.map((value) => (
                                <span
                                  key={value.id}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                  {value.value}
                                  {value.priceModifier && ` (+R$ ${value.priceModifier})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
