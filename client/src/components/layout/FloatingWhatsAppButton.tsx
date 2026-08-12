import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { getCompanyWhatsAppMessage, getWhatsAppUrl, useCompanySettings, useWhatsAppButtonVisibility } from "@/hooks/useCompanySettings";

export function FloatingWhatsAppButton() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? Number(params.id) : undefined;
  const { data: product } = trpc.products.getById.useQuery({ id: productId! }, { enabled: Boolean(productId) });
  const { company } = useCompanySettings();
  const isVisible = useWhatsAppButtonVisibility(company);
  const { isOpen: isCartOpen } = useCartDrawer();

  if (!isVisible) return null;

  const message = getCompanyWhatsAppMessage(company, product?.name);
  const href = getWhatsAppUrl(company.whatsappNumber, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar pelo WhatsApp"
      title="Falar pelo WhatsApp"
      className={`fixed bottom-5 ${isCartOpen ? "right-5 lg:right-[31%]" : "right-5"} z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-[#20bd5b] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-200`}
    >
      <img src="/manus-storage/whastapp-branco_ab9ddb70.webp" alt="" className="h-7 w-7 object-contain" />
      <span className="sr-only">Falar pelo WhatsApp</span>
    </a>
  );
}
