import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Check, FileText, Globe2, ListFilter, Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FOOTER_CONTENT_FALLBACK, getDefaultPublicDocuments, mergeManagedDocuments, parseFooterProductSegmentIds, type ManagedPublicDocument } from "@/lib/siteContent";

type FooterForm = typeof FOOTER_CONTENT_FALLBACK;

const DOCUMENT_LIMIT = 50_000;
const MAX_FOOTER_PRODUCT_SEGMENTS = 8;
const FOOTER_FIELD_LIMITS = {
  introduction: 1000,
  newsletterTitle: 120,
  newsletterDescription: 1000,
  businessHours: 1000,
  documentsTitle: 160,
  documentsDescription: 1000,
} as const;

export default function AdminFooterInformation() {
  const utils = trpc.useUtils();
  const { data: savedFooter, isLoading: isLoadingFooter } = trpc.siteContent.getAdminFooter.useQuery();
  const { data: savedDocuments, isLoading: isLoadingDocuments } = trpc.siteContent.getAdminDocuments.useQuery();
  const { data: allSegments = [], isLoading: isLoadingSegments } = trpc.segments.list.useQuery();
  const saveFooter = trpc.siteContent.saveFooter.useMutation();
  const saveDocuments = trpc.siteContent.saveDocuments.useMutation();
  const saveFooterProductSegments = trpc.siteContent.saveFooterProductSegments.useMutation();
  const [footer, setFooter] = useState<FooterForm>(FOOTER_CONTENT_FALLBACK);
  const [documents, setDocuments] = useState<ManagedPublicDocument[]>(getDefaultPublicDocuments());
  const [footerProductSegmentIds, setFooterProductSegmentIds] = useState<number[]>([]);

  useEffect(() => {
    if (!savedFooter) return;
    setFooter({
      introduction: savedFooter.introduction ?? FOOTER_CONTENT_FALLBACK.introduction,
      newsletterTitle: savedFooter.newsletterTitle ?? FOOTER_CONTENT_FALLBACK.newsletterTitle,
      newsletterDescription: savedFooter.newsletterDescription ?? FOOTER_CONTENT_FALLBACK.newsletterDescription,
      businessHours: savedFooter.businessHours ?? FOOTER_CONTENT_FALLBACK.businessHours,
      documentsTitle: savedFooter.documentsTitle ?? FOOTER_CONTENT_FALLBACK.documentsTitle,
      documentsDescription: savedFooter.documentsDescription ?? FOOTER_CONTENT_FALLBACK.documentsDescription,
    });
  }, [savedFooter]);

  useEffect(() => {
    if (savedDocuments) setDocuments(mergeManagedDocuments(savedDocuments));
  }, [savedDocuments]);

  useEffect(() => {
    if (!savedFooter || allSegments.length === 0) return;
    const persistedIds = parseFooterProductSegmentIds(savedFooter.footerProductSegmentIds);
    setFooterProductSegmentIds(persistedIds.length > 0 ? persistedIds : allSegments.slice(0, Math.min(5, MAX_FOOTER_PRODUCT_SEGMENTS)).map((segment) => segment.id));
  }, [allSegments, savedFooter]);

  const isLoading = isLoadingFooter || isLoadingDocuments || isLoadingSegments;
  const activeDocuments = useMemo(() => documents.filter((document) => document.isPublished).length, [documents]);
  const selectedFooterSegments = useMemo(() => footerProductSegmentIds.flatMap((id) => {
    const segment = allSegments.find((item) => item.id === id);
    return segment ? [segment] : [];
  }), [allSegments, footerProductSegmentIds]);

  const setFooterField = <K extends keyof FooterForm>(field: K, value: FooterForm[K]) => setFooter((current) => ({ ...current, [field]: value }));
  const updateDocument = (slug: string, patch: Partial<ManagedPublicDocument>) => setDocuments((current) => current.map((document) => document.slug === slug ? { ...document, ...patch } : document));

  const toggleFooterSegment = (segmentId: number) => {
    setFooterProductSegmentIds((current) => {
      if (current.includes(segmentId)) {
        if (current.length === 1) {
          toast.error("Mantenha ao menos um segmento no rodapé.", { position: "top-right", id: "footer-product-segments-minimum" });
          return current;
        }
        return current.filter((id) => id !== segmentId);
      }
      if (current.length >= MAX_FOOTER_PRODUCT_SEGMENTS) {
        toast.error(`Escolha no máximo ${MAX_FOOTER_PRODUCT_SEGMENTS} segmentos para o rodapé.`, { position: "top-right", id: "footer-product-segments-limit" });
        return current;
      }
      return [...current, segmentId];
    });
  };

  const moveFooterSegment = (segmentId: number, direction: -1 | 1) => setFooterProductSegmentIds((current) => {
    const index = current.indexOf(segmentId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  });

  const handleSaveFooter = async () => {
    const invalidField = (Object.keys(FOOTER_FIELD_LIMITS) as Array<keyof FooterForm>).find((field) => {
      const value = footer[field].trim();
      return !value || value.length > FOOTER_FIELD_LIMITS[field];
    });
    if (invalidField) {
      const labels: Record<keyof FooterForm, string> = {
        introduction: "Apresentação da marca",
        newsletterTitle: "Título da newsletter",
        newsletterDescription: "Descrição da newsletter",
        businessHours: "Horários de atendimento",
        documentsTitle: "Título da Central de documentação",
        documentsDescription: "Descrição da Central de documentação",
      };
      toast.error(`Revise o campo “${labels[invalidField]}” antes de salvar.`, { position: "top-right", id: "site-footer-content-validation-error" });
      return;
    }
    try {
      await saveFooter.mutateAsync(footer);
      await Promise.all([utils.siteContent.getAdminFooter.invalidate(), utils.siteContent.getPublicFooter.invalidate()]);
      toast.success("Informações do rodapé salvas", { description: "Os textos públicos do rodapé e da Central de documentação foram atualizados.", position: "top-right", duration: 3500, id: "site-footer-content-save" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar as informações do rodapé", { position: "top-right", id: "site-footer-content-save-error" });
    }
  };

  const handleSaveDocuments = async () => {
    try {
      await saveDocuments.mutateAsync(documents.map((document, position) => ({ ...document, position })));
      await Promise.all([utils.siteContent.getAdminDocuments.invalidate(), utils.siteContent.getPublicDocuments.invalidate()]);
      toast.success("Documentos públicos salvos", { description: `${documents.length} documentos foram atualizados para a Central de documentação.`, position: "top-right", duration: 3500, id: "site-documents-save" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar os documentos", { position: "top-right", id: "site-documents-save-error" });
    }
  };

  const handleSaveFooterProductSegments = async () => {
    if (footerProductSegmentIds.length === 0) return;
    try {
      await saveFooterProductSegments.mutateAsync({ segmentIds: footerProductSegmentIds });
      await Promise.all([utils.siteContent.getAdminFooter.invalidate(), utils.siteContent.getPublicFooter.invalidate()]);
      toast.success("Produtos do rodapé salvos", { description: `${footerProductSegmentIds.length} segmentos serão exibidos na coluna Produtos.`, position: "top-right", duration: 3500, id: "footer-product-segments-save" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar os produtos do rodapé", { position: "top-right", id: "footer-product-segments-save-error" });
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-pink-100 p-3 text-pink-600"><Globe2 className="h-7 w-7" /></div><div><p className="text-sm font-semibold text-pink-600">Configurações do site</p><h1 className="text-2xl font-bold text-slate-900">Informações do rodapé</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Edite textos do rodapé e os documentos exibidos individualmente na Central de documentação.</p></div></div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><a href="/admin/configuracoes-site/normas-de-arte" className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-pink-600 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"><FileText className="h-4 w-4" aria-hidden="true" />Editar Normas para envio de arte</a><div className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-right"><p className="text-xs text-slate-500">Documentos visíveis</p><p className="text-xl font-bold text-slate-900">{activeDocuments}/{documents.length}</p></div></div>
        </section>

        {isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-pink-600" /></div> : <>
          <Card className="overflow-hidden">
            <Accordion type="multiple">
              <AccordionItem value="footer-copy" className="border-0">
                <AccordionTrigger aria-label="Expandir ou encolher textos institucionais do rodapé" className="px-6 py-5 hover:bg-pink-50/60 hover:no-underline">
                  <div className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-pink-600" /><div><CardTitle>Textos institucionais do rodapé</CardTitle><CardDescription>Estes campos são exibidos no rodapé e no cabeçalho da Central de documentação.</CardDescription></div></div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-100">
                  <CardContent className="grid gap-5 p-6 lg:grid-cols-2">
                    <div className="space-y-2 lg:col-span-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="footer-introduction">Apresentação da marca</Label><span id="footer-introduction-count" className="text-xs text-slate-500">{footer.introduction.length}/{FOOTER_FIELD_LIMITS.introduction}</span></div><Textarea id="footer-introduction" value={footer.introduction} maxLength={FOOTER_FIELD_LIMITS.introduction} aria-describedby="footer-introduction-count" onChange={(event) => setFooterField("introduction", event.target.value)} rows={3} /></div>
                    <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="newsletter-title">Título da newsletter</Label><span id="newsletter-title-count" className="text-xs text-slate-500">{footer.newsletterTitle.length}/{FOOTER_FIELD_LIMITS.newsletterTitle}</span></div><Input id="newsletter-title" value={footer.newsletterTitle} maxLength={FOOTER_FIELD_LIMITS.newsletterTitle} aria-describedby="newsletter-title-count" onChange={(event) => setFooterField("newsletterTitle", event.target.value)} /></div>
                    <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="newsletter-description">Descrição da newsletter</Label><span id="newsletter-description-count" className="text-xs text-slate-500">{footer.newsletterDescription.length}/{FOOTER_FIELD_LIMITS.newsletterDescription}</span></div><Input id="newsletter-description" value={footer.newsletterDescription} maxLength={FOOTER_FIELD_LIMITS.newsletterDescription} aria-describedby="newsletter-description-count" onChange={(event) => setFooterField("newsletterDescription", event.target.value)} /></div>
                    <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="business-hours">Horários de atendimento</Label><span id="business-hours-count" className="text-xs text-slate-500">{footer.businessHours.length}/{FOOTER_FIELD_LIMITS.businessHours}</span></div><Textarea id="business-hours" value={footer.businessHours} maxLength={FOOTER_FIELD_LIMITS.businessHours} aria-describedby="business-hours-count" onChange={(event) => setFooterField("businessHours", event.target.value)} rows={3} placeholder="Uma linha por período de atendimento" /></div>
                    <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="documents-title">Título da Central de documentação</Label><span id="documents-title-count" className="text-xs text-slate-500">{footer.documentsTitle.length}/{FOOTER_FIELD_LIMITS.documentsTitle}</span></div><Input id="documents-title" value={footer.documentsTitle} maxLength={FOOTER_FIELD_LIMITS.documentsTitle} aria-describedby="documents-title-count" onChange={(event) => setFooterField("documentsTitle", event.target.value)} /></div>
                    <div className="space-y-2 lg:col-span-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="documents-description">Descrição da Central de documentação</Label><span id="documents-description-count" className="text-xs text-slate-500">{footer.documentsDescription.length}/{FOOTER_FIELD_LIMITS.documentsDescription}</span></div><Textarea id="documents-description" value={footer.documentsDescription} maxLength={FOOTER_FIELD_LIMITS.documentsDescription} aria-describedby="documents-description-count" onChange={(event) => setFooterField("documentsDescription", event.target.value)} rows={2} /></div>
                    <div className="flex justify-end lg:col-span-2"><Button onClick={handleSaveFooter} disabled={saveFooter.isPending} aria-busy={saveFooter.isPending} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300">{saveFooter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Salvar textos do rodapé</Button></div>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="overflow-hidden">
            <Accordion type="multiple">
              <AccordionItem value="public-documents" className="border-0">
                <AccordionTrigger aria-label="Expandir ou encolher documentos e links públicos" className="px-6 py-5 hover:bg-pink-50/60 hover:no-underline">
                  <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-pink-600" /><div><CardTitle>Documentos e links públicos</CardTitle><CardDescription>Edite o título, o resumo, o conteúdo e a visibilidade de cada página da Central de documentação.</CardDescription></div></div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-100">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-600">Abra somente o documento que deseja editar.</p><a className="text-sm font-semibold text-pink-600 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" href="/documentos" target="_blank" rel="noopener noreferrer">Ver Central pública</a></div>
                    <Accordion type="multiple" className="space-y-3">
                      {documents.map((document) => <AccordionItem key={document.slug} value={document.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 px-0">
                        <AccordionTrigger aria-label={`Expandir ou encolher ${document.title}`} className="px-5 py-4 hover:bg-pink-50/60 hover:no-underline"><div className="min-w-0 text-left"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{document.title}</h2>{document.slug === "normas-envio-arte" && <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">Normas de arte</span>}</div><p className="mt-1 text-xs text-slate-500">/documentos/{document.slug}</p></div></AccordionTrigger>
                        <AccordionContent className="border-t border-slate-200"><div className="space-y-4 p-5"><div className="flex items-center justify-end gap-3"><Label htmlFor={`document-visible-${document.slug}`} className="text-sm text-slate-600">Exibir na Central</Label><Switch id={`document-visible-${document.slug}`} checked={document.isPublished} onCheckedChange={(checked) => updateDocument(document.slug, { isPublished: checked })} /></div><div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor={`document-title-${document.slug}`}>Título</Label><Input id={`document-title-${document.slug}`} value={document.title} maxLength={255} onChange={(event) => updateDocument(document.slug, { title: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`document-summary-${document.slug}`}>Resumo do card</Label><Input id={`document-summary-${document.slug}`} value={document.summary} maxLength={500} onChange={(event) => updateDocument(document.slug, { summary: event.target.value })} /></div><div className="space-y-2 lg:col-span-2"><div className="flex items-center justify-between"><Label htmlFor={`document-content-${document.slug}`}>Conteúdo do documento</Label><span id={`document-content-count-${document.slug}`} className="text-xs text-slate-500">{document.content.length}/{DOCUMENT_LIMIT}</span></div><Textarea id={`document-content-${document.slug}`} value={document.content} maxLength={DOCUMENT_LIMIT} aria-describedby={`document-content-count-${document.slug}`} onChange={(event) => updateDocument(document.slug, { content: event.target.value })} rows={12} /></div></div></div></AccordionContent>
                      </AccordionItem>)}
                    </Accordion>
                    <div className="flex justify-end"><Button onClick={handleSaveDocuments} disabled={saveDocuments.isPending} aria-busy={saveDocuments.isPending} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300">{saveDocuments.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Salvar documentos públicos</Button></div>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="overflow-hidden">
            <Accordion type="multiple">
              <AccordionItem value="footer-products" className="border-0">
                <AccordionTrigger aria-label="Expandir ou encolher produtos exibidos no rodapé" className="px-6 py-5 hover:bg-pink-50/60 hover:no-underline">
                  <div className="flex items-center gap-3"><ListFilter className="h-5 w-5 text-pink-600" /><div><CardTitle>Produtos exibidos no rodapé</CardTitle><CardDescription>Escolha e ordene os segmentos que aparecem na coluna Produtos da loja.</CardDescription></div></div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-100">
                  <CardContent className="space-y-6 p-6">
                    <div className="flex flex-col gap-3 rounded-xl border border-pink-100 bg-pink-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">Seleção do rodapé</p><p className="mt-1 text-sm text-slate-600">Escolha de 1 a {MAX_FOOTER_PRODUCT_SEGMENTS} segmentos. A ordem abaixo será a mesma exibida no site.</p></div><span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-bold text-pink-600 shadow-sm">{selectedFooterSegments.length}/{MAX_FOOTER_PRODUCT_SEGMENTS}</span></div>
                    <div><p className="mb-3 text-sm font-semibold text-slate-900">Segmentos disponíveis</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{allSegments.map((segment) => { const selected = footerProductSegmentIds.includes(segment.id); return <button key={segment.id} type="button" onClick={() => toggleFooterSegment(segment.id)} aria-pressed={selected} className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${selected ? "border-pink-500 bg-pink-50 text-pink-700" : "border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50/50"}`}><span className="truncate pr-3">{segment.name}</span>{selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}</button>; })}</div></div>
                    <div><p className="mb-3 text-sm font-semibold text-slate-900">Ordem no rodapé</p><div className="space-y-2">{selectedFooterSegments.map((segment, index) => <div key={segment.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{segment.name}</span><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => moveFooterSegment(segment.id, -1)} disabled={index === 0} aria-label={`Mover ${segment.name} para cima`}><ArrowUp className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => moveFooterSegment(segment.id, 1)} disabled={index === selectedFooterSegments.length - 1} aria-label={`Mover ${segment.name} para baixo`}><ArrowDown className="h-4 w-4" /></Button></div></div>)}</div></div>
                    <div className="flex justify-end"><Button onClick={handleSaveFooterProductSegments} disabled={saveFooterProductSegments.isPending || footerProductSegmentIds.length === 0} aria-busy={saveFooterProductSegments.isPending} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300">{saveFooterProductSegments.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Salvar produtos do rodapé</Button></div>
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          <Card className="border-slate-200"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 text-pink-600" /><div><h2 className="font-bold text-slate-900">Dados da empresa, contatos e redes sociais</h2><p className="mt-1 text-sm text-slate-600">Logo, CNPJ, endereço, telefone, e-mail e redes sociais continuam centralizados na tela de Dados da Empresa.</p></div></div><a href="/admin/dados-da-empresa" className="inline-flex items-center justify-center rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50">Abrir Dados da Empresa</a></CardContent></Card>
        </>}
      </div>
    </AdminLayout>
  );
}
