import { PUBLIC_DOCUMENTS } from "@/components/TermsAcceptance";

export const FOOTER_CONTENT_FALLBACK = {
  introduction: "A Maria Imprime transforma suas ideias em comunicação visual com atenção aos detalhes, praticidade e qualidade em cada pedido.",
  newsletterTitle: "Fique por dentro!",
  newsletterDescription: "Receba novidades, promoções e dicas exclusivas da Maria Imprime.",
  businessHours: "Seg–Sex: 09:00 – 12:00 e 13:30 – 17:00\nSábado e domingo: fechado",
  documentsTitle: "Central de documentação",
  documentsDescription: "Consulte em páginas próprias os documentos, políticas e orientações da Maria Imprime.",
};

export function mergeFooterContent(overrides?: Partial<Record<keyof typeof FOOTER_CONTENT_FALLBACK, string | null>> | null) {
  return {
    introduction: overrides?.introduction ?? FOOTER_CONTENT_FALLBACK.introduction,
    newsletterTitle: overrides?.newsletterTitle ?? FOOTER_CONTENT_FALLBACK.newsletterTitle,
    newsletterDescription: overrides?.newsletterDescription ?? FOOTER_CONTENT_FALLBACK.newsletterDescription,
    businessHours: overrides?.businessHours ?? FOOTER_CONTENT_FALLBACK.businessHours,
    documentsTitle: overrides?.documentsTitle ?? FOOTER_CONTENT_FALLBACK.documentsTitle,
    documentsDescription: overrides?.documentsDescription ?? FOOTER_CONTENT_FALLBACK.documentsDescription,
  };
}

export const DOCUMENT_SUMMARIES: Record<string, string> = {
  "termos-venda": "Regras aplicáveis às compras e aos serviços da Maria Imprime.",
  "aprovacao-arte": "Orientações para conferir e aprovar a arte antes da produção.",
  "producao-prazos": "Informações sobre produção, prazos e condições necessárias.",
  "trocas-reembolsos": "Condições de troca, cancelamento e reembolso.",
  "privacidade-lgpd": "Como tratamos e protegemos seus dados pessoais.",
  "cookies": "Informações sobre o uso de cookies no site.",
  "uso-site": "Regras de uso dos canais digitais da Maria Imprime.",
  "faq": "Respostas para as dúvidas mais frequentes sobre pedidos e impressão.",
  "formas-pagamento": "Modalidades habilitadas, análise e condições de pagamento.",
  "entrega-retirada": "Modalidades de recebimento, estimativas de frete e retirada.",
};

type DocumentOverride = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  position: number;
  isPublished: boolean;
};

export type ManagedPublicDocument = DocumentOverride;

export function getDefaultPublicDocuments(): ManagedPublicDocument[] {
  return PUBLIC_DOCUMENTS.map((document, index) => ({
    slug: document.id,
    title: document.title,
    summary: DOCUMENT_SUMMARIES[document.id] || "Documento institucional da Maria Imprime.",
    content: document.content,
    position: index,
    isPublished: true,
  }));
}

export function mergeManagedDocuments(overrides?: DocumentOverride[] | null): ManagedPublicDocument[] {
  const saved = new Map((overrides ?? []).map((document) => [document.slug, document]));
  const defaults = getDefaultPublicDocuments().map((document) => saved.get(document.slug) ?? document);
  const additional = (overrides ?? []).filter((document) => !defaults.some((defaultDocument) => defaultDocument.slug === document.slug));
  return [...defaults, ...additional].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, "pt-BR"));
}

export function mergePublicDocuments(overrides?: DocumentOverride[] | null): ManagedPublicDocument[] {
  return mergeManagedDocuments(overrides).filter((document) => document.isPublished);
}
