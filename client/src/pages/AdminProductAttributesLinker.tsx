import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductAttributesLinker() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [selectedAttributeCategory, setSelectedAttributeCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");

  // Carregar produtos
  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();

  // Carregar atributos globais
  const { data: attributes, isLoading: attributesLoading } = trpc.attributes.listAttributes.useQuery();

  // Carregar atributos vinculados ao produto selecionado
  const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(
    selectedProductId || 0,
    { enabled: !!selectedProductId }
  );

  // Mutation para vincular atributo
  const linkMutation = trpc.attributes.linkAttributeToProduct.useMutation({
    onSuccess: () => {
      toast.success("Atributo vinculado com sucesso!");
      setIsDialogOpen(false);
      setSelectedAttributes(new Set());
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Filtrar produtos por busca
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch.trim()) return products;
    
    const query = productSearch.toLowerCase();
    return products.filter((p: any) => p.name.toLowerCase().includes(query));
  }, [products, productSearch]);

  // Filtrar atributos por busca
  const filteredAttributes = useMemo(() => {
    if (!attributes) return [];
    let filtered = attributes;
    
    if (attributeSearch.trim()) {
      const query = attributeSearch.toLowerCase();
      filtered = filtered.filter((a: any) => 
        a.name.toLowerCase().includes(query) || a.slug.toLowerCase().includes(query)
      );
    }
    
    // Filtrar por categoria de atributo selecionada
    if (selectedAttributeCategory) {
      const categoryMap: Record<string, string[]> = {
        'impressao': ['frente', 'verso', 'preto', 'colorida', 'impressão', '4/0', '4/4', 'p/f', 'g/f'],
        'material': ['couchê', 'offset', 'kraft', 'sulfite', 'vinil', 'pvc', 'acm', 'mdf', 'lona', 'ps', 'acrílico', 'reciclato', 'duplex', 'triplex'],
        'papel': ['90g', '115g', '150g', '170g', '210g', '250g', '300g', '350g', 'offset', 'supremo', 'kraft', 'reciclato', 'sulfite', 'duplex', 'triplex'],
        'acabamento': ['laminação', 'verniz', 'soft touch', 'plastificação', 'corte', 'dobra', 'vinco', 'furo', 'ilhós', 'solda', 'bastão', 'hot stamping', 'relevo', 'cantos', 'faca', 'espiral', 'wire-o', 'cola', 'encadernação', 'serrilha', 'revestimento', 'proteção'],
        'cor': ['colorida', 'preto', 'branco', 'cmyk', 'pantone', 'frente', 'verso'],
        'formato': ['a4', 'a5', 'a6', 'personalizado', 'quadrado', 'retangular', '10x', '15x', '20x', '21x', '30cm'],
        'quantidade': ['100', '250', '500', '1000', '3000', 'quantidade']
      };
      
      const keywords = categoryMap[selectedAttributeCategory] || [];
      filtered = filtered.filter((attr: any) =>
        keywords.some(keyword => attr.name.toLowerCase().includes(keyword) || attr.slug.toLowerCase().includes(keyword))
      );
    }
    
    return filtered;
  }, [attributes, attributeSearch, selectedAttributeCategory]);

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setSelectedAttributes(new Set());
  };

  const handleAttributeCategoryToggle = (categoryId: string) => {
    setSelectedAttributeCategory(selectedAttributeCategory === categoryId ? null : categoryId);
  };
  
  const handleAttributeToggle = (attributeId: number) => {
    const newSet = new Set(selectedAttributes);
    if (newSet.has(attributeId)) {
      newSet.delete(attributeId);
    } else {
      newSet.add(attributeId);
    }
    setSelectedAttributes(newSet);
  };

  const handleLinkAttributes = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    if (selectedAttributes.size === 0) {
      toast.error("Selecione pelo menos um atributo");
      return;
    }

    // Vincular cada atributo selecionado
    selectedAttributes.forEach((attributeId) => {
      linkMutation.mutate({
        productId: selectedProductId,
        attributeId,
        isRequired: true,
        allowMultiple: false,
      });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vincular Variáveis a Produtos</h1>
        <p className="text-gray-600 mt-2">Selecione quais variáveis cada produto utilizará</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Selecione um produto para configurar seus atributos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {productsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product: any) => (
                    <Button
                      key={product.id}
                      variant={selectedProductId === product.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleProductSelect(product.id)}
                    >
                      {product.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum produto encontrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna Central - Atributos */}
        <Card>
          <CardHeader>
            <CardTitle>Atributos</CardTitle>
            <CardDescription>
              {selectedProductId ? "Selecione os atributos para este produto" : "Selecione um produto primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedProductId ? (
                <>
                  {[
                    { id: 'impressao', label: 'TIPO DE IMPRESSÃO', description: 'Selecione o tipo de impressão desejado', icon: '🖨️' },
                    { id: 'material', label: 'TIPO DE MATERIAL', description: 'Escolha o material para seu produto', icon: '📦' },
                    { id: 'papel', label: 'TIPO DE PAPEL', description: 'Selecione a gramatura e tipo de papel', icon: '📄' },
                    { id: 'acabamento', label: 'TIPO DE ACABAMENTO', description: 'Escolha o acabamento para seu produto', icon: '✨' },
                    { id: 'cor', label: 'TIPO DE COR', description: 'Selecione a configuração de cores', icon: '🎨' },
                    { id: 'formato', label: 'TIPO DE FORMATO', description: 'Escolha o formato do seu produto', icon: '📐' },
                    { id: 'quantidade', label: 'QUANTIDADE', description: 'Defina a quantidade desejada', icon: '🔢' },
                  ].map((attr) => (
                    <div key={attr.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attr.id}`}
                        checked={selectedAttributeCategory === attr.id}
                        onCheckedChange={() => handleAttributeCategoryToggle(attr.id)}
                        disabled={!selectedProductId}
                      />
                      <Label htmlFor={`attr-${attr.id}`} className="cursor-pointer flex-1">
                        <div>
                          <p className="font-medium text-sm">{attr.icon} {attr.label}</p>
                          <p className="text-xs text-gray-500">{attr.description}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Selecione um produto para ver os atributos</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coluna Direita - Variáveis */}
        <Card>
          <CardHeader>
            <CardTitle>Variáveis Disponíveis</CardTitle>
            <CardDescription>
              {selectedProductId && selectedAttributeCategory ? `Variáveis para ${selectedAttributeCategory.toUpperCase()}` : selectedProductId ? "Selecione um atributo para ver as variáveis" : "Selecione um produto primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar variável..."
                value={attributeSearch}
                onChange={(e) => setAttributeSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {attributesLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttributes && filteredAttributes.length > 0 ? (
                  <>
                    {filteredAttributes.map((attr: any) => (
                      <div key={attr.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`attr-${attr.id}`}
                          checked={selectedAttributes.has(attr.id)}
                          onCheckedChange={() => handleAttributeToggle(attr.id)}
                          disabled={!selectedProductId}
                        />
                        <Label htmlFor={`attr-${attr.id}`} className="cursor-pointer flex-1">
                          <div>
                            <p className="font-medium">{attr.name}</p>
                            <p className="text-xs text-gray-500">{attr.slug}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                    {selectedAttributes.size > 0 && (
                      <Button
                        className="w-full mt-4"
                        onClick={handleLinkAttributes}
                        disabled={linkMutation.isPending}
                      >
                        {linkMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Vinculando...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" />
                            Vincular {selectedAttributes.size} Variável(is)
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma variável cadastrada</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variáveis Vinculadas */}
      {selectedProductId && productAttributes && productAttributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variáveis Vinculadas</CardTitle>
            <CardDescription>Variáveis já configuradas para este produto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productAttributes.map((pa: any) => (
                <div key={pa.attributeId} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{pa.attribute?.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tipo: <span className="font-medium">{pa.attribute?.type}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Obrigatório: <span className="font-medium">{pa.isRequired ? "Sim" : "Não"}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Múltiplas seleções: <span className="font-medium">{pa.allowMultiple ? "Sim" : "Não"}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
