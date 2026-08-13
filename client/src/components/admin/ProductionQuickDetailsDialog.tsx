import { Link } from "wouter";
import { Loader2, Package, UserRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OperationalOrder = {
  id?: number;
  orderId?: number;
  orderNumber?: string;
  deliveryFullName?: string | null;
  guestName?: string | null;
  deliveryPhone?: string | null;
  createdAt?: string | number | Date | null;
};

function QuickOrderRow({ order, statusLabel }: { order: OperationalOrder; statusLabel: string }) {
  const orderId = order.orderId ?? order.id;
  const { data: detail, isLoading } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! },
    { enabled: Boolean(orderId) },
  );
  const products = ((detail as any)?.items ?? [])
    .map((item: any) => item.productName)
    .filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900">#{order.orderNumber ?? orderId}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600"><UserRound className="h-3 w-3" />{order.deliveryFullName || order.guestName || "Cliente não informado"}</p>
          {order.deliveryPhone && <p className="mt-0.5 text-xs text-gray-500">{order.deliveryPhone}</p>}
        </div>
        <Badge className="shrink-0 border border-pink-200 bg-pink-50 text-pink-700">{statusLabel}</Badge>
      </div>
      <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
        <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
        {isLoading ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Carregando produtos...</span> : <span>{products.length ? products.join(", ") : "Produto não informado"}</span>}
      </div>
      {orderId && (
        <div className="mt-3">
          <Link href={`/admin/pedidos/${orderId}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs">Ver pedido</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export function ProductionQuickDetailsDialog({
  open,
  onOpenChange,
  title,
  statusLabel,
  orders,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  statusLabel: string;
  orders: OperationalOrder[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-pink-600" />{title}</DialogTitle>
          <DialogDescription>{orders.length} item{orders.length !== 1 ? "s" : ""} neste status. Consulte os produtos e acesse o pedido completo quando necessário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {orders.length ? orders.map((order) => <QuickOrderRow key={order.orderId ?? order.id} order={order} statusLabel={statusLabel} />) : <p className="py-8 text-center text-sm text-gray-500">Nenhum item neste status.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
