import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { trpc } from "@/lib/trpc";
import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export function MiniCartDrawer() {
  const { isOpen, closeCart } = useCartDrawer();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.cart.getItems.useQuery(undefined, {
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  const removeItem = trpc.cart.removeItem.useMutation({
    onSuccess: () => utils.cart.getItems.invalidate(),
  });

  const updateQty = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.getItems.invalidate(),
  });

  const cartItems = items as any[];
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    return sum + parseFloat(item.unitPrice || "0") * (item.quantity || 1);
  }, 0);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleCheckout = () => {
    closeCart();
    setLocation("/checkout");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-pink-500" />
            <h2 className="font-bold text-gray-900">Meu Carrinho</h2>
            {cartItems.length > 0 && (
              <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {cartItems.length}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
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
            cartItems.map((item: any) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-3">
                  {item.productImageUrl && (
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="w-14 h-14 object-contain rounded-lg border border-gray-100 bg-white flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                    {item.selectedOptions && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {typeof item.selectedOptions === "string"
                          ? item.selectedOptions
                          : JSON.stringify(item.selectedOptions)}
                      </p>
                    )}
                    <p className="text-sm font-bold text-pink-600 mt-1">
                      {fmt(parseFloat(item.unitPrice || "0") * (item.quantity || 1))}
                    </p>
                  </div>
                 <button
                   onClick={() => removeItem.mutate({ id: item.id })}
                   className="text-gray-400 hover:text-red-500 transition flex-shrink-0 self-start"
                 >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* Quantidade */}
                <div className="flex items-center gap-2">
                  <button
                   onClick={() => updateQty.mutate({ id: item.id, quantity: Math.max(1, (item.quantity || 1) - 1) })}
                   className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity || 1}</span>
                  <button
                   onClick={() => updateQty.mutate({ id: item.id, quantity: (item.quantity || 1) + 1 })}
                   className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">{fmt(subtotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Finalizar Pedido →
            </button>
            <Link href="/carrinho">
              <button
                onClick={closeCart}
                className="w-full text-sm text-center text-gray-500 hover:text-gray-700 transition py-1"
              >
                Ver carrinho completo
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
