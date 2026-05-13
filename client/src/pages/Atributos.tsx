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

  // Filtrar atributos por busca
  const filteredAttributes = (attributes || []).filter((attr: AttributeWithValues) =>
    attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attr.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mapa de categorias por tipo
  const getCategoryLabel = (type: string): string => {
    const categoryMap: Record<string, string> = {
      'text': 'MATERIAIS — PAPÉIS',
      'select': 'MATERIAIS — PAPÉIS',
      'button': 'IMPRESSÃO',
      'card': 'ACABAMENTO',
      'radio': 'COR',
      'checkbox': 'ACABAMENTO',
      'numeric': 'QUANTIDADE',
      'measures': 'FORMATO',
    };
    return categoryMap[type] || 'OUTROS';
  };

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

        {/* Lista de Atributos */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Nenhum atributo encontrado</p>
            </div>
          ) : (
            filteredAttributes.map((attr: AttributeWithValues) => (
              <div key={attr.id} className="bg-white rounded-lg border border-gray-200 p-6">
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

                {/* Categoria */}
                <div className="text-sm text-gray-500 font-semibold mb-3 uppercase">
                  {getCategoryLabel(attr.type)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
