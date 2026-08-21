import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getDefaultPublicDocuments, mergeManagedDocuments, type ManagedPublicDocument } from "@/lib/siteContent";
import { trpc } from "@/lib/trpc";

const SLUG = "normas-envio-arte";
const CONTENT_LIMIT = 50_000;

export default function AdminArtworkGuidelines() {
  const utils = trpc.useUtils();
  const { data: savedDocuments, isLoading } = trpc.siteContent.getAdminDocuments.useQuery();
  const saveDocuments = trpc.siteContent.saveDocuments.useMutation();
  const fallback = useMemo(() => getDefaultPublicDocuments().find((document) => document.slug === SLUG)!, []);
  const [document, setDocument] = useState<ManagedPublicDocument>(fallback);

  useEffect(() => {
    const saved = mergeManagedDocuments(savedDocuments).find((item) => item.slug === SLUG);
    if (saved) setDocument(saved);
  }, [savedDocuments]);

  const save = async () => {
    if (!document.title.trim() || !document.summary.trim() || !document.content.trim()) {
      toast.error("Preencha título, resumo e conteúdo antes de salvar.", { id: "artwork-guidelines-validation" });
      return;
    }
    try {
      const updated = mergeManagedDocuments(savedDocuments).map((item, position) => item.slug === SLUG ? { ...document, position } : { ...item, position });
      await saveDocuments.mutateAsync(updated);
      await Promise.all([utils.siteContent.getAdminDocuments.invalidate(), utils.siteContent.getPublicDocuments.invalidate()]);
      toast.success("Normas para envio de arte salvas", { description: "A página pública foi atualizada.", id: "artwork-guidelines-saved" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar as normas de arte.", { id: "artwork-guidelines-save-error" });
    }
  };

  return (
    <AdminLayout>
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-pink-100 p-3 text-pink-600"><FileText className="h-7 w-7" /></div><div><p className="text-sm font-semibold text-pink-600">Configurações do site</p><h1 className="text-2xl font-bold text-slate-900">Normas para envio de arte</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Edite a página que orienta o cliente antes de enviar a arte para impressão.</p></div></div>
          <a href={`/documentos/${SLUG}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"><ExternalLink className="h-4 w-4" />Ver página pública</a>
        </section>
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-pink-600" /></div>
        ) : (
          <Card>
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-pink-600" /><div><CardTitle>Conteúdo da página</CardTitle><CardDescription>Use títulos com hash, subtítulos e listas para organizar o texto.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50/60 px-4 py-3">
                <div><Label htmlFor="artwork-guidelines-published" className="font-semibold text-slate-900">Exibir página publicamente</Label><p className="mt-1 text-xs text-slate-600">Quando desativada, o link do configurador continuará disponível, mas a página não será encontrada pelo cliente.</p></div>
                <Switch id="artwork-guidelines-published" checked={document.isPublished} onCheckedChange={(isPublished) => setDocument((current) => ({ ...current, isPublished }))} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="artwork-guidelines-title">Título da página</Label><Input id="artwork-guidelines-title" value={document.title} maxLength={255} onChange={(event) => setDocument((current) => ({ ...current, title: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="artwork-guidelines-summary">Resumo</Label><Input id="artwork-guidelines-summary" value={document.summary} maxLength={500} onChange={(event) => setDocument((current) => ({ ...current, summary: event.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3"><Label htmlFor="artwork-guidelines-content">Orientações completas</Label><span className="text-xs text-slate-500">{`${document.content.length}/${CONTENT_LIMIT}`}</span></div>
                <Textarea id="artwork-guidelines-content" value={document.content} maxLength={CONTENT_LIMIT} rows={28} className="font-mono text-xs leading-6" onChange={(event) => setDocument((current) => ({ ...current, content: event.target.value }))} />
              </div>
              <div className="flex justify-end"><Button onClick={save} disabled={saveDocuments.isPending} aria-busy={saveDocuments.isPending} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300">{saveDocuments.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar normas de arte</Button></div>
            </CardContent>
          </Card>
        )}
      </main>
    </AdminLayout>
  );
}
