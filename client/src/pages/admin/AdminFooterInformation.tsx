import { useEffect, useMemo, useState } from "react";
import { Building2, FileText, Globe2, Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FOOTER_CONTENT_FALLBACK, getDefaultPublicDocuments, mergeManagedDocuments, type ManagedPublicDocument } from "@/lib/siteContent";

type FooterForm = typeof FOOTER_CONTENT_FALLBACK;

const DOCUMENT_LIMIT = 50_000;

export default function AdminFooterInformation() {
  const utils = trpc.useUtils();
  const { data: savedFooter, isLoading: isLoadingFooter } = trpc.siteContent.getAdminFooter.useQuery();
  const { data: savedDocuments, isLoading: isLoadingDocuments } = trpc.siteContent.getAdminDocuments.useQuery();
  const saveFooter = trpc.siteContent.saveFooter.useMutation();
  const saveDocuments = trpc.siteContent.saveDocuments.useMutation();
  const [footer, setFooter] = useState<FooterForm>(FOOTER_CONTENT_FALLBACK);
  const [documents, setDocuments] = useState<ManagedPublicDocument[]>(getDefaultPublicDocuments());

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

  const isLoading = isLoadingFooter || isLoadingDocuments;
  const activeDocuments = useMemo(() => documents.filter((document) => document.isPublished).length, [documents]);

  const setFooterField = <K extends keyof FooterForm>(field: K, value: FooterForm[K]) => setFooter((current) => ({ ...current, [field]: value }));
  const updateDocument = (slug: string, patch: Partial<ManagedPublicDocument>) => setDocuments((current) => current.map((document) => document.slug === slug ? { ...document, ...patch } : document));

  const handleSaveFooter = async () => {
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

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-pink-100 p-3 text-pink-600"><Globe2 className="h-7 w-7" /></div><div><p className="text-sm font-semibold text-pink-600">Configurações do site</p><h1 className="text-2xl font-bold text-slate-900">Informações do rodapé</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Edite textos do rodapé e os documentos exibidos individualmente na Central de documentação.</p></div></div>
          <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-right"><p className="text-xs text-slate-500">Documentos visíveis</p><p className="text-xl font-bold text-slate-900">{activeDocuments}/{documents.length}</p></div>
        </section>

        {isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-pink-600" /></div> : <>
          <Card>
            <CardHeader className="border-b border-slate-100"><div className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-pink-600" /><div><CardTitle>Textos institucionais do rodapé</CardTitle><CardDescription>Estes campos são exibidos no rodapé e no cabeçalho da Central de documentação.</CardDescription></div></div></CardHeader>
            <CardContent className="grid gap-5 pt-6 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2"><Label htmlFor="footer-introduction">Apresentação da marca</Label><Textarea id="footer-introduction" value={footer.introduction} onChange={(event) => setFooterField("introduction", event.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label htmlFor="newsletter-title">Título da newsletter</Label><Input id="newsletter-title" value={footer.newsletterTitle} onChange={(event) => setFooterField("newsletterTitle", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="newsletter-description">Descrição da newsletter</Label><Input id="newsletter-description" value={footer.newsletterDescription} onChange={(event) => setFooterField("newsletterDescription", event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="business-hours">Horários de atendimento</Label><Textarea id="business-hours" value={footer.businessHours} onChange={(event) => setFooterField("businessHours", event.target.value)} rows={3} placeholder="Uma linha por período de atendimento" /></div>
              <div className="space-y-2"><Label htmlFor="documents-title">Título da Central de documentação</Label><Input id="documents-title" value={footer.documentsTitle} onChange={(event) => setFooterField("documentsTitle", event.target.value)} /></div>
              <div className="space-y-2 lg:col-span-2"><Label htmlFor="documents-description">Descrição da Central de documentação</Label><Textarea id="documents-description" value={footer.documentsDescription} onChange={(event) => setFooterField("documentsDescription", event.target.value)} rows={2} /></div>
              <div className="flex justify-end lg:col-span-2"><Button onClick={handleSaveFooter} disabled={saveFooter.isPending}>{saveFooter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar textos do rodapé</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-100"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-pink-600" /><div><CardTitle>Documentos e links públicos</CardTitle><CardDescription>Edite o título, o resumo, o conteúdo e a visibilidade de cada página da Central de documentação.</CardDescription></div></div><a className="text-sm font-semibold text-pink-600 hover:text-pink-700" href="/documentos" target="_blank" rel="noreferrer">Ver Central pública</a></div></CardHeader>
            <CardContent className="space-y-5 pt-6">
              {documents.map((document) => <section key={document.slug} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">{document.title}</h2><p className="mt-1 text-xs text-slate-500">/documentos/{document.slug}</p></div><div className="flex items-center gap-3"><Label htmlFor={`document-visible-${document.slug}`} className="text-sm text-slate-600">Exibir na Central</Label><Switch id={`document-visible-${document.slug}`} checked={document.isPublished} onCheckedChange={(checked) => updateDocument(document.slug, { isPublished: checked })} /></div></div>
                <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor={`document-title-${document.slug}`}>Título</Label><Input id={`document-title-${document.slug}`} value={document.title} onChange={(event) => updateDocument(document.slug, { title: event.target.value })} /></div><div className="space-y-2"><Label htmlFor={`document-summary-${document.slug}`}>Resumo do card</Label><Input id={`document-summary-${document.slug}`} value={document.summary} maxLength={500} onChange={(event) => updateDocument(document.slug, { summary: event.target.value })} /></div><div className="space-y-2 lg:col-span-2"><div className="flex items-center justify-between"><Label htmlFor={`document-content-${document.slug}`}>Conteúdo do documento</Label><span className="text-xs text-slate-500">{document.content.length}/{DOCUMENT_LIMIT}</span></div><Textarea id={`document-content-${document.slug}`} value={document.content} maxLength={DOCUMENT_LIMIT} onChange={(event) => updateDocument(document.slug, { content: event.target.value })} rows={12} /></div></div>
              </section>)}
              <div className="flex justify-end"><Button onClick={handleSaveDocuments} disabled={saveDocuments.isPending}>{saveDocuments.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar documentos públicos</Button></div>
            </CardContent>
          </Card>

          <Card className="border-slate-200"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 text-pink-600" /><div><h2 className="font-bold text-slate-900">Dados da empresa, contatos e redes sociais</h2><p className="mt-1 text-sm text-slate-600">Logo, CNPJ, endereço, telefone, e-mail e redes sociais continuam centralizados na tela de Dados da Empresa.</p></div></div><a href="/admin/dados-da-empresa" className="inline-flex items-center justify-center rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50">Abrir Dados da Empresa</a></CardContent></Card>
        </>}
      </div>
    </AdminLayout>
  );
}
