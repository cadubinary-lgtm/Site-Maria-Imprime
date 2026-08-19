import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Link2, Loader2, PackageCheck, Search, Tags, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";

export default function AdminProductAttributesLinker() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Set<number>>(new Set());
  const [productSearch, setProductSearch] = useState("");
  const [attributeSearch, setAttributeSearch] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [productAttributePendingUnlink, setProductAttributePendingUnlink] = useState<any | null>(null);
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

  const unlinkMutation = trpc.attributes.unlinkAttributeFromProduct.useMutation({
    onSuccess: async () => {
      if (selectedProductId) await utils.attributes.getProductAttributes.invalidate(selectedProductId);
      toast.success("Atributo desvinculado do produto", {
        position: "top-right",
        duration: 3500,
        id: `unlink-product-attribute-${productAttributePendingUnlink?.id}`,
      });
      setProductAttributePendingUnlink(null);
    },
    onError: (error) => toast.error(error.message || "Não foi possível desvincular o atributo."),
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
      toast.success(`${selectedAttributes.size} atributo${selectedAttributes.size > 1 ? "s foram vinculados" : " foi vinculado"} com sucesso.`, {
        position: "top-right",
        duration: 3500,
        id: `link-product-attributes-${selectedProductId}`,
      });
      setSelectedAttributes(new Set());
    } catch {
      // A mensagem de erro é apresentada pela própria mutation.
    } finally {
      setIsLinking(false);
    }
  };

  const availableAttributesCount = Math.max(0, (attributes?.length ?? 0) - linkedAttributeIds.size);

  return (
    <AdminLayout>
    <main className="admin-visual-system min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6" aria-labelledby="attribute-linker-title">
      <header>
        <Link href="/admin/atributos">
          <Button variant="ghost" className="mb-2 -ml-3 text-slate-600 hover:bg-pink-50 hover:text-pink-700">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar para Atributos
          </Button>
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pink-600">Catálogo configurável</p>
        <h1 id="attribute-linker-title" className="mt-1 flex items-center gap-2 text-3xl font-bold text-slate-900">
          <span className="rounded-xl bg-pink-600 p-2 text-white shadow-sm shadow-pink-200"><Link2 className="h-5 w-5" aria-hidden="true" /></span>
          Vincular Atributos a Produtos
        </h1>
        <p className="mt-2 text-sm text-slate-600">Defina quais atributos cada produto utilizará e mantenha o catálogo preparado para uma configuração consistente.</p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Indicadores do vinculador de atributos">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Produtos disponíveis</p><p className="mt-1 text-2xl font-bold text-slate-900">{products?.length ?? 0}</p><p className="mt-1 text-xs leading-5 text-slate-500">Produtos disponíveis para configuração</p></div><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><PackageCheck className="h-5 w-5" aria-hidden="true" /></span></div>
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Atributos globais</p><p className="mt-1 text-2xl font-bold text-slate-900">{attributes?.length ?? 0}</p><p className="mt-1 text-xs leading-5 text-slate-500">Atributos cadastrados no catálogo</p></div><span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Tags className="h-5 w-5" aria-hidden="true" /></span></div>
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-sm font-medium text-slate-600">Disponíveis para o produto</p><p className="mt-1 text-2xl font-bold text-slate-900">{selectedProductId ? availableAttributesCount : attributes?.length ?? 0}</p><p className="mt-1 text-xs leading-5 text-slate-500">{selectedProduct ? `Ainda não vinculados a ${selectedProduct.name}` : "Selecione um produto para filtrar"}</p></div><span className="rounded-xl bg-green-50 p-2.5 text-green-700"><Link2 className="h-5 w-5" aria-hidden="true" /></span></div>
      </section>

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
                <li key={pa.attributeId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{pa.attribute?.name}</h3>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setProductAttributePendingUnlink(pa)} aria-label={`Desvincular atributo ${pa.attribute?.name ?? pa.attributeId}`} title="Desvincular atributo">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
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
      <AlertDialog open={Boolean(productAttributePendingUnlink)} onOpenChange={(open) => !open && setProductAttributePendingUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular este atributo do produto?</AlertDialogTitle>
            <AlertDialogDescription>O atributo <strong>{productAttributePendingUnlink?.attribute?.name ?? "selecionado"}</strong> deixará de aparecer no configurador de {selectedProduct?.name ?? "este produto"}. Essa alteração não exclui o atributo global.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={unlinkMutation.isPending} aria-busy={unlinkMutation.isPending} onClick={(event) => {
              event.preventDefault();
              if (productAttributePendingUnlink?.id) unlinkMutation.mutate(productAttributePendingUnlink.id);
            }}>
              {unlinkMutation.isPending ? "Desvinculando..." : "Desvincular atributo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
    </AdminLayout>
  );
}
