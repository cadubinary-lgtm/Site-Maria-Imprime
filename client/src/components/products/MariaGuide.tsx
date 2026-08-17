import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, CircleHelp, Clock, Crop, FileText, Layers3, Package, Printer, Scissors, Sparkles, Truck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { parseMariaGuideContent, type MariaGuideContent, type MariaGuideIconKey, type MariaGuideIllustration, type MariaGuideItem, type MariaGuideSection } from "@/lib/mariaGuide";

const guideIcons: Record<MariaGuideIconKey, typeof Printer> = { printer: Printer, layers: Layers3, crop: Crop, truck: Truck, sparkles: Sparkles, package: Package };

function GuideIcon({ name, className = "h-7 w-7" }: { name: MariaGuideIconKey; className?: string }) {
  const Icon = guideIcons[name] || CircleHelp;
  return <Icon className={className} aria-hidden />;
}

function FinishSymbol({ id }: { id: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const drawings: Record<string, React.ReactNode> = {
    refile: <path d="M9 25 42 12l13 8-33 13zM9 31l33 13 13-8" {...common} />,
    "corte-especial": <path d="M9 17 31 8l22 10-9 7 8 6-21 10-21-9 9-7z" {...common} strokeDasharray="3 2" />,
    "meio-corte": <><path d="M11 16h42v24H11z" {...common} /><path d="M11 29h42" {...common} strokeDasharray="3 2" /></>,
    "laminacao-brilho": <><path d="M9 30 42 17l13 7-33 13z" {...common} /><path d="M13 23 42 12l11 6" {...common} /></>,
    "laminacao-fosca": <><path d="M9 30 42 17l13 7-33 13z" {...common} /><path d="M13 23 42 12l11 6" {...common} strokeDasharray="2 2" /></>,
    "verniz-localizado": <><path d="M11 34 45 16l9 15-35 16z" {...common} /><path d="m35 15 4-6m4 9 7-3m-2 10 6 3" {...common} /></>,
    "uv-localizado": <><path d="M11 34 45 16l9 15-35 16z" {...common} /><text x="28" y="34" fontSize="10" fill="currentColor">UV</text></>,
    ilhos: <><circle cx="32" cy="28" r="13" {...common} /><circle cx="32" cy="28" r="6" {...common} /></>,
    bastao: <><path d="M8 31h48M14 27h36" {...common} /><circle cx="11" cy="29" r="3" {...common} /><circle cx="53" cy="29" r="3" {...common} /></>,
    ponteira: <><path d="M10 32 43 20l11 9-33 12z" {...common} /><path d="m19 39-4-10" {...common} /></>,
    solda: <><path d="m14 39 29-18 8 7-29 18z" {...common} /><path d="m37 20 9-8" {...common} /></>,
    dobra: <><path d="M10 18 31 9l23 10v22L31 50 10 40z" {...common} /><path d="M31 9v41M10 18l21 11 23-10" {...common} /></>,
    vinco: <><path d="M11 17h42v25H11z" {...common} /><path d="M32 17v25" {...common} strokeDasharray="3 2" /></>,
    furo: <><path d="M15 14h30v30H15z" {...common} /><circle cx="31" cy="29" r="5" {...common} /></>,
    enobrecimentos: <path d="m32 10 19 18-19 19-19-19zM20 28h24" {...common} />,
    aplicacao: <><path d="M13 17h32v25H13z" {...common} /><path d="m35 46 11-8M39 51l11-8" {...common} /></>,
    embalagem: <><path d="m11 20 21-10 21 10v24L32 55 11 44z" {...common} /><path d="M11 20l21 12 21-12M32 32v23" {...common} /></>,
    numeracao: <><rect x="10" y="16" width="44" height="25" rx="3" {...common} /><text x="18" y="33" fontSize="12" fill="currentColor">1 2 3</text></>,
  };
  return <svg viewBox="0 0 64 64" className="h-9 w-9 text-slate-900" aria-hidden>{drawings[id] ?? <Scissors className="h-8 w-8" />}</svg>;
}

function TechnicalIllustration({ kind }: { kind: MariaGuideIllustration }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const accent = "#ec1174";
  const visualByKind: Record<MariaGuideIllustration, React.ReactNode> = {
    "lona-ilhos": <><rect x="28" y="32" width="124" height="82" rx="4" {...common} /><circle cx="39" cy="43" r="5" {...common} /><circle cx="141" cy="43" r="5" {...common} /><circle cx="39" cy="103" r="5" {...common} /><circle cx="141" cy="103" r="5" {...common} /><path d="M142 43h30M152 52l-10-9 10-9" stroke={accent} strokeWidth="2" fill="none" /><text x="105" y="27" fontSize="10" fill={accent}>ilhós</text><path d="M28 118h124" stroke={accent} strokeWidth="3" /></>,
    "lona-bastao": <><rect x="38" y="38" width="104" height="72" rx="3" {...common} /><path d="M30 32h120M30 116h120" {...common} /><circle cx="28" cy="32" r="4" {...common} /><circle cx="152" cy="32" r="4" {...common} /><circle cx="28" cy="116" r="4" {...common} /><circle cx="152" cy="116" r="4" {...common} /><path d="M53 22v-12M53 10h35" stroke={accent} strokeWidth="2" /><text x="92" y="15" fontSize="10" fill={accent}>bastão</text></>,
    "lona-sanet": <><rect x="29" y="32" width="122" height="80" rx="4" {...common} /><path d="M29 32 151 112M151 32 29 112" stroke="#d5d7dc" strokeWidth="1" /><g fill="currentColor">{[48,68,88,108,128].map((x) => [48,66,84,102].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />))}</g><path d="M55 19h28m-5-6 6 6-6 6M108 19h28m-5-6 6 6-6 6" stroke={accent} strokeWidth="2" fill="none" /><text x="40" y="15" fontSize="9" fill={accent}>ar</text><text x="124" y="15" fontSize="9" fill={accent}>luz</text><path d="M157 65h24" stroke={accent} strokeWidth="2" /><text x="157" y="58" fontSize="9" fill={accent}>som</text></>,
    "adesivo-perfurado": <><rect x="30" y="32" width="118" height="80" rx="4" {...common} /><path d="M30 70h118" {...common} /><circle cx="56" cy="53" r="2" fill="currentColor" /><circle cx="70" cy="53" r="2" fill="currentColor" /><circle cx="84" cy="53" r="2" fill="currentColor" /><circle cx="98" cy="53" r="2" fill="currentColor" /><circle cx="112" cy="53" r="2" fill="currentColor" /><circle cx="126" cy="53" r="2" fill="currentColor" /><path d="M44 87c12-10 24-10 36 0-12 10-24 10-36 0Z" {...common} /><circle cx="62" cy="87" r="4" {...common} /><path d="M116 88h40" stroke={accent} strokeWidth="2" /><text x="111" y="102" fontSize="10" fill={accent}>visão</text></>,
    "papel-gramatura": <><path d="M37 48 123 28l28 18-86 20Z" {...common} /><path d="M37 62 123 42l28 18-86 20Z" {...common} /><path d="M37 76 123 56l28 18-86 20Z" {...common} /><path d="M38 95h102" stroke={accent} strokeWidth="2" /><text x="53" y="112" fontSize="10" fill={accent}>camadas e gramatura</text></>,
    placa: <><rect x="42" y="28" width="96" height="88" rx="4" {...common} /><path d="M64 116v20M116 116v20M54 136h20M106 136h20" {...common} /><path d="M60 50h60M60 68h42" stroke={accent} strokeWidth="3" /><circle cx="52" cy="38" r="3" {...common} /><circle cx="128" cy="38" r="3" {...common} /></>,
    laminacao: <><path d="M30 78 118 50l30 18-88 28Z" {...common} /><path d="M30 62 118 34l30 18-88 28Z" stroke={accent} strokeWidth="2" fill="none" /><path d="M38 54 118 28l20 12" {...common} /><path d="M130 35h34" stroke={accent} strokeWidth="2" /><text x="116" y="28" fontSize="10" fill={accent}>filme</text></>,
    "meio-corte": <><rect x="36" y="35" width="112" height="70" rx="4" {...common} /><path d="M36 76h112" stroke={accent} strokeWidth="2" strokeDasharray="5 4" /><path d="M64 35v41M119 35v41" {...common} /><path d="M52 118h80" {...common} /><text x="56" y="132" fontSize="10" fill={accent}>corte + liner</text></>,
    "vinco-dobra": <><path d="M40 36h104v74H40z" {...common} /><path d="M92 36v74" stroke={accent} strokeWidth="2" strokeDasharray="5 4" /><path d="M50 48 76 68M134 48 108 68" {...common} /><path d="M59 124 92 103l33 21" {...common} /><text x="74" y="142" fontSize="10" fill={accent}>vinco e dobra</text></>,
    entrega: <><path d="M30 91h92V52H81L68 70H30z" {...common} /><path d="M122 70h22l14 18v3h-36" {...common} /><circle cx="58" cy="96" r="10" {...common} /><circle cx="137" cy="96" r="10" {...common} /><path d="M36 36h80" stroke={accent} strokeWidth="2" /><path d="M100 26l16 10-16 10" stroke={accent} strokeWidth="2" fill="none" /></>,
  };
  return <svg viewBox="0 0 190 152" className="h-36 w-full text-slate-950" aria-hidden>{visualByKind[kind]}</svg>;
}

