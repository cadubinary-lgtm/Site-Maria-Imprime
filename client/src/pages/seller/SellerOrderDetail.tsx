import { useRoute } from "wouter";
import SellerLayout from "@/components/seller/SellerLayout";
import { OrderDetailContent } from "@/pages/admin/AdminOrderDetail";

export default function SellerOrderDetail() {
  const [, params] = useRoute("/vendedor/pedidos/:id");
  const orderId = Number(params?.id);

  return (
    <SellerLayout title="Detalhes da venda" description="Acompanhe o pagamento, a produção e a entrega desta venda.">
      <OrderDetailContent
        orderId={Number.isFinite(orderId) ? orderId : null}
        backRoute="/vendedor/pedidos"
        backLabel="Voltar para Meus Pedidos"
        sellerMode
      />
    </SellerLayout>
  );
}
