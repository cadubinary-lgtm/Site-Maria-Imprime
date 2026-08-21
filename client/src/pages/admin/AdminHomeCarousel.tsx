import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, MoveHorizontal, MoveVertical, Pencil, Plus, RotateCcw, Trash2, Upload, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const MAX_SLIDES = 6;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MIN_IMAGE_SCALE = 1;
const MAX_IMAGE_SCALE = 2;
const RECOMMENDED_IMAGE_SIZE = "2400 × 900 px";
const MINIMUM_IMAGE_SIZE = "1600 × 600 px";

type CarouselSlide = {
  id: number;
  imageUrl: string;
  imageKey: string | null;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  segmentId: number;
  segmentName: string;
  segmentSlug: string;
  position: number;
  isActive: boolean;
};

type SlideDraft = {
  id?: number;
  imageUrl: string;
  imageKey: string;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  segmentId: string;
};

const EMPTY_DRAFT: SlideDraft = {
  imageUrl: "",
  imageKey: "",
  imageScale: MIN_IMAGE_SCALE,
  imagePositionX: 50,
  imagePositionY: 50,
  segmentId: "",
};

function getImageFramingStyle(scale: number, positionX: number, positionY: number): CSSProperties {
  return {
    objectPosition: `${positionX}% ${positionY}%`,
    transform: `scale(${scale})`,
    transformOrigin: `${positionX}% ${positionY}%`,
  };
}

