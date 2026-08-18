import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Link2, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductAttributesLinker() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const utils = trpc.useUtils();

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

  const linkedAttributeIds = useMemo(
    () => new Set((productAttributes ?? []).map((productAttribute: any) => productAttribute.attributeId)),
    [productAttributes]
  );
  const selectedProduct = useMemo(
    () => products?.find((product: any) => product.id === selectedProductId),
    [products, selectedProductId]
  );

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

  const handleLinkAttributes = async () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    if (selectedAttributes.size === 0) {
      toast.error("Selecione pelo menos um atributo");
      return;
    }

    setIsLinking(true);
    try {
      await Promise.all(
        Array.from(selectedAttributes).map((attributeId) =>
          linkMutation.mutateAsync({
            productId: selectedProductId,
            attributeId,
            isRequired: true,
            allowMultiple: false,
          })
        )
      );
      await utils.attributes.getProductAttributes.invalidate(selectedProductId);
      toast.success(`${selectedAttributes.size} atributo${selectedAttributes.size > 1 ? "s foram vinculados" : " foi vinculado"} com sucesso.`);
      setSelectedAttributes(new Set());
    } catch {
      // A mensagem de erro é apresentada pela própria mutation.
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="admin-visual-system space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vincular Atributos a Produtos</h1>
        <p className="text-gray-600 mt-2">Selecione quais atributos cada produto utilizará</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Produtos */}
        <Card>
          <CardHeader>
            <CardTitle id="products-linker-title">Produtos</CardTitle>
            <CardDescription>Selecione um produto para configurar seus atributos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Label htmlFor="product-attribute-search" className="sr-only">Buscar produto</Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                id="product-attribute-search"
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 pr-10 focus-visible:ring-pink-500"
              />
              {productSearch && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-pink-700" onClick={() => setProductSearch("")} aria-label="Limpar busca de produtos"><X className="h-4 w-4" aria-hidden="true" /></Button>}
            </div>
            {productsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-600" aria-label="Carregando produtos" />
              </div>
            ) : (
              <div className="space-y-2" aria-live="polite" aria-label={`${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`}>
                {filteredProducts && filteredProducts.length > 0 ? (
                  <ul className="space-y-2" aria-labelledby="products-linker-title">
                    {filteredProducts.map((product: any) => (
                      <li key={product.id}>
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full justify-start border-gray-200 text-left hover:border-pink-300 hover:bg-pink-50 hover:text-pink-800 focus-visible:ring-pink-500 ${selectedProductId === product.id ? "border-pink-600 bg-pink-600 text-white hover:bg-pink-700 hover:text-white" : ""}`}
                          onClick={() => handleProductSelect(product.id)}
                          aria-pressed={selectedProductId === product.id}
                        >
                          {product.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
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
            <CardTitle id="attributes-linker-title">Atributos disponíveis</CardTitle>
            <CardDescription>
              {selectedProductId ? "Selecione os atributos para este produto" : "Selecione um produto primeiro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Label htmlFor="attribute-product-search" className="sr-only">Buscar atributo</Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                id="attribute-product-search"
                placeholder="Buscar atributo..."
                value={attributeSearch}
                onChange={(e) => setAttributeSearch(e.target.value)}
                className="pl-9 pr-10 focus-visible:ring-pink-500"
              />
              {attributeSearch && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-pink-700" onClick={() => setAttributeSearch("")} aria-label="Limpar busca de atributos"><X className="h-4 w-4" aria-hidden="true" /></Button>}
            </div>
            {attributesLoading ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-600" aria-label="Carregando atributos" />
              </div>
            ) : (
              <div className="space-y-3" aria-live="polite" aria-label={`${filteredAttributes.length} atributo${filteredAttributes.length !== 1 ? "s" : ""} disponível${filteredAttributes.length !== 1 ? "is" : ""}`}>
                {filteredAttributes && filteredAttributes.length > 0 ? (
                  <>
                    <ul className="space-y-3" aria-label="Atributos disponíveis para vínculo" aria-labelledby="attributes-linker-title">
                      {filteredAttributes.map((attr: any) => {
                        const isAlreadyLinked = linkedAttributeIds.has(attr.id);
                        return (
                          <li key={attr.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors has-[:focus-visible]:border-pink-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pink-100">
                            <Checkbox id={`attr-${attr.id}`} checked={selectedAttributes.has(attr.id)} onCheckedChange={() => handleAttributeToggle(attr.id)} disabled={!selectedProductId || isAlreadyLinked || isLinking} aria-describedby={isAlreadyLinked ? `attr-${attr.id}-status` : undefined} />
                            <Label htmlFor={`attr-${attr.id}`} className="cursor-pointer flex-1"><span className="block font-medium">{attr.name}</span><span className="block text-xs text-gray-500">{attr.slug}</span></Label>
                            {isAlreadyLinked && <span id={`attr-${attr.id}-status`} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Já vinculado</span>}
                          </li>
                        );
                      })}
                    </ul>
                    <Button type="button" className="mt-4 w-full bg-pink-600 hover:bg-pink-700" onClick={handleLinkAttributes} disabled={!selectedProductId || selectedAttributes.size === 0 || isLinking} aria-busy={isLinking}>
                      {isLinking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                            Vinculando...
                          </>
                      ) : (
                          <>
                            <Link2 className="w-4 h-4 mr-2" aria-hidden="true" />
                            {selectedAttributes.size > 0 ? `Vincular ${selectedAttributes.size} atributo${selectedAttributes.size > 1 ? "s" : ""}` : "Selecione atributos para vincular"}
                          </>
                      )}
                    </Button>
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
        <section aria-labelledby="linked-attributes-title">
        <Card>
          <CardHeader>
            <CardTitle id="linked-attributes-title">Atributos vinculados</CardTitle>
            <CardDescription>Atributos já configurados para {selectedProduct?.name ?? "este produto"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label={`Atributos vinculados a ${selectedProduct?.name ?? "este produto"}`}>
              {productAttributes.map((pa: any) => (
                <li key={pa.attributeId} className="border rounded-lg p-4">
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
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        </section>
      )}
    </div>
  );
}
