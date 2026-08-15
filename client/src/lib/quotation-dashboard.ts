import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle, FileText, Send } from "lucide-react";

export type QuotationDashboardKpis = {
  rascunhos: number;
  enviados: number;
  emNegociacao: number;
  aprovados: number;
  convertidos: number;
};

export type OperationalQuotationCard = {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: "gray" | "blue" | "amber" | "green";
};

export function getOperationalQuotationCards(kpis: QuotationDashboardKpis): OperationalQuotationCard[] {
  return [
    { label: "Para enviar", value: kpis.rascunhos, detail: "Rascunhos aguardando revisão", icon: FileText, tone: "gray" },
    { label: "Aguardando retorno", value: kpis.enviados + kpis.emNegociacao, detail: "Enviados ou em negociação", icon: Send, tone: "blue" },
    { label: "Prontos para converter", value: kpis.aprovados, detail: "Aprovados pelo cliente", icon: CheckCircle, tone: "green" },
    { label: "Convertidos em pedido", value: kpis.convertidos, detail: "Já iniciaram o fluxo de produção", icon: ArrowRight, tone: "amber" },
  ];
}

export function getQuotationProcedure(status: string, convertedOrderId?: number | null): string {
  if (convertedOrderId) return "Pedido criado: acompanhe o fluxo de produção";

  const procedures: Record<string, string> = {
    rascunho: "Revisar itens, valores e condições antes de enviar",
    enviado: "Acompanhar retorno do cliente",
    em_negociacao: "Registrar a negociação e atualizar a proposta",
    aprovado: "Converter em pedido para iniciar a produção",
    recusado: "Encerrado: manter apenas para histórico comercial",
    expirado: "Revisar validade ou duplicar para uma nova proposta",
    cancelado: "Encerrado: restaurar o status anterior se o cancelamento for desfeito",
  };

  return procedures[status] ?? "Acompanhar o status do orçamento";
}
