import { trpc } from "@/lib/trpc";

export const COMPANY_SETTINGS_FALLBACK = {
  legalName: "Carlos Eduardo Barreto Novaes Pinheiro - ME",
  tradeName: "Maria Imprime / Gráfica Ponto Digital",
  cnpj: "34.528.399/0001-08",
  stateRegistration: "",
  commercialPhone: "(22) 99945-9596",
  whatsappNumber: "5522999459596",
  showWhatsappButton: true,
  supportEmail: "contatomariaimprime@gmail.com",
  zipCode: "28908-200",
  street: "Avenida Antonio Ferreira dos Santos",
  addressNumber: "651",
  neighborhood: "Braga",
  city: "Cabo Frio",
  state: "RJ",
  printLogoUrl: "/manus-storage/logo-maria-imprime_acc5585b.webp",
  printLogoKey: "logo-maria-imprime_acc5585b.webp",
  nextOsNumber: 1001,
  osTerms: "Confira todas as informações antes de iniciar a produção. Prazos começam a contar após aprovação da arte. Alterações solicitadas após o início da produção podem gerar custos adicionais. Em caso de dúvidas, entre em contato com nosso atendimento.",
};

export function useCompanySettings() {
  const query = trpc.companySettings.getPublic.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    ...query,
    company: query.data ?? COMPANY_SETTINGS_FALLBACK,
  };
}

export function getWhatsAppUrl(whatsappNumber: string | null | undefined, message?: string) {
  const number = (whatsappNumber || COMPANY_SETTINGS_FALLBACK.whatsappNumber).replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

export function getCompanyAddressLine(company: Pick<typeof COMPANY_SETTINGS_FALLBACK, "street" | "addressNumber">) {
  return `${company.street}, ${company.addressNumber}`;
}

export function getCompanyLocationLine(company: Pick<typeof COMPANY_SETTINGS_FALLBACK, "neighborhood" | "city" | "state">) {
  return `${company.neighborhood} - ${company.city} - ${company.state}`;
}