function getSection(guide: MariaGuideContent, id: MariaGuideSection["id"]) {
  return guide.sections.find((section) => section.id === id && section.isActive) ?? guide.sections.find((section) => section.id === id);
}

function ItemRow({ item, isOpen, onClick, icon }: { item: MariaGuideItem; isOpen: boolean; onClick: () => void; icon: MariaGuideIconKey }) {
  return <button type="button" onClick={onClick} className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 ${isOpen ? "bg-pink-50/70" : "bg-white hover:bg-pink-50/30"}`} aria-expanded={isOpen}><div className="flex items-start gap-2.5"><div className="rounded-md bg-pink-50 p-1.5 text-pink-600"><GuideIcon name={icon} className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-950">{item.title}</p><ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} /></div><p className={`mt-0.5 text-[11px] leading-3.5 text-slate-600 ${isOpen ? "" : "max-h-7 overflow-hidden"}`}>{isOpen ? item.description : item.description}</p>{isOpen && item.bullets.length > 0 && <p className="mt-2 text-[11px] font-semibold leading-4 text-pink-700">Indicado para: {item.bullets.join(" · ")}</p>}</div></div></button>;
}

function GuideTip({ text }: { text: string }) {
  return <div className="mt-auto flex gap-2 border-t border-pink-100 bg-pink-50/60 px-3 py-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" /><p className="text-[11px] leading-4 text-slate-600"><span className="font-extrabold text-pink-700">Dica da Maria</span><br />{text}</p></div>;
}

export function MariaGuide({ content }: { content?: MariaGuideContent }) {
  const { data } = trpc.siteContent.getPublicMariaGuide.useQuery(undefined, { staleTime: 60_000, enabled: !content });
  const guide = useMemo(() => content ?? parseMariaGuideContent(data?.publishedContent), [content, data?.publishedContent]);
  const printSection = getSection(guide, "impressao");
  const materialSection = getSection(guide, "material");
  const finishSection = getSection(guide, "acabamento");
  const deliverySection = getSection(guide, "entrega");
  const [highlightedId, setHighlightedId] = useState<MariaGuideSection["id"]>("impressao");
  const [expandedPanels, setExpandedPanels] = useState<Set<MariaGuideSection["id"]>>(() => new Set<MariaGuideSection["id"]>(["impressao", "material", "acabamento", "entrega"]));
  const [openPrintId, setOpenPrintId] = useState<string | null>(null);
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [openDeliveryId, setOpenDeliveryId] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<MariaGuideItem | null>(null);

  const panels = [printSection, materialSection, finishSection, deliverySection].filter(Boolean) as MariaGuideSection[];
  const printingItems = printSection?.categories.flatMap((category) => category.isActive ? category.items.filter((item) => item.isActive) : []) ?? [];
  const materialCategories = materialSection?.categories.filter((category) => category.isActive) ?? [];
  const finishItems = finishSection?.categories.flatMap((category) => category.isActive ? category.items.filter((item) => item.isActive) : []) ?? [];
  const deliveryItems = deliverySection?.categories.flatMap((category) => category.isActive ? category.items.filter((item) => item.isActive) : []) ?? [];

  const togglePanel = (section: MariaGuideSection) => {
    setHighlightedId(section.id);
    setExpandedPanels((current) => {
      const next = new Set(current);
      if (next.has(section.id)) next.delete(section.id);
      else next.add(section.id);
      return next;
    });
  };
  const materialOpenCategory = materialCategories.find((category) => category.id === openMaterialId);
  const expandedPanelCount = panels.filter((section) => expandedPanels.has(section.id)).length;
  const panelGridClass = expandedPanelCount >= 4 ? "xl:grid-cols-4" : expandedPanelCount === 3 ? "xl:grid-cols-3" : expandedPanelCount === 2 ? "xl:grid-cols-2" : "xl:grid-cols-1";

  if (panels.length !== 4) return null;

  return <section className="mt-8 rounded-2xl border border-pink-100 bg-white p-3 shadow-[0_14px_40px_rgba(236,17,116,0.06)] sm:p-5" aria-labelledby="maria-guide-title">
    <div className="sr-only"><h2 id="maria-guide-title">{guide.title}</h2><p>{guide.description}</p></div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{panels.map((section) => { const isExpanded = expandedPanels.has(section.id); const isHighlighted = section.id === highlightedId; return <button key={section.id} type="button" onClick={() => togglePanel(section)} className={`rounded-xl border p-4 text-left transition ${isHighlighted ? "border-pink-500 bg-pink-50 shadow-sm" : "border-slate-200 bg-white hover:border-pink-200 hover:bg-pink-50/30"}`} aria-expanded={isExpanded} aria-controls={`maria-guide-${section.id}`}><div className="flex items-start gap-4"><div className="rounded-lg bg-pink-50 p-2 text-pink-600"><GuideIcon name={section.icon} className="h-8 w-8" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-extrabold text-slate-950">{section.title}</h3><ChevronDown className={`h-4 w-4 text-pink-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></div><p className="mt-1 text-xs leading-5 text-slate-600">{section.subtitle}</p></div></div></button>; })}</div>

    <div className={`mt-4 grid gap-3 ${panelGridClass} ${!expandedPanels.has("impressao") ? "[&>#maria-guide-impressao]:hidden" : ""} ${!expandedPanels.has("material") ? "[&>#maria-guide-material]:hidden" : ""} ${!expandedPanels.has("acabamento") ? "[&>#maria-guide-acabamento]:hidden" : ""} ${!expandedPanels.has("entrega") ? "[&>#maria-guide-entrega]:hidden" : ""}`}>
      {expandedPanelCount === 0 && <div className="col-span-full rounded-xl border border-dashed border-pink-200 bg-pink-50/50 px-5 py-8 text-center text-sm text-slate-600">Escolha um dos quatro cards acima para expandir o conteúdo técnico.</div>}
      <article id="maria-guide-impressao" className={`flex min-h-[450px] flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${highlightedId === "impressao" ? "border-pink-300 shadow-md" : "border-slate-200"}`}><header className="flex items-start gap-3 px-4 py-4"><div className="rounded-lg bg-pink-50 p-2 text-pink-600"><GuideIcon name="printer" className="h-7 w-7" /></div><div><h3 className="font-extrabold text-slate-950">Tipos de impressão</h3><p className="mt-1 text-xs leading-5 text-slate-600">{printSection?.description}</p></div></header><div className="border-y border-slate-100">{printingItems.map((item) => <ItemRow key={item.id} item={item} icon="printer" isOpen={openPrintId === item.id} onClick={() => setOpenPrintId(openPrintId === item.id ? null : item.id)} />)}</div><GuideTip text={printSection?.tip ?? "Em caso de dúvida, nossa equipe pode ajudar a encontrar a melhor tecnologia."} /></article>

      <article id="maria-guide-material" className={`flex min-h-[450px] flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${highlightedId === "material" ? "border-pink-300 shadow-md" : "border-slate-200"}`}><header className="flex items-start gap-3 px-4 py-4"><div className="rounded-lg bg-pink-50 p-2 text-pink-600"><GuideIcon name="layers" className="h-7 w-7" /></div><div><h3 className="font-extrabold text-slate-950">Materiais disponíveis</h3><p className="mt-1 text-xs leading-5 text-slate-600">{materialSection?.description}</p></div></header><div className="border-y border-slate-100">{materialCategories.map((category) => <button key={category.id} type="button" onClick={() => setOpenMaterialId(openMaterialId === category.id ? null : category.id)} className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 ${openMaterialId === category.id ? "bg-pink-50/70" : "hover:bg-pink-50/30"}`} aria-expanded={openMaterialId === category.id}><div className="flex gap-2.5"><div className="rounded-lg bg-pink-50 p-1.5 text-pink-600"><Layers3 className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-slate-950">{category.title}</p><ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${openMaterialId === category.id ? "rotate-180" : ""}`} /></div><p className="mt-0.5 max-h-7 overflow-hidden text-[11px] leading-3.5 text-slate-600">{category.items.filter((item) => item.isActive).map((item) => item.title.replace(" — Perfurada", "")).join(", ")}</p></div></div></button>)}</div>{materialOpenCategory && <div className="border-b border-pink-100 bg-pink-50/30 p-3"><p className="mb-2 text-xs font-extrabold text-pink-700">{materialOpenCategory.title}</p><div className="space-y-2">{materialOpenCategory.items.filter((item) => item.isActive).map((item) => <button key={item.id} type="button" onClick={() => setSelectedFinish(item)} className="flex w-full items-start gap-2 rounded-lg bg-white p-2 text-left text-xs text-slate-600 ring-1 ring-pink-100 hover:ring-pink-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-600" /><span><strong className="text-slate-900">{item.title}.</strong> {item.description}</span></button>)}</div></div>}<GuideTip text={materialSection?.tip ?? "Escolha o material conforme o projeto, a instalação e o ambiente de uso."} /></article>

      <article id="maria-guide-acabamento" className={`flex min-h-[450px] flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${highlightedId === "acabamento" ? "border-pink-300 shadow-md" : "border-slate-200"}`}><header className="flex items-start gap-3 px-4 py-4"><div className="rounded-lg bg-pink-50 p-2 text-pink-600"><GuideIcon name="crop" className="h-7 w-7" /></div><div><h3 className="font-extrabold text-slate-950">Acabamentos disponíveis</h3><p className="mt-1 text-xs leading-5 text-slate-600">{finishSection?.description}</p></div></header><div className="grid grid-cols-3 border-y border-slate-100">{finishItems.map((item) => <button key={item.id} type="button" onClick={() => setSelectedFinish(selectedFinish?.id === item.id ? null : item)} className={`min-h-[82px] border-b border-r border-slate-100 p-2 text-center transition hover:bg-pink-50/40 ${selectedFinish?.id === item.id ? "bg-pink-50" : "bg-white"}`} aria-pressed={selectedFinish?.id === item.id}><span className="mx-auto flex h-9 w-9 items-center justify-center"><FinishSymbol id={item.id} /></span><span className="mt-1 block text-[9px] font-extrabold leading-3 text-slate-900">{item.title}</span></button>)}</div>{selectedFinish?.illustration && <div className="border-b border-pink-100 bg-pink-50/40 p-2"><TechnicalIllustration kind={selectedFinish.illustration} /></div>}{selectedFinish && !selectedFinish.illustration && <div className="border-b border-pink-100 bg-pink-50/40 px-3 py-2 text-xs leading-5 text-slate-600"><span className="font-extrabold text-pink-700">{selectedFinish.title}:</span> {selectedFinish.description}</div>}<GuideTip text={finishSection?.tip ?? "O acabamento adequado valoriza e protege o material conforme o projeto."} /></article>

      <article id="maria-guide-entrega" className={`flex min-h-[450px] flex-col overflow-hidden rounded-xl border bg-white transition-shadow ${highlightedId === "entrega" ? "border-pink-300 shadow-md" : "border-slate-200"}`}><header className="flex items-start gap-3 px-4 py-4"><div className="rounded-lg bg-pink-50 p-2 text-pink-600"><GuideIcon name="truck" className="h-7 w-7" /></div><div><h3 className="font-extrabold text-slate-950">Entrega e retirada</h3><p className="mt-1 text-xs leading-5 text-slate-600">{deliverySection?.description}</p></div></header><div className="border-y border-slate-100">{deliveryItems.map((item, index) => <ItemRow key={item.id} item={item} icon={index === 0 ? "sparkles" : index === 1 ? "truck" : index === 2 ? "package" : index === 3 ? "printer" : "layers"} isOpen={openDeliveryId === item.id} onClick={() => setOpenDeliveryId(openDeliveryId === item.id ? null : item.id)} />)}</div><GuideTip text={deliverySection?.tip ?? "Consulte as condições disponíveis durante a configuração do pedido."} /></article>
    </div>

    <footer className="mt-4 flex flex-col gap-4 rounded-xl border border-pink-200 bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex max-w-3xl items-start gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" /><div><p className="font-extrabold text-slate-950">{guide.bottomNoteTitle}</p><p className="mt-1 text-xs leading-5 text-slate-600">{guide.bottomNote}</p></div></div><div className="flex flex-col gap-2 sm:flex-row"><a href="/documentos" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-pink-200 px-4 text-sm font-bold text-pink-700 transition hover:bg-pink-50"><FileText className="h-4 w-4" />Ver normas para envio de arte</a><a href="#maria-guide-entrega" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 text-sm font-bold text-white transition hover:bg-pink-700"><Truck className="h-4 w-4" />Falar com a Maria</a></div></footer>
  </section>;
}
