import { useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Download, FileUp, FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type TemplateFile = { fileName: string; fileUrl: string; fileKey: string; mimeType: string; fileSize: number };
type TemplateRecord = TemplateFile & { id: number; title: string; description: string | null; isPublished: boolean; position: number };
type Draft = { id?: number; title: string; description: string; isPublished: boolean; file: TemplateFile | null };

const EMPTY_DRAFT: Draft = { title: "", description: "", isPublished: true, file: null };
const MAX_TEMPLATE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "ai", "cdr", "psd", "eps", "jpg", "jpeg", "png", "gif", "webp", "svg", "tif", "tiff"]);

const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const extensionOf = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "arquivo";

export default function AdminPrintTemplates() {
  const utils = trpc.useUtils();
  const { data: templates = [], isLoading } = trpc.printTemplates.listAdmin.useQuery();
  const createTemplate = trpc.printTemplates.create.useMutation();
  const updateTemplate = trpc.printTemplates.update.useMutation();
  const reorderTemplates = trpc.printTemplates.reorder.useMutation();
  const removeTemplate = trpc.printTemplates.remove.useMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [isUploading, setIsUploading] = useState(false);
  const [templateToRemove, setTemplateToRemove] = useState<TemplateRecord | null>(null);

  const invalidateTemplates = async () => {
    await Promise.all([
      utils.printTemplates.listAdmin.invalidate(),
      utils.printTemplates.listPublic.invalidate(),
      utils.products.getAll.invalidate(),
    ]);
  };

  const openNewTemplate = () => {
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEditTemplate = (template: TemplateRecord) => {
    setDraft({
      id: template.id,
      title: template.title,
      description: template.description || "",
      isPublished: template.isPublished,
      file: { fileName: template.fileName, fileUrl: template.fileUrl, fileKey: template.fileKey, mimeType: template.mimeType, fileSize: template.fileSize },
    });
    setDialogOpen(true);
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      toast.error("Formato não suportado", { description: "Use PDF, AI, CDR, PSD, EPS, SVG ou imagem gráfica." });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_TEMPLATE_SIZE) {
      toast.error("Arquivo muito grande", { description: "O gabarito deve ter no máximo 25 MB." });
      event.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-art", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url || !payload.key) throw new Error(payload.error || "Não foi possível enviar o arquivo");
      setDraft((current) => ({ ...current, file: { fileName: file.name, fileUrl: payload.url, fileKey: payload.key, mimeType: file.type || "application/octet-stream", fileSize: file.size } }));
      toast.success("Arquivo de gabarito enviado", { description: "Complete as informações e salve para disponibilizá-lo no site.", position: "top-right" });
    } catch (error) {
      toast.error("Não foi possível enviar o gabarito", { description: error instanceof Error ? error.message : "Tente novamente." });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (draft.title.trim().length < 2) {
      toast.error("Informe o título do gabarito");
      return;
    }
    if (!draft.file) {
      toast.error("Envie o arquivo do gabarito antes de salvar");
      return;
    }
    try {
      const payload = { title: draft.title.trim(), description: draft.description.trim() || undefined, isPublished: draft.isPublished, file: draft.file };
      if (draft.id) await updateTemplate.mutateAsync({ id: draft.id, ...payload });
      else await createTemplate.mutateAsync(payload);
      await invalidateTemplates();
      setDialogOpen(false);
      setDraft(EMPTY_DRAFT);
      toast.success(draft.id ? "Gabarito atualizado" : "Gabarito adicionado", { description: draft.isPublished ? "Ele já pode ser vinculado e baixado pelos clientes." : "Ele ficará oculto até ser publicado.", position: "top-right" });
    } catch (error) {
      toast.error("Não foi possível salvar o gabarito", { description: error instanceof Error ? error.message : "Tente novamente." });
    }
  };

  const handleMove = async (id: number, direction: -1 | 1) => {
    const currentIndex = templates.findIndex((template) => template.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= templates.length) return;
    const next = [...templates];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    try {
      await reorderTemplates.mutateAsync({ ids: next.map((template) => template.id) });
      await invalidateTemplates();
    } catch {
      toast.error("Não foi possível reorganizar os gabaritos");
    }
  };

  const handleRemove = async () => {
    if (!templateToRemove) return;
    try {
      await removeTemplate.mutateAsync({ id: templateToRemove.id });
      await invalidateTemplates();
      toast.success("Gabarito removido", { description: "Os produtos que o utilizavam ficaram sem gabarito vinculado." });
      setTemplateToRemove(null);
    } catch {
      toast.error("Não foi possível remover o gabarito");
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <AdminLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-pink-100 p-3 text-pink-600"><FileText className="h-7 w-7" /></div><div><p className="text-sm font-semibold text-pink-600">Configurações do site</p><h1 className="text-2xl font-bold text-slate-900">Gabaritos</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Cadastre os arquivos de montagem e vincule o gabarito correto em cada produto.</p></div></div>
          <Button onClick={openNewTemplate} className="bg-pink-600 hover:bg-pink-700"><Plus className="mr-2 h-4 w-4" />Adicionar gabarito</Button>
        </section>

        <Card>
          <CardHeader><CardTitle>Biblioteca de arquivos</CardTitle><CardDescription>O arquivo publicado aparece na página pública de Gabaritos e pode ser selecionado no cadastro ou na edição de produtos.</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex min-h-44 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-pink-600" /></div> : templates.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><FileUp className="mx-auto h-8 w-8 text-pink-500" /><h2 className="mt-4 font-bold text-slate-900">Nenhum gabarito cadastrado</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Envie o primeiro arquivo para disponibilizá-lo aos clientes e vinculá-lo aos produtos correspondentes.</p><Button onClick={openNewTemplate} variant="outline" className="mt-5 border-pink-200 text-pink-700 hover:bg-pink-50"><Upload className="mr-2 h-4 w-4" />Enviar primeiro gabarito</Button></div> : <div className="space-y-3">{templates.map((template, index) => <article key={template.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{template.title}</h2><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${template.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{template.isPublished ? "Publicado" : "Oculto"}</span></div><p className="mt-1 text-sm text-slate-600">{template.description || "Sem descrição complementar."}</p><p className="mt-2 truncate text-xs text-slate-500">{template.fileName} · {extensionOf(template.fileName).toUpperCase()} · {formatFileSize(template.fileSize)}</p></div><div className="flex flex-wrap items-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleMove(template.id, -1)} disabled={index === 0 || reorderTemplates.isPending} aria-label={`Mover ${template.title} para cima`}><ArrowUp className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleMove(template.id, 1)} disabled={index === templates.length - 1 || reorderTemplates.isPending} aria-label={`Mover ${template.title} para baixo`}><ArrowDown className="h-4 w-4" /></Button><Button asChild variant="ghost" size="icon" aria-label={`Baixar ${template.title}`}><a href={template.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button><Button variant="ghost" size="icon" onClick={() => openEditTemplate(template)} aria-label={`Editar ${template.title}`}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setTemplateToRemove(template)} aria-label={`Excluir ${template.title}`} className="text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div></article>)}</div>}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setDraft(EMPTY_DRAFT); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{draft.id ? "Editar gabarito" : "Adicionar gabarito"}</DialogTitle><DialogDescription>Inclua um nome claro para que a equipe encontre e vincule o arquivo correto ao produto.</DialogDescription></DialogHeader><div className="space-y-5 py-2"><div className="space-y-2"><Label htmlFor="template-title">Título *</Label><Input id="template-title" value={draft.title} maxLength={160} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Cartão de visita 9 × 5 cm" /></div><div className="space-y-2"><Label htmlFor="template-description">Descrição</Label><Textarea id="template-description" value={draft.description} maxLength={2000} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Explique quando este gabarito deve ser usado." rows={3} /></div><div className="space-y-2"><Label>Arquivo do gabarito *</Label><input ref={fileInputRef} type="file" accept=".pdf,.ai,.cdr,.psd,.eps,.svg,.jpg,.jpeg,.png,.gif,.webp,.tif,.tiff" className="hidden" onChange={handleUpload} /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm font-semibold text-slate-600 transition hover:border-pink-300 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">{isUploading ? <Loader2 className="h-5 w-5 animate-spin text-pink-600" /> : <Upload className="h-5 w-5 text-pink-600" />}{isUploading ? "Enviando arquivo..." : draft.file ? "Substituir arquivo" : "Selecionar arquivo"}</button><p className="text-xs leading-5 text-slate-500">PDF, AI, CDR, PSD, EPS, SVG ou imagem gráfica, com até 25 MB.</p>{draft.file && <div className="flex items-center gap-3 rounded-xl border border-pink-100 bg-pink-50/60 p-3"><FileText className="h-5 w-5 shrink-0 text-pink-600" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{draft.file.fileName}</span><span className="text-xs text-slate-500">{formatFileSize(draft.file.fileSize)}</span></div>}</div><div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"><div><Label htmlFor="template-published" className="font-semibold text-slate-900">Publicar no site</Label><p className="mt-1 text-xs leading-5 text-slate-600">Quando oculto, o arquivo continua disponível apenas para seleção administrativa.</p></div><Switch id="template-published" checked={draft.isPublished} onCheckedChange={(isPublished) => setDraft((current) => ({ ...current, isPublished }))} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-pink-600 hover:bg-pink-700">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{draft.id ? "Salvar alterações" : "Adicionar gabarito"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(templateToRemove)} onOpenChange={(open) => !open && setTemplateToRemove(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este gabarito?</AlertDialogTitle><AlertDialogDescription>O arquivo deixará de aparecer no site e todos os produtos que o utilizam ficarão sem um gabarito vinculado. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">{removeTemplate.isPending ? "Excluindo..." : "Excluir gabarito"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </AdminLayout>
  );
}
