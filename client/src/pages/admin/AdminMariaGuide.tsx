import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, FilePlus2, Layers3, Loader2, Plus, Save, Send, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { MariaGuide } from "@/components/products/MariaGuide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MARIA_GUIDE_ICON_KEYS, parseMariaGuideContent, type MariaGuideCategory, type MariaGuideContent, type MariaGuideIllustration, type MariaGuideItem, type MariaGuideSection } from "@/lib/mariaGuide";
import { trpc } from "@/lib/trpc";

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "novo-item";

export default function AdminMariaGuide() {
  const utils = trpc.useUtils();
  const { data: savedGuide, isLoading } = trpc.siteContent.getAdminMariaGuide.useQuery();
  const saveDraft = trpc.siteContent.saveMariaGuideDraft.useMutation();
  const publishGuide = trpc.siteContent.publishMariaGuide.useMutation();
  const [guide, setGuide] = useState<MariaGuideContent>(() => parseMariaGuideContent(null));
  const [activeSectionId, setActiveSectionId] = useState<MariaGuideSection["id"]>("impressao");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useEffect(() => {
    if (savedGuide) setGuide(parseMariaGuideContent(savedGuide.draftContent ?? savedGuide.publishedContent));
  }, [savedGuide]);

  const activeSection = useMemo(() => guide.sections.find((section) => section.id === activeSectionId) ?? guide.sections[0], [guide.sections, activeSectionId]);
  const publishedLabel = savedGuide?.publishedAt ? new Date(savedGuide.publishedAt).toLocaleString("pt-BR") : "Ainda não publicado";

  const updateGuide = (patch: Partial<MariaGuideContent>) => setGuide((current) => ({ ...current, ...patch }));
  const updateSection = (sectionId: string, patch: Partial<MariaGuideSection>) => setGuide((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) }));
  const updateCategory = (sectionId: string, categoryId: string, patch: Partial<MariaGuideCategory>) => setGuide((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, categories: section.categories.map((category) => category.id === categoryId ? { ...category, ...patch } : category) } : section) }));
  const updateItem = (sectionId: string, categoryId: string, itemId: string, patch: Partial<MariaGuideItem>) => setGuide((current) => ({ ...current, sections: current.sections.map((section) => section.id === sectionId ? { ...section, categories: section.categories.map((category) => category.id === categoryId ? { ...category, items: category.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) } : category) } : section) }));

  const addCategory = () => {
    const id = `nova-categoria-${Date.now()}`;
    const category: MariaGuideCategory = { id, title: "Nova categoria", description: "Descreva quando esta categoria é indicada.", isActive: true, items: [{ id: `novo-item-${Date.now()}`, title: "Novo item", description: "Descreva este item para o cliente.", bullets: [], isActive: true }] };
    updateSection(activeSection.id, { categories: [...activeSection.categories, category] });
  };

  const removeCategory = (categoryId: string) => {
    if (activeSection.categories.length <= 1) return;
    updateSection(activeSection.id, { categories: activeSection.categories.filter((category) => category.id !== categoryId) });
  };

  const addItem = (category: MariaGuideCategory) => {
    const id = `novo-item-${Date.now()}`;
    updateCategory(activeSection.id, category.id, { items: [...category.items, { id, title: "Novo item", description: "Descreva este item para o cliente.", bullets: [], isActive: true }] });
  };

  const removeItem = (category: MariaGuideCategory, itemId: string) => {
    if (category.items.length <= 1) return;
    updateCategory(activeSection.id, category.id, { items: category.items.filter((item) => item.id !== itemId) });
  };

  const moveItem = (category: MariaGuideCategory, itemIndex: number, direction: -1 | 1) => {
    const nextIndex = itemIndex + direction;
    if (nextIndex < 0 || nextIndex >= category.items.length) return;
    const items = [...category.items];
    [items[itemIndex], items[nextIndex]] = [items[nextIndex], items[itemIndex]];
    updateCategory(activeSection.id, category.id, { items });
  };

  const handleSaveDraft = async (announce = true) => {
    try {
      await saveDraft.mutateAsync(guide);
      await utils.siteContent.getAdminMariaGuide.invalidate();
      if (announce) toast.success("Rascunho do Guia da Maria salvo", { description: "A prévia foi atualizada. Publique quando estiver pronto para exibir no configurador.", position: "top-right", duration: 3500, id: "maria-guide-draft-save" });
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar o rascunho", { description: "Revise sua conexão e tente novamente.", position: "top-right", duration: 3500, id: "maria-guide-draft-save-error" });
      return false;
    }
  };

  const handlePublish = async () => {
    try {
      const wasSaved = await handleSaveDraft(false);
      if (!wasSaved) return;
      await publishGuide.mutateAsync();
      await Promise.all([utils.siteContent.getAdminMariaGuide.invalidate(), utils.siteContent.getPublicMariaGuide.invalidate()]);
      toast.success("Guia da Maria publicado", { description: "A nova versão já será carregada em todos os configuradores de produto.", position: "top-right", duration: 3500, id: "maria-guide-published" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível publicar o Guia da Maria", { position: "top-right", id: "maria-guide-publish-error" });
    }
  };

  return <AdminLayout>
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-5 rounded-2xl border border-pink-100 bg-gradient-to-r from-white via-pink-50 to-white p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4"><div className="h-fit rounded-2xl bg-pink-100 p-3 text-pink-600"><Layers3 className="h-7 w-7" /></div><div><p className="text-sm font-bold text-pink-600">Conteúdo global do site</p><h1 className="text-2xl font-black tracking-tight text-slate-950">Guia da Maria</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Uma biblioteca única para explicar impressão, materiais, acabamentos e entrega em todos os configuradores de produto.</p></div></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setIsPreviewVisible((value) => !value)} aria-pressed={isPreviewVisible}><Eye className="mr-2 h-4 w-4" aria-hidden="true" />{isPreviewVisible ? "Fechar prévia" : "Ver prévia"}</Button><Button type="button" variant="outline" onClick={() => handleSaveDraft()} disabled={saveDraft.isPending} aria-busy={saveDraft.isPending}>{saveDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}Salvar rascunho</Button><Button type="button" className="bg-pink-600 hover:bg-pink-700" onClick={handlePublish} disabled={saveDraft.isPending || publishGuide.isPending} aria-busy={saveDraft.isPending || publishGuide.isPending}>{publishGuide.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}Publicar alterações</Button></div>
      </section>

      {isPreviewVisible && <Card className="overflow-hidden border-pink-200"><CardHeader className="border-b border-pink-100 bg-pink-50/50"><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-pink-600" />Prévia no configurador</CardTitle><CardDescription>Esta é a versão de rascunho. O site público só recebe esta versão após publicar.</CardDescription></CardHeader><CardContent className="bg-slate-50 p-4 sm:p-6"><MariaGuide content={guide} /></CardContent></Card>}

      {isLoading ? <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-pink-600" aria-label="Carregando Guia da Maria" /></div> : <>
        <Card><CardHeader className="border-b border-slate-100"><CardTitle>Apresentação do guia</CardTitle><CardDescription>Textos gerais exibidos acima e abaixo dos quatro cards do Guia da Maria.</CardDescription></CardHeader><CardContent className="grid gap-5 pt-6 lg:grid-cols-2"><div className="space-y-2"><Label htmlFor="guide-eyebrow">Etiqueta</Label><Input id="guide-eyebrow" value={guide.eyebrow} onChange={(event) => updateGuide({ eyebrow: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="guide-title">Título principal</Label><Input id="guide-title" value={guide.title} onChange={(event) => updateGuide({ title: event.target.value })} /></div><div className="space-y-2 lg:col-span-2"><Label htmlFor="guide-description">Descrição principal</Label><Textarea id="guide-description" value={guide.description} onChange={(event) => updateGuide({ description: event.target.value })} rows={3} /></div><div className="space-y-2"><Label htmlFor="guide-note-title">Título do aviso final</Label><Input id="guide-note-title" value={guide.bottomNoteTitle} onChange={(event) => updateGuide({ bottomNoteTitle: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="guide-note">Texto do aviso final</Label><Textarea id="guide-note" value={guide.bottomNote} onChange={(event) => updateGuide({ bottomNote: event.target.value })} rows={3} /></div></CardContent></Card>

        <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]"><Card className="h-fit"><CardHeader><CardTitle className="text-base">Cards do guia</CardTitle><CardDescription>Ative, desative e escolha a área que deseja editar.</CardDescription></CardHeader><CardContent className="space-y-2">{guide.sections.map((section) => <button key={section.id} type="button" onClick={() => setActiveSectionId(section.id)} aria-current={section.id === activeSection.id ? "page" : undefined} className={`w-full rounded-xl border px-4 py-3 text-left transition ${section.id === activeSection.id ? "border-pink-300 bg-pink-50 text-pink-700" : "border-slate-200 bg-white text-slate-700 hover:border-pink-200"}`}><span className="block text-sm font-extrabold">{section.title}</span><span className="mt-1 block text-xs leading-4 text-slate-500">{section.subtitle}</span></button>)}</CardContent></Card>
          <Card><CardHeader className="border-b border-slate-100"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Card: {activeSection.title}</CardTitle><CardDescription>Edite o conteúdo e as categorias exibidas no card selecionado.</CardDescription></div><div className="flex items-center gap-3"><Label htmlFor="section-active" className="text-sm text-slate-600">Exibir card</Label><Switch id="section-active" checked={activeSection.isActive} onCheckedChange={(isActive) => updateSection(activeSection.id, { isActive })} /></div></div></CardHeader><CardContent className="space-y-6 pt-6"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="section-title">Título</Label><Input id="section-title" value={activeSection.title} onChange={(event) => updateSection(activeSection.id, { title: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="section-icon">Ícone</Label><select id="section-icon" value={activeSection.icon} onChange={(event) => updateSection(activeSection.id, { icon: event.target.value as MariaGuideSection["icon"] })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{MARIA_GUIDE_ICON_KEYS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></div><div className="space-y-2 md:col-span-2"><Label htmlFor="section-subtitle">Subtítulo do card</Label><Input id="section-subtitle" value={activeSection.subtitle} onChange={(event) => updateSection(activeSection.id, { subtitle: event.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="section-description">Descrição da área</Label><Textarea id="section-description" value={activeSection.description} onChange={(event) => updateSection(activeSection.id, { description: event.target.value })} rows={3} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="section-tip">Dica da Maria</Label><Textarea id="section-tip" value={activeSection.tip} onChange={(event) => updateSection(activeSection.id, { tip: event.target.value })} rows={3} /></div></div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6"><div><h3 className="font-bold text-slate-950">Categorias e itens</h3><p className="mt-1 text-sm text-slate-600">Use os controles para cadastrar, editar, ativar, excluir e reordenar o conteúdo global.</p></div><Button type="button" variant="outline" onClick={addCategory}><Plus className="mr-2 h-4 w-4" />Adicionar categoria</Button></div>
            <div className="space-y-5">{activeSection.categories.map((category) => <section key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${category.id}-title`}>Nome da categoria</Label><Input id={`${category.id}-title`} value={category.title} onChange={(event) => updateCategory(activeSection.id, category.id, { title: event.target.value, id: slugify(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor={`${category.id}-description`}>Descrição breve</Label><Input id={`${category.id}-description`} value={category.description} onChange={(event) => updateCategory(activeSection.id, category.id, { description: event.target.value })} /></div></div><div className="flex items-center gap-3 self-end"><Label htmlFor={`${category.id}-active`} className="text-sm text-slate-600">Ativa</Label><Switch id={`${category.id}-active`} checked={category.isActive} onCheckedChange={(isActive) => updateCategory(activeSection.id, category.id, { isActive })} /><Button type="button" size="icon" variant="ghost" aria-label={`Excluir ${category.title}`} disabled={activeSection.categories.length <= 1} onClick={() => removeCategory(category.id)}><Trash2 className="h-4 w-4 text-slate-500" /></Button></div></div>
              <div className="mt-5 space-y-3">{category.items.map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-md bg-pink-50 px-2 py-1 text-xs font-bold text-pink-600">{index + 1}</span><span className="text-sm font-bold text-slate-800">Item do guia</span></div><div className="flex items-center gap-1"><Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => moveItem(category, index, -1)}>↑</Button><Button type="button" size="sm" variant="ghost" disabled={index === category.items.length - 1} onClick={() => moveItem(category, index, 1)}>↓</Button><Label htmlFor={`${item.id}-active`} className="ml-2 text-xs text-slate-500">Ativo</Label><Switch id={`${item.id}-active`} checked={item.isActive} onCheckedChange={(isActive) => updateItem(activeSection.id, category.id, item.id, { isActive })} /><Button type="button" size="icon" variant="ghost" aria-label={`Excluir ${item.title}`} disabled={category.items.length <= 1} onClick={() => removeItem(category, item.id)}><Trash2 className="h-4 w-4 text-slate-500" /></Button></div></div><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${item.id}-title`}>Título</Label><Input id={`${item.id}-title`} value={item.title} onChange={(event) => updateItem(activeSection.id, category.id, item.id, { title: event.target.value, id: slugify(event.target.value) })} /></div><div className="space-y-2"><Label htmlFor={`${item.id}-illustration`}>Ilustração técnica (opcional)</Label><select id={`${item.id}-illustration`} value={item.illustration ?? ""} onChange={(event) => updateItem(activeSection.id, category.id, item.id, { illustration: (event.target.value || undefined) as MariaGuideIllustration | undefined })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Sem ilustração</option><option value="lona-ilhos">Lona com ilhós</option><option value="lona-bastao">Lona com bastão</option><option value="lona-sanet">Lona Ortofônica / Sanet</option><option value="adesivo-perfurado">Adesivo perfurado</option><option value="papel-gramatura">Papel e gramatura</option><option value="placa">Placa</option><option value="laminacao">Laminação</option><option value="meio-corte">Meio corte</option><option value="vinco-dobra">Vinco e dobra</option><option value="entrega">Entrega</option></select></div><div className="space-y-2 md:col-span-2"><Label htmlFor={`${item.id}-description`}>Descrição</Label><Textarea id={`${item.id}-description`} value={item.description} onChange={(event) => updateItem(activeSection.id, category.id, item.id, { description: event.target.value })} rows={2} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor={`${item.id}-bullets`}>Indicado para / pontos-chave</Label><Input id={`${item.id}-bullets`} value={item.bullets.join(", ")} onChange={(event) => updateItem(activeSection.id, category.id, item.id, { bullets: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="Separe cada item por vírgula" /></div></div></div>)}<Button type="button" variant="outline" size="sm" onClick={() => addItem(category)}><FilePlus2 className="mr-2 h-4 w-4" />Adicionar item</Button></div>
            </section>)}</div>
          </CardContent></Card>
        </div>

        <Card className="border-pink-100 bg-pink-50/40"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-pink-600" /><div><p className="font-bold text-slate-950">Publicação global</p><p className="mt-1 text-sm text-slate-600">Última publicação: {publishedLabel}. Ao publicar, o guia atualizado é disponibilizado em todos os configuradores sem alterar preços, carrinho, checkout ou produção.</p></div></div><Button type="button" className="bg-pink-600 hover:bg-pink-700" onClick={handlePublish} disabled={saveDraft.isPending || publishGuide.isPending}><Settings2 className="mr-2 h-4 w-4" />Publicar agora</Button></CardContent></Card>
      </>}
    </div>
  </AdminLayout>;
}
