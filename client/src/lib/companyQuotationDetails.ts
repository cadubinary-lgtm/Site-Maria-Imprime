export type CompanyQuotationData = {
  commercialPhone?: string | null;
  whatsappNumber?: string | null;
  supportEmail?: string | null;
  street?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export function formatCompanyContact(company?: CompanyQuotationData | null) {
  return [
    company?.commercialPhone,
    company?.whatsappNumber ? `WhatsApp: ${company.whatsappNumber}` : "",
    company?.supportEmail,
  ].filter(Boolean).join(" · ");
}

export function formatCompanyAddress(company?: CompanyQuotationData | null) {
  const cityState = [company?.city, company?.state].filter(Boolean).join("/");
  return [
    company?.street,
    company?.addressNumber ? `Nº ${company.addressNumber}` : "",
    company?.neighborhood,
    cityState,
    company?.zipCode ? `CEP ${company.zipCode}` : "",
  ].filter(Boolean).join(" · ");
}
