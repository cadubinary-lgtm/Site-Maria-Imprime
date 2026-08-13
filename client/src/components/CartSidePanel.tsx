import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { X, ShoppingCart, Minus, Plus, Trash2, Package, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderItemSpecs } from "@/components/OrderItemSpecs";

interface CartItem {
  id: number;
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
  forecastDate: string | null;
  forecastLabel: string | null;
  cepDestino: string | null;
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function CartSidePanel() {
  const { isOpen, closeCart } = useCartDrawer();
  const [, setLocation] = useLocation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.cart.getItems.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => {
      utils.cart.getItems.invalidate();
      utils.cart.getCount.invalidate();
      setUpdatingId(null);
    },
    onError: () => setUpdatingId(null),
  });

  const removeItem = trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      utils.cart.getItems.invalidate();
      utils.cart.getCount.invalidate();
    },
  });

  if (!isOpen) return null;

  const cartItems = items as CartItem[];
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.priceAtCart) * item.quantity, 0);
  const firstItem = cartItems[0];
  const shippingPrice = firstItem ? Number(firstItem.shippingPrice ?? 0) : 0;
  const shippingLabel = firstItem?.shippingLabel ?? null;
  const total = subtotal + shippingPrice;
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = async (id: number, qty: number) => {
    if (qty < 1) return;
    setUpdatingId(id);
    await updateQty.mutateAsync({ id, quantity: qty });
  };

  const handleRemove = async (id: number) => {
    setUpdatingId(id);
    await removeItem.mutateAsync({ id });
    setUpdatingId(null);
  };

  const handleCheckout = () => {
    closeCart();
    setLocation("/checkout");
  };

  return (
    <div className="w-[30%] min-w-[320px] max-w-[420px] flex-shrink-0 sticky top-0 h-screen overflow-y-auto bg-white border-l border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-pink-500" />
          <h2 className="font-bold text-gray-900">Meu Carrinho</h2>
          {itemCount > 0 && (
            <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
        <button
          onClick={closeCart}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
          title="Fechar carrinho"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
            <p className="text-sm text-gray-400 mt-1">Adicione produtos para continuar</p>
            <button
              onClick={closeCart}
              className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium underline"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => {
              const isPendingSync = item.id < 0;
              const isUpdating = updatingId === item.id || isPendingSync;
              const subtotalItem = Number(item.priceAtCart) * item.quantity;
              const isExpanded = expandedItems.has(item.id);
              const toggleExpand = () => setExpandedItems(prev => {
                const next = new Set(prev);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              });
              return (
                <div key={item.id} className="py-4">
                  {/* Produto: imagem + nome */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={toggleExpand}
                        className="flex items-center gap-1 w-full text-left"
                      >
                        <p className="font-semibold text-gray-900 text-sm leading-tight flex-1">{item.productName}</p>
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <p className="text-xs text-gray-500 mt-0.5">{fmt(Number(item.priceAtCart))} / {item.unit}</p>
                    </div>
                  </div>

                  {/* Especificações detalhadas — recolhidas por padrão */}
                  <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? "max-h-96 mb-3" : "max-h-0"}`}>
                    <div className="text-xs pt-1">
                      <OrderItemSpecs
                        customDimensions={item.customDimensions}
                        variationSnapshot={item.variationSnapshot}
                        selectedAttributes={item.selectedAttributes}
                        artFileUrl={item.artFileUrl}
                        notes={item.notes}
                        prazoName={item.prazoName}
                        forecastLabel={item.forecastLabel}
                        shippingLabel={item.shippingLabel}
                        shippingPrice={item.shippingPrice}
                      />
                    </div>
                  </div>

                  {/* Quantidade + subtotal + remover */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center font-semibold text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-pink-600 text-sm">{fmt(subtotalItem)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(item.id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer com totais e checkout */}
      {cartItems.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-white sticky bottom-0 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frete</span>
              <span className={shippingPrice === 0 ? "text-green-600 font-medium" : "font-medium"}>
                {shippingPrice === 0
                  ? shippingLabel ?? "A calcular"
                  : fmt(shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-pink-600">{fmt(total)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cartItems.some(item => item.id < 0)}
            className="w-full bg-pink-600 hover:bg-pink-700 active:bg-pink-800 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm"
          >
            {cartItems.some(item => item.id < 0) ? "Adicionando item..." : "Finalizar Pedido →"}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Compra 100% segura. Seus dados estão protegidos.</span>
          </div>
        </div>
      )}
    </div>
  );
}
