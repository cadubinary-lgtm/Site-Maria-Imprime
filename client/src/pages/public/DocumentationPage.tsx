import { Fragment, useState } from "react";
import { ArrowLeft, ChevronRight, FileText, Search, ShieldCheck, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Footer } from "@/components/home/Footer";
import { trpc } from "@/lib/trpc";
import { mergeFooterContent, mergePublicDocuments } from "@/lib/siteContent";

function InlineDocumentText({ value }: { value: string }) {
  return <>{value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>)}</>;
}

function ArtworkGuidelinesBody({ content }: { content: string }) {
  return <div className="space-y-6 text-sm leading-7 text-slate-700 sm:text-base">
    {content.trim().split(/\n{2,}/).map((block, index) => {
      const lines = block.split("\n").filter(Boolean);
      const heading = lines[0] ?? "";
      if (heading.startsWith("# ") || heading.startsWith("## ")) return <section key={index} className="border-b border-pink-100 pb-3"><h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{heading.replace(/^#{1,2}\s*/, "")}</h2></section>;
      if (heading.startsWith("### ")) return <h3 key={index} className="pt-2 text-lg font-bold text-pink-700">{heading.replace(/^###\s*/, "")}</h3>;
      if (lines.every((line) => line.startsWith("* [ ] "))) return <ul key={index} className="grid gap-2 rounded-2xl border border-pink-100 bg-pink-50/70 p-5 sm:grid-cols-2">{lines.map((line) => <li key={line} className="flex gap-2 text-sm text-slate-700"><span className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-pink-500" aria-hidden="true" /><InlineDocumentText value={line.replace("* [ ] ", "")} /></li>)}</ul>;
      if (lines.every((line) => line.startsWith("* "))) return <ul key={index} className="space-y-2 pl-5 marker:text-pink-600">{lines.map((line) => <li key={line}><InlineDocumentText value={line.replace("* ", "")} /></li>)}</ul>;
      const isNotice = heading.startsWith("**Atenção:") || heading.startsWith("**Importante:");
      return <p key={index} className={isNotice ? "rounded-2xl border border-pink-200 bg-pink-50 px-5 py-4 text-slate-700" : ""}>{lines.map((line, lineIndex) => <Fragment key={lineIndex}><InlineDocumentText value={line} />{lineIndex < lines.length - 1 && <br />}</Fragment>)}</p>;
    })}
  </div>;
}

export default function DocumentationPage() {
  const [, params] = useRoute("/documentos/:documentId");
  const requestedId = params?.documentId;
  const [documentQuery, setDocumentQuery] = useState("");
  const { data: savedDocuments } = trpc.siteContent.getPublicDocuments.useQuery(undefined, { staleTime: 60_000 });
  const { data: savedFooterContent } = trpc.siteContent.getPublicFooter.useQuery(undefined, { staleTime: 60_000 });
  const footerContent = mergeFooterContent(savedFooterContent);
  const documents = mergePublicDocuments(savedDocuments);
  const currentDocument = requestedId ? documents.find((document) => document.slug === requestedId) : null;
  const normalizedDocumentQuery = documentQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredDocuments = documents.filter((document) => {
    if (!normalizedDocumentQuery) return true;

    return [document.title, document.summary]
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedDocumentQuery);
  });

  if (requestedId && !currentDocument) {
    return (
      <>
        <main className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-pink-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Documento não encontrado</h1>
            <p className="mt-3 text-slate-600">Escolha um documento disponível na Central de Documentação.</p>
            <Link href="/documentos" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-pink-700"><ArrowLeft className="h-4 w-4" />Ver documentos</Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (!currentDocument) {
    return (
      <>
        <main className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Navegação estrutural" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-pink-600">Início</Link><ChevronRight className="mx-1 inline h-4 w-4" />Central de documentação</nav>
            <section className="rounded-3xl bg-gradient-to-br from-pink-600 to-pink-500 px-6 py-10 text-white shadow-sm sm:px-10">
              <ShieldCheck className="h-9 w-9" />
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{footerContent.documentsTitle}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-pink-50 sm:text-base">{footerContent.documentsDescription}</p>
            </section>
            <section className="mt-8" aria-labelledby="documents-list-title">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 id="documents-list-title" className="text-lg font-bold text-slate-900">Documentos disponíveis</h2>
                  <p className="mt-1 text-sm text-slate-600">Encontre rapidamente a política ou orientação que você precisa.</p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <label htmlFor="document-search" className="sr-only">Buscar documentos</label>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="document-search"
                    type="search"
                    value={documentQuery}
                    onChange={(event) => setDocumentQuery(event.target.value)}
                    placeholder="Buscar documentos"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  />
                  {documentQuery && (
                    <button
                      type="button"
                      onClick={() => setDocumentQuery("")}
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-pink-50 hover:text-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                      aria-label="Limpar busca de documentos"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {filteredDocuments.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
                  {filteredDocuments.map((document) => (
                    <Link key={document.slug} href={`/documentos/${document.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
                      <FileText className="h-5 w-5 text-pink-600" />
                      <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-pink-600">{document.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{document.summary}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pink-600">Ler documento <ChevronRight className="h-4 w-4" /></span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50 px-6 py-10 text-center" role="status" aria-live="polite">
                  <Search className="mx-auto h-6 w-6 text-pink-600" aria-hidden="true" />
                  <h3 className="mt-3 font-bold text-slate-900">Nenhum documento encontrado</h3>
                  <p className="mt-1 text-sm text-slate-600">Tente outro termo ou limpe a busca para ver todos os documentos.</p>
                  <button type="button" onClick={() => setDocumentQuery("")} className="mt-4 text-sm font-bold text-pink-600 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2">Limpar busca</button>
                </div>
              )}
            </section>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Navegação estrutural" className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:text-pink-600">Início</Link><ChevronRight className="mx-1 inline h-4 w-4" /><Link href="/documentos" className="hover:text-pink-600">Central de documentação</Link><ChevronRight className="mx-1 inline h-4 w-4" /><span className="text-slate-700">{currentDocument.title}</span></nav>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
              <div className="flex items-start gap-4 border-b border-slate-100 pb-6"><div className="rounded-2xl bg-pink-50 p-3 text-pink-600"><FileText className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-pink-600">Documentação da Maria Imprime</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{currentDocument.title}</h1></div></div>
              {currentDocument.slug === "normas-envio-arte" ? <div className="mt-8"><ArtworkGuidelinesBody content={currentDocument.content} /></div> : <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{currentDocument.content}</div>}
            </article>
            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6" aria-label="Outros documentos">
              <h2 className="text-sm font-bold text-slate-900">Outros documentos</h2>
              <ul className="mt-3 space-y-1">
                {documents.filter((document) => document.slug !== currentDocument.slug).map((document) => <li key={document.slug}><Link href={`/documentos/${document.slug}`} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-pink-50 hover:text-pink-600"><span>{document.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></Link></li>)}
              </ul>
              <Link href="/documentos" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" />Todos os documentos</Link>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
