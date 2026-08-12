import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DOCUMENTS = [
  { title: "Termos e Condições de Venda", content: "Maria Imprime — Sua Gráfica Online\n\nAo concluir um pedido, o cliente declara que teve acesso aos Termos e Condições de Venda, compreendeu as regras aplicáveis à compra, está ciente das características dos produtos personalizados, das tolerâncias técnicas do processo gráfico e dos documentos disponibilizados nesta Central. A produção depende das condições aplicáveis ao pedido, incluindo pagamento, envio de arte, aprovação quando necessária e confirmação das especificações." },
  { title: "Termo de Aprovação de Arte", content: "Documento em preparação." },
  { title: "Política de Produção e Prazos", content: "Documento em preparação." },
  { title: "Política de Trocas, Cancelamentos e Reembolsos", content: "Documento em preparação." },
  { title: "Política de Privacidade (LGPD)", content: "Documento em preparação." },
  { title: "Política de Cookies", content: "Documento em preparação." },
  { title: "Termo de Uso do Site", content: "Documento em preparação." },
  { title: "Perguntas Frequentes (FAQ)", content: "Documento em preparação." },
];

export const TERMS_VERSION = "2026-08-12";

export function TermsAcceptance({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div id="terms" className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm">
    <div className="flex items-center gap-2">
      <Checkbox id="terms-checkbox" checked={checked} onCheckedChange={value => onCheckedChange(value === true)} />
      <Label htmlFor="terms-checkbox" className="text-sm cursor-pointer text-gray-700">Aceito os termos e condições</Label>
      <Dialog><DialogTrigger asChild><button type="button" className="text-sm font-semibold text-pink-600 hover:text-pink-700 underline underline-offset-2">Ler</button></DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>DOCUMENTAÇÃO DA MARIA IMPRIME</DialogTitle><DialogDescription>Para sua segurança e transparência, disponibilizamos os documentos que regulamentam compras, produção, impressão, arquivos, prazos, trocas, privacidade e utilização do site.</DialogDescription></DialogHeader>
          <Accordion type="single" collapsible className="w-full">{DOCUMENTS.map((document, index) => <AccordionItem key={document.title} value={`document-${index}`}><AccordionTrigger>{document.title}</AccordionTrigger><AccordionContent><p className="whitespace-pre-line text-sm leading-6 text-gray-600">{document.content}</p></AccordionContent></AccordionItem>)}</Accordion>
        </DialogContent>
      </Dialog>
    </div>
  </div>;
}