export default function AdminHomeCarousel() {
  const utils = trpc.useUtils();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { data: fetchedSlides, isLoading: isLoadingSlides } = trpc.homeCarousel.listAdmin.useQuery();
  const { data: segments = [], isLoading: isLoadingSegments } = trpc.productSegments.getAllSegments.useQuery();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<SlideDraft>(EMPTY_DRAFT);
  const [isUploading, setIsUploading] = useState(false);
  const [slideToRemove, setSlideToRemove] = useState<CarouselSlide | null>(null);

  const slides = useMemo(() => (fetchedSlides ?? []).map((slide: any) => ({
    ...slide,
    imageScale: Number(slide.imageScale ?? MIN_IMAGE_SCALE),
    imagePositionX: Number(slide.imagePositionX ?? 50),
    imagePositionY: Number(slide.imagePositionY ?? 50),
  })) as CarouselSlide[], [fetchedSlides]);
  const createSlide = trpc.homeCarousel.create.useMutation();
  const updateSlide = trpc.homeCarousel.update.useMutation();
  const removeSlide = trpc.homeCarousel.remove.useMutation();
  const reorderSlides = trpc.homeCarousel.reorder.useMutation();
  const isSaving = createSlide.isPending || updateSlide.isPending;

  const refreshCarousel = async () => {
    await Promise.all([
      utils.homeCarousel.listAdmin.invalidate(),
      utils.homeCarousel.listPublic.invalidate(),
    ]);
  };

  const openNewSlide = () => {
    setDraft(EMPTY_DRAFT);
    setIsEditorOpen(true);
  };

  const openEditSlide = (slide: CarouselSlide) => {
    setDraft({
      id: slide.id,
      imageUrl: slide.imageUrl,
      imageKey: slide.imageKey ?? "",
      imageScale: slide.imageScale,
      imagePositionX: slide.imagePositionX,
      imagePositionY: slide.imagePositionY,
      segmentId: String(slide.segmentId),
    });
    setIsEditorOpen(true);
  };

  const validateImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Use uma imagem JPG, PNG ou WEBP.";
    if (file.size > MAX_FILE_SIZE) return "A imagem deve ter no máximo 2 MB.";
    return null;
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationMessage = validateImage(file);
    if (validationMessage) {
      toast.error(validationMessage);
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a imagem");
      setDraft((current) => ({
        ...current,
        imageUrl: payload.url,
        imageKey: payload.key ?? "",
        imageScale: MIN_IMAGE_SCALE,
        imagePositionX: 50,
        imagePositionY: 50,
      }));
      toast.success("Imagem carregada", { description: "Agora ajuste o enquadramento, selecione o segmento e salve." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a imagem");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!draft.imageUrl) {
      toast.error("Envie uma imagem para o carrossel.");
      return;
    }
    const segmentId = Number(draft.segmentId);
    if (!Number.isInteger(segmentId) || segmentId <= 0) {
      toast.error("Selecione o segmento que será aberto pelo botão Ver opções.");
      return;
    }

    try {
      const values = {
        imageUrl: draft.imageUrl,
        imageKey: draft.imageKey || undefined,
        imageScale: draft.imageScale,
        imagePositionX: draft.imagePositionX,
        imagePositionY: draft.imagePositionY,
        segmentId,
      };
      if (draft.id) await updateSlide.mutateAsync({ id: draft.id, ...values });
      else await createSlide.mutateAsync(values);
      await refreshCarousel();
      setIsEditorOpen(false);
      setDraft(EMPTY_DRAFT);
      toast.success(draft.id ? "Imagem do carrossel atualizada" : "Imagem adicionada ao carrossel", {
        description: "O enquadramento e o destino do botão Ver opções foram salvos.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a imagem do carrossel");
    }
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const orderedIds = slides.map((slide) => slide.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    try {
      await reorderSlides.mutateAsync({ orderedIds });
      await refreshCarousel();
      toast.success("Ordem do carrossel atualizada");
    } catch {
      toast.error("Não foi possível alterar a ordem das imagens");
    }
  };

  const handleRemove = async () => {
    if (!slideToRemove) return;
    try {
      await removeSlide.mutateAsync({ id: slideToRemove.id });
      await refreshCarousel();
      toast.success("Imagem removida do carrossel");
      setSlideToRemove(null);
    } catch {
      toast.error("Não foi possível remover a imagem do carrossel");
    }
  };

  const resetFraming = () => setDraft((current) => ({
    ...current,
    imageScale: MIN_IMAGE_SCALE,
    imagePositionX: 50,
    imagePositionY: 50,
  }));
  const availableSlots = Math.max(0, MAX_SLIDES - slides.length);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-pink-100 bg-gradient-to-r from-white to-pink-50 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-pink-100 p-3 text-pink-600"><ImagePlus className="h-7 w-7" aria-hidden="true" /></div>
            <div>
              <p className="text-sm font-semibold text-pink-600">Produtos</p>
              <h1 className="text-2xl font-bold text-slate-900">Carrossel da página inicial</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Adicione até 6 imagens entre os produtos em destaque e Como funciona. Cada imagem recebe um botão Ver opções que leva ao segmento escolhido.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-right"><p className="text-xs text-slate-500">Imagens configuradas</p><p className="text-xl font-bold text-slate-900">{slides.length}/{MAX_SLIDES}</p></div>
            <Button onClick={openNewSlide} disabled={availableSlots === 0 || isLoadingSegments} className="bg-pink-600 hover:bg-pink-700 focus-visible:ring-pink-300"><Plus className="mr-2 h-4 w-4" />Adicionar imagem</Button>
          </div>
        </section>

        <Card>
          <CardHeader className="border-b border-slate-100"><CardTitle>Imagens e destinos</CardTitle><CardDescription>O carrossel avança automaticamente no site e pausa quando o cliente passa o mouse ou usa o teclado. Use as setas para definir a ordem.</CardDescription></CardHeader>
          <CardContent className="pt-6">
            {isLoadingSlides ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-pink-600" /></div> : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {slides.map((slide, index) => (
                  <article key={slide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="relative aspect-[8/3] overflow-hidden bg-slate-100"><img src={slide.imageUrl} alt={`Imagem ${index + 1} do carrossel para ${slide.segmentName}`} className="h-full w-full object-cover" style={getImageFramingStyle(slide.imageScale, slide.imagePositionX, slide.imagePositionY)} /><span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-white">{index + 1}ª imagem</span><span className="absolute bottom-3 left-3 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">Ver opções</span></div>
                    <div className="space-y-4 p-4"><div className="flex items-start gap-2"><Link2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-slate-900">{slide.segmentName}</p><p className="text-xs text-slate-500">/catalogo?segmentId={slide.segmentId}</p></div></div><div className="grid grid-cols-4 gap-2"><Button type="button" variant="outline" size="icon" onClick={() => moveSlide(index, -1)} disabled={index === 0 || reorderSlides.isPending} aria-label={`Mover imagem ${index + 1} para a esquerda`}><ArrowLeft className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon" onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1 || reorderSlides.isPending} aria-label={`Mover imagem ${index + 1} para a direita`}><ArrowRight className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon" onClick={() => openEditSlide(slide)} aria-label={`Editar imagem ${index + 1}`}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setSlideToRemove(slide)} aria-label={`Remover imagem ${index + 1}`}><Trash2 className="h-4 w-4" /></Button></div></div>
                  </article>
                ))}
                {Array.from({ length: availableSlots }).map((_, index) => <button key={`empty-slot-${index}`} type="button" onClick={openNewSlide} className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition hover:border-pink-300 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"><span className="rounded-full bg-white p-4 text-pink-600 shadow-sm"><Upload className="h-6 w-6" /></span><span className="font-semibold text-slate-800">Adicionar imagem {slides.length + index + 1}</span><span className="text-xs leading-5 text-slate-500">JPG, PNG ou WEBP com até 2 MB</span></button>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={(open) => { setIsEditorOpen(open); if (!open) setDraft(EMPTY_DRAFT); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{draft.id ? "Editar imagem do carrossel" : "Adicionar imagem ao carrossel"}</DialogTitle><DialogDescription>Escolha a imagem, ajuste o enquadramento e selecione o segmento que será aberto pelo botão Ver opções.</DialogDescription></DialogHeader><div className="space-y-5 py-2"><div className="space-y-2"><Label>Imagem</Label><input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} /><button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="flex w-full aspect-[8/3] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-pink-400 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">{isUploading ? <Loader2 className="h-7 w-7 animate-spin text-pink-600" /> : draft.imageUrl ? <img src={draft.imageUrl} alt="Prévia da imagem do carrossel" className="h-full w-full object-cover" style={getImageFramingStyle(draft.imageScale, draft.imagePositionX, draft.imagePositionY)} /> : <span className="flex flex-col items-center gap-2 text-sm font-medium text-slate-600"><Upload className="h-6 w-6 text-pink-600" />Clique para enviar a imagem</span>}</button><p className="text-xs leading-5 text-slate-500"><strong className="font-semibold text-slate-700">Tamanho recomendado: {RECOMMENDED_IMAGE_SIZE}</strong> (proporção 8:3). Mínimo: {MINIMUM_IMAGE_SIZE}. JPG, PNG ou WEBP, até 2 MB.</p></div>{draft.imageUrl && <div className="rounded-xl border border-pink-100 bg-pink-50/60 p-4"><div className="mb-4 flex items-start justify-between gap-4"><div><h3 className="text-sm font-bold text-slate-900">Enquadramento da imagem</h3><p className="mt-1 text-xs leading-5 text-slate-600">Amplie para preencher e reposicione o ponto mais importante da arte. A imagem não será esticada.</p></div><Button type="button" variant="outline" size="sm" onClick={resetFraming} className="shrink-0 border-pink-200 bg-white text-pink-700 hover:bg-pink-50"><RotateCcw className="mr-2 h-3.5 w-3.5" />Redefinir</Button></div><div className="space-y-4"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="carousel-image-scale" className="flex items-center gap-2"><ZoomIn className="h-4 w-4 text-pink-600" />Ampliar imagem</Label><output htmlFor="carousel-image-scale" className="rounded-md bg-white px-2 py-1 text-xs font-bold tabular-nums text-pink-700">{Math.round(draft.imageScale * 100)}%</output></div><input id="carousel-image-scale" type="range" min={MIN_IMAGE_SCALE} max={MAX_IMAGE_SCALE} step="0.01" value={draft.imageScale} onChange={(event) => setDraft((current) => ({ ...current, imageScale: Number(event.target.value) }))} className="h-2 w-full cursor-pointer accent-pink-600" aria-valuetext={`${Math.round(draft.imageScale * 100)}% de ampliação`} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="carousel-image-position-x" className="flex items-center gap-2"><MoveHorizontal className="h-4 w-4 text-pink-600" />Posição horizontal</Label><output htmlFor="carousel-image-position-x" className="rounded-md bg-white px-2 py-1 text-xs font-bold tabular-nums text-pink-700">{draft.imagePositionX}%</output></div><input id="carousel-image-position-x" type="range" min="0" max="100" step="1" value={draft.imagePositionX} onChange={(event) => setDraft((current) => ({ ...current, imagePositionX: Number(event.target.value) }))} className="h-2 w-full cursor-pointer accent-pink-600" /></div><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="carousel-image-position-y" className="flex items-center gap-2"><MoveVertical className="h-4 w-4 text-pink-600" />Posição vertical</Label><output htmlFor="carousel-image-position-y" className="rounded-md bg-white px-2 py-1 text-xs font-bold tabular-nums text-pink-700">{draft.imagePositionY}%</output></div><input id="carousel-image-position-y" type="range" min="0" max="100" step="1" value={draft.imagePositionY} onChange={(event) => setDraft((current) => ({ ...current, imagePositionY: Number(event.target.value) }))} className="h-2 w-full cursor-pointer accent-pink-600" /></div></div></div></div>}<div className="space-y-2"><Label htmlFor="carousel-segment">Segmento de destino</Label><Select value={draft.segmentId} onValueChange={(segmentId) => setDraft((current) => ({ ...current, segmentId }))}><SelectTrigger id="carousel-segment" aria-label="Segmento de destino do botão Ver opções"><SelectValue placeholder={isLoadingSegments ? "Carregando segmentos..." : "Selecione um segmento"} /></SelectTrigger><SelectContent>{(segments as any[]).map((segment) => <SelectItem key={segment.id} value={String(segment.id)}>{segment.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-slate-500">Ao clicar em Ver opções, o cliente será direcionado ao catálogo filtrado por este segmento.</p></div></div><DialogFooter><Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSaving || isUploading} className="bg-pink-600 hover:bg-pink-700">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{draft.id ? "Salvar alterações" : "Adicionar imagem"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(slideToRemove)} onOpenChange={(open) => !open && setSlideToRemove(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover imagem do carrossel?</AlertDialogTitle><AlertDialogDescription>Ela deixará de aparecer na página inicial. Você poderá adicionar outra imagem depois.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700">{removeSlide.isPending ? "Removendo..." : "Remover imagem"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </AdminLayout>
  );
}
