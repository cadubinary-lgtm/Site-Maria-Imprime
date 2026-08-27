import SellerLayout from "@/components/seller/SellerLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
const currency = (value: unknown) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const commissionLabels: Record<string, string> = { prevista: "Prevista", a_pagar: "A pagar", paga: "Paga", cancelada: "Cancelada" };
export default function SellerOrders() {
  const { data, isLoading } = trpc.sellers.seller.orders.useQuery({});
  const { data: summary } = trpc.sellers.seller.summary.useQuery();
  return <SellerLayout title="Meus Pedidos / Minhas Vendas" description="Acompanhe somente as vendas realizadas por você e suas comissões.">
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Comissões a receber</p><p className="mt-1 text-2xl font-bold text-amber-600">{currency(summary?.a_pagar)}</p><p className="mt-1 text-xs text-slate-500">Pedidos com pagamento confirmado.</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-sm text-slate-500">Comissões recebidas</p><p className="mt-1 text-2xl font-bold text-emerald-600">{currency(summary?.paga)}</p><p className="mt-1 text-xs text-slate-500">Valores baixados pelo Superadmin.</p></CardContent></Card>
    </div>
    <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Data</th><th className="p-4">Status</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Comissão</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando vendas...</td></tr> : data?.length ? data.map((order: any) => <tr key={order.id} className="border-t border-slate-100"><td className="p-4 font-medium">{order.orderNumber}</td><td className="p-4"><p>{order.clientName ?? "Cliente"}</p>{order.customerEmail && <p className="mt-0.5 text-xs text-slate-500">{order.customerEmail}</p>}</td><td className="p-4 text-slate-600">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "—"}</td><td className="p-4"><Badge variant={order.paymentStatus === "pago" ? "default" : "secondary"}>{String(order.status).replaceAll("_", " ")}</Badge></td><td className="p-4 text-right font-semibold">{currency(order.total)}</td><td className="p-4 text-right"><p className="font-semibold">{order.commissionAmount == null ? "—" : currency(order.commissionAmount)}</p>{order.commissionStatus && <p className="mt-0.5 text-xs text-slate-500">{commissionLabels[order.commissionStatus] ?? order.commissionStatus}</p>}</td></tr>) : <tr><td colSpan={6} className="p-8 text-center text-slate-500">Você ainda não possui vendas na carteira.</td></tr>}</tbody></table></div></CardContent></Card>
  </SellerLayout>;
}
