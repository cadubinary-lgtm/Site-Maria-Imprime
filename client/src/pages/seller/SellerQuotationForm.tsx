import AdminQuotationForm from "@/pages/admin/AdminQuotationForm";
import SellerLayout from "@/components/seller/SellerLayout";

export default function SellerQuotationForm() {
  return (
    <SellerLayout
      title="Novo orçamento"
      description="Crie uma proposta completa vinculada automaticamente à sua carteira comercial."
    >
      <AdminQuotationForm />
    </SellerLayout>
  );
}
