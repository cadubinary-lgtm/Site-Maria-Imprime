import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  AlertCircle,
  FileImage,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { OrderItemSpecs } from "@/components/OrderItemSpecs";

interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  selectedAttributes: string | null;
  customDimensions: string | null;
  priceAtCart: string;
  artFileUrl: string | null;
  notes: string | null;
  productName: string;
  productImage: string | null;
  calculationType: string;
  unit: string;
  shippingMethod: string | null;
  shippingPrice: string | null;
  shippingLabel: string | null;
  variationSnapshot: string | null;
  prazoName: string | null;
  prazoHours: number | null;
  urgencyRate: string | null;
  urgencyMultiplier: string | null;
  urgencyUnit: string | null;
  urgencySurcharge: string | null;
  forecastDate: string | null;
  forecastLabel: string | null;
  cepDestino: string | null;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function parseAttributes(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function parseVariations(json: string | null): Array<{name: string; value: string}> {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
  isRecalculating,
}: {
  item: CartItem;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  isUpdating: boolean;
  isRecalculating: boolean;
}) {
  const subtotal = Number(item.priceAtCart) * item.quantity;

  return (
    <div className="flex gap-3 lg:gap-4 py-3 lg:py-4 flex-col sm:flex-row">
      {/* Imagem */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 mx-auto sm:mx-0">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="font-medium text-gray-900 line-clamp-2">{item.productName}</p>

        {/* Especificações padronizadas em bloco vertical */}
        <div className="mt-2 mb-2">
          <OrderItemSpecs
            customDimensions={item.customDimensions}
            variationSnapshot={item.variationSnapshot}
            selectedAttributes={item.selectedAttributes}
            artFileUrl={item.artFileUrl}
            notes={item.notes}
            prazoName={item.prazoName}
            urgencyRate={item.urgencyRate}
            urgencyMultiplier={item.urgencyMultiplier}
            urgencyUnit={item.urgencyUnit}
            urgencySurcharge={item.urgencySurcharge}
            quantity={item.quantity}
            forecastLabel={item.forecastLabel}
            shippingLabel={item.shippingLabel}
            shippingPrice={item.shippingPrice}
          />
        </div>

        {/* Preço unitário */}
        <p className="text-sm text-gray-500 mt-1">
          {formatCurrency(item.priceAtCart)} / {item.unit}
        </p>
        {/* Indicador de recálculo de frete */}
        {isRecalculating && (
          <p className="text-xs text-blue-500 mt-1 animate-pulse">
            🔄 Recalculando frete...
          </p>
        )}

        {/* Controles de quantidade e subtotal */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Quantidade:</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isUpdating}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-orange-600" style={{ display: "none" }}>
              {formatCurrency(subtotal)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onRemove(item.id)}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { customer } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Carrinho funciona para todos: visitantes (cart_session), clientes (customer_session) e admin (session_token)
  const { data: items, isLoading, refetch } = trpc.cart.getItems.useQuery();

  const [recalculating, setRecalculating] = useState<number | null>(null);

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: async (_, variables) => {
      await refetch();
      // Verificar se o frete foi recalculado (item com CEP e transportadora)
      const item = cartItems.find(i => i.id === variables.id);
      if (item?.cepDestino && item?.shippingMethod && item.shippingMethod !== 'retirada' && !item.shippingMethod.startsWith('local_')) {
        toast.success("Quantidade e frete atualizados!");
      }
      setRecalculating(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar quantidade");
      setRecalculating(null);
    },
  });

  const removeItem = trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Item removido do carrinho");
    },
    onError: () => toast.error("Erro ao remover item"),
  });

  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Carrinho limpo");
    },
    onError: () => toast.error("Erro ao limpar carrinho"),
  });

  const handleUpdateQuantity = async (id: number, qty: number) => {
    if (qty < 1) return;
    setUpdatingId(id);
    // Verificar se o item tem frete por transportadora para mostrar indicador de recálculo
    const item = cartItems.find(i => i.id === id);
    if (item?.cepDestino && item?.shippingMethod && item.shippingMethod !== 'retirada' && !item.shippingMethod.startsWith('local_')) {
      setRecalculating(id);
    }
    await updateQty.mutateAsync({ id, quantity: qty });
    setUpdatingId(null);
  };

  const handleRemove = async (id: number) => {
    setUpdatingId(id);
    await removeItem.mutateAsync({ id });
    setUpdatingId(null);
  };

  // Carrinho agora é público - não bloqueia visitantes

  const cartItems = (items ?? []) as CartItem[];
  const subtotalItems = cartItems.reduce(
    (sum, item) => sum + Number(item.priceAtCart) * item.quantity,
    0
  );
  // Usar shippingPrice do primeiro item (todos os itens do mesmo pedido têm o mesmo frete)
  const firstItem = cartItems[0];
  const shippingPrice = firstItem ? Number(firstItem.shippingPrice ?? 0) : 0;
  const shippingLabel = firstItem?.shippingLabel ?? null;
  const total = subtotalItems + shippingPrice;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            Meu Carrinho
            {itemCount > 0 && (
              <Badge className="bg-orange-500 text-white">{itemCount}</Badge>
            )}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/catalogo")}
            className="text-gray-600 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Continuar comprando
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-20 h-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}

        {/* Carrinho vazio */}
        {!isLoading && cartItems.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-500 mb-6">
              Adicione produtos ao carrinho para continuar
            </p>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setLocation("/catalogo")}
            >
              Ver Produtos
            </Button>
          </div>
        )}

        {/* Carrinho com itens */}
        {!isLoading && cartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Lista de itens */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base lg:text-lg">
                    {cartItems.length} {cartItems.length === 1 ? "item" : "itens"}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => clearCart.mutate()}
                    disabled={clearCart.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar carrinho
                  </Button>
                </CardHeader>
                <CardContent>
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <CartItemCard
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemove}
                        isUpdating={updatingId === item.id}
                        isRecalculating={recalculating === item.id}
                      />
                      {index < cartItems.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Resumo do pedido */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
                    <span>{formatCurrency(subtotalItems)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Frete</span>
                    {shippingPrice === 0 ? (
                      <span className="text-green-600">{shippingLabel ?? "Retirar na Loja"} — Grátis</span>
                    ) : (
                      <span>{shippingLabel ?? "Frete"} — {formatCurrency(shippingPrice)}</span>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(total)}</span>
                  </div>

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 mt-2"
                    size="lg"
                    onClick={() => setLocation("/checkout")}
                  >
                    Finalizar Pedido
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    Pagamento e entrega serão confirmados na próxima etapa
                  </p>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-xs text-green-700 text-center">
                    🔒 Compra 100% segura. Seus dados estão protegidos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
