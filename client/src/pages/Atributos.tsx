import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Atributos() {
  const [selectedAttributeCategoryId, setSelectedAttributeCategoryId] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [attributeSearch, setAttributeSearch] = useState("");

  // Carregar atributos globais
  const { data: attributes, isLoading: attributesLoading } = trpc.attributes.listAttributes.useQuery();

  // Mutation para criar novo atributo (placeholder)
  const createMutation = {
    isPending: false,
    mutate: () => {
      toast.success("Atributo criado com sucesso!");
      setSelectedAttributes(new Set());
    },
  };

  // Categorias de atributos
  const attributeCategories = [
    { id: 'impressao', label: 'TIPO DE IMPRESSÃO', description: 'Selecione o tipo de impressão desejado', icon: '🖨️' },
    { id: 'material', label: 'TIPO DE MATERIAL', description: 'Escolha o material para seu produto', icon: '📦' },
    { id: 'papel', label: 'TIPO DE PAPEL', description: 'Selecione a gramatura e tipo de papel', icon: '📄' },
    { id: 'acabamento', label: 'TIPO DE ACABAMENTO', description: 'Escolha o acabamento para seu produto', icon: '✨' },
    { id: 'cor', label: 'TIPO DE COR', description: 'Selecione a configuração de cores', icon: '🎨' },
    { id: 'formato', label: 'TIPO DE FORMATO', description: 'Escolha o formato do seu produto', icon: '📐' },
    { id: 'quantidade', label: 'QUANTIDADE', description: 'Defina a quantidade desejada', icon: '🔢' },
  ];

  // Filtrar atributos por busca e categoria
  const filteredAttributes = useMemo(() => {
    if (!attributes) return [];
    let filtered = attributes;
    
    if (attributeSearch.trim()) {
      const query = attributeSearch.toLowerCase();
      filtered = filtered.filter((a: any) => 
        a.name.toLowerCase().includes(query) || a.slug.toLowerCase().includes(query)
      );
    }
    
    // Filtrar por categoria selecionada
    if (selectedAttributeCategoryId) {
      const categoryMap: Record<string, string[]> = {
        'impressao': ['frente', 'verso', 'preto', 'colorida', 'impressão', '4/0', '4/4', 'p/f', 'g/f'],
        'material': ['couchê', 'offset', 'kraft', 'sulfite', 'vinil', 'pvc', 'acm', 'mdf', 'lona', 'ps', 'acrílico', 'reciclato', 'duplex', 'triplex'],
        'papel': ['90g', '115g', '150g', '170g', '210g', '250g', '300g', '350g', 'offset', 'supremo', 'kraft', 'reciclato', 'sulfite', 'duplex', 'triplex'],
        'acabamento': ['laminação', 'verniz', 'soft touch', 'plastificação', 'corte', 'dobra', 'vinco', 'furo', 'ilhós', 'solda', 'bastão', 'hot stamping', 'relevo', 'cantos', 'faca', 'espiral', 'wire-o', 'cola', 'encadernação', 'serrilha', 'revestimento', 'proteção'],
        'cor': ['colorida', 'preto', 'branco', 'cmyk', 'pantone', 'frente', 'verso'],
        'formato': ['a4', 'a5', 'a6', 'personalizado', 'quadrado', 'retangular', '10x', '15x', '20x', '21x', '30cm'],
        'quantidade': ['100', '250', '500', '1000', '3000', 'quantidade']
      };
      
      const keywords = categoryMap[selectedAttributeCategoryId] || [];
      filtered = filtered.filter((attr: any) =>
        keywords.some(keyword => attr.name.toLowerCase().includes(keyword) || attr.slug.toLowerCase().includes(keyword))
      );
    }
    
    return filtered;
  }, [attributes, attributeSearch, selectedAttributeCategoryId]);

  const handleAttributeToggle = (attributeId: number) => {
    const newSet = new Set(selectedAttributes);
    if (newSet.has(attributeId)) {
      newSet.delete(attributeId);
    } else {
      newSet.add(attributeId);
    }
    setSelectedAttributes(newSet);
  };

  const handleCreateAttributes = () => {
    if (!selectedAttributeCategoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (selectedAttributes.size === 0) {
      toast.error("Selecione pelo menos um atributo");
      return;
    }

    // Criar cada atributo selecionado
    selectedAttributes.forEach((attributeId) => {
      toast.info(`Atributo ${attributeId} será criado em ${selectedAttributeCategoryId}`);
    });
    setSelectedAttributes(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Atributos</h1>
        <p className="text-gray-600 mt-2">Selecione quais atributos cada categoria utilizará</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Selecione uma categoria para gerenciar seus atributos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attributeCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedAttributeCategoryId === category.id}
                    onCheckedChange={() => 
                      setSelectedAttributeCategoryId(selectedAttributeCategoryId === category.id ? null : category.id)
                    }
                  />
                  <Label htmlFor={`cat-${category.id}`} className="cursor-pointer flex-1">
                    <div>
                      <p className="font-medium text-sm">{category.icon} {category.label}</p>
                      <p className="text-xs text-gray-500">{category.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coluna Central - Atributos Disponíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Atributos Disponíveis</CardTitle>
            <CardDescription>
              {selectedAttributeCategoryId 
                ? `Atributos para ${selectedAttributeCategoryId.toUpperCase()}` 
                : "Selecione uma categoria primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAttributeCategoryId && (
              <>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar atributo..."
                    value={attributeSearch}
                    onChange={(e) => setAttributeSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attributesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : filteredAttributes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum atributo encontrado</p>
                  ) : (
                    filteredAttributes.map((attr: any) => (
                      <div key={attr.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`attr-${attr.id}`}
                          checked={selectedAttributes.has(attr.id)}
                          onCheckedChange={() => handleAttributeToggle(attr.id)}
                        />
                        <Label htmlFor={`attr-${attr.id}`} className="cursor-pointer flex-1">
                          <div>
                            <p className="font-medium text-sm">{attr.name}</p>
                            <p className="text-xs text-gray-500">{attr.slug}</p>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
                </div>

                {selectedAttributes.size > 0 && (
                  <Button
                    className="w-full mt-4"
                    onClick={handleCreateAttributes}
                    disabled={false}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar {selectedAttributes.size} Atributo(s)
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Coluna Direita - Atributos Selecionados */}
        <Card>
          <CardHeader>
            <CardTitle>Atributos Selecionados</CardTitle>
            <CardDescription>
              {selectedAttributes.size > 0 
                ? `${selectedAttributes.size} atributo(s) selecionado(s)` 
                : "Nenhum atributo selecionado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedAttributes.size === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Selecione atributos para gerenciar</p>
              ) : (
                filteredAttributes
                  .filter((attr: any) => selectedAttributes.has(attr.id))
                  .map((attr: any) => (
                    <div key={attr.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium text-sm">{attr.name}</p>
                      <p className="text-xs text-gray-500">{attr.slug}</p>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
