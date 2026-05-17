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
import { useLocation } from "wouter";

export default function AdminProductAttributesLinker() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const productIdFromUrl = queryParams.get('productId') ? parseInt(queryParams.get('productId')!) : null;
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(productIdFromUrl);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
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
    if (!attributeSearch.trim()) return attributes;
    
    const query = attributeSearch.toLowerCase();
    return attributes.filter((a: any) => 
      a.name.toLowerCase().includes(query) || a.slug.toLowerCase().includes(query)
    );
  }, [attributes, attributeSearch]);

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setSelectedAttributes(new Set());
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
        <h1 className="text-3xl font-bold">Vincular Atributos a Produtos</h1>
        <p className="text-gray-600 mt-2">Selecione quais atributos cada produto utilizará</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Coluna Direita - Atributos */}
        <Card>
          <CardHeader>
            <CardTitle>Atributos Disponíveis</CardTitle>
            <CardDescription>
              {selectedProductId ? "Selecione os atributos para este produto" : "Selecione um produto primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar atributo..."
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
                            Vincular {selectedAttributes.size} Atributo(s)
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhum atributo cadastrado</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atributos Vinculados */}
      {selectedProductId && productAttributes && productAttributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atributos Vinculados</CardTitle>
            <CardDescription>Atributos já configurados para este produto</CardDescription>
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
