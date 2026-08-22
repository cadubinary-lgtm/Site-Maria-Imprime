import { ArrowLeft, Download, FileText, Loader2, PackageCheck, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Footer } from "@/components/home/Footer";
import { trpc } from "@/lib/trpc";

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toUpperCase() || "ARQUIVO";
const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function PrintTemplatesPage() {
  const { data: templates = [], isLoading } = trpc.printTemplates.listPublic.useQuery(undefined, { staleTime: 60_000 });
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");
  const filteredTemplates = useMemo(() => templates.filter((template) => {
    if (!normalizedSearch) return true;
    return [template.title, template.description || "", template.fileName, extensionOf(template.fileName)]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  }), [templates, normalizedSearch]);
  const hasSearch = normalizedSearch.length > 0;

  return (
    <>
      <main className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Navegação estrutural" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-pink-600">Início</Link><span className="mx-2">/</span><span className="text-slate-700">Gabaritos</span></nav>
          <section className="rounded-3xl bg-gradient-to-br from-pink-600 to-pink-500 px-6 py-10 text-white shadow-sm sm:px-10 sm:py-12">
            <PackageCheck className="h-10 w-10" aria-hidden="true" />
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Gabaritos para impressão</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-pink-50 sm:text-base">Baixe o gabarito correto antes de montar a sua arte. Assim, medidas, sangria e áreas de segurança ficam prontas para produção.</p>
          </section>

          <section className="mt-8" aria-labelledby="templates-title">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="templates-title" className="text-xl font-bold text-slate-900">Arquivos disponíveis</h2><p className="mt-1 text-sm text-slate-600">Pesquise pelo nome do produto, descrição ou formato para localizar o arquivo certo.</p></div><Link href="/documentos/normas-envio-arte" className="text-sm font-bold text-pink-600 transition hover:text-pink-700">Ver normas para envio da arte</Link></div>

            {!isLoading && templates.length > 0 && <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><label htmlFor="template-search" className="sr-only">Buscar gabaritos</label><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="template-search" type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nome, produto ou formato do arquivo..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100" />{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Limpar busca" className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-pink-50 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"><X className="h-4 w-4" /></button>}</div><p role="status" aria-live="polite" className="mt-3 px-1 text-xs font-medium text-slate-500">{hasSearch ? `${filteredTemplates.length} de ${templates.length} gabarito${templates.length === 1 ? "" : "s"} encontrado${filteredTemplates.length === 1 ? "" : "s"}.` : `${templates.length} gabarito${templates.length === 1 ? " disponível" : "s disponíveis"}.`}</p></div>}

            {isLoading ? <div className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-pink-600" aria-label="Carregando gabaritos" /></div> : templates.length === 0 ? <div className="rounded-3xl border border-dashed border-pink-200 bg-pink-50 px-6 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-pink-600" /><h2 className="mt-4 text-lg font-bold text-slate-900">Gabaritos em preparação</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Nossa equipe está organizando os arquivos. Se precisar de um gabarito específico, fale conosco para receber a orientação correta.</p><Link href="/contato" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-pink-700">Falar com a equipe</Link></div> : filteredTemplates.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Search className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-4 text-lg font-bold text-slate-900">Nenhum gabarito encontrado</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Tente pesquisar por outro nome, produto ou formato de arquivo.</p><button type="button" onClick={() => setSearchTerm("")} className="mt-5 text-sm font-bold text-pink-600 hover:text-pink-700">Limpar busca</button></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div role="list" className="divide-y divide-slate-100">{filteredTemplates.map((template) => <article key={template.id} role="listitem" className="flex flex-col gap-4 p-4 transition hover:bg-pink-50/40 sm:flex-row sm:items-center sm:gap-5 sm:px-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600"><FileText className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-base font-bold text-slate-900">{template.title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{template.description || "Arquivo de montagem disponibilizado pela Maria Imprime."}</p></div><div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500 sm:border-t-0 sm:pt-0"><span>{extensionOf(template.fileName)}</span><span>{formatFileSize(template.fileSize)}</span></div><a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-bold text-pink-700 transition hover:border-pink-300 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"><Download className="h-4 w-4" />Baixar</a></article>)}</div></div>}
          </section>

          <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Não encontrou o seu produto?</h2><p className="mt-1 text-sm text-slate-600">Nossa equipe pode orientar qual arquivo usar antes de você enviar a arte.</p></div><Link href="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" />Ver todos os produtos</Link></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
