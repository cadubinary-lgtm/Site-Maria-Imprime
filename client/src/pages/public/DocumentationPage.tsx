import { ArrowLeft, ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";
import { PUBLIC_DOCUMENTS } from "@/components/TermsAcceptance";
import { Footer } from "@/components/home/Footer";

const documentSummaries: Record<string, string> = {
  "termos-venda": "Regras aplicáveis às compras e aos serviços da Maria Imprime.",
  "aprovacao-arte": "Orientações para conferir e aprovar a arte antes da produção.",
  "producao-prazos": "Informações sobre produção, prazos e condições necessárias.",
  "trocas-reembolsos": "Condições de troca, cancelamento e reembolso.",
  "privacidade-lgpd": "Como tratamos e protegemos seus dados pessoais.",
  "cookies": "Informações sobre o uso de cookies no site.",
  "uso-site": "Regras de uso dos canais digitais da Maria Imprime.",
  "faq": "Respostas para as dúvidas mais frequentes sobre pedidos e impressão.",
  "formas-pagamento": "Modalidades habilitadas, análise e condições de pagamento.",
  "entrega-retirada": "Modalidades de recebimento, estimativas de frete e retirada.",
};

export default function DocumentationPage() {
  const [, params] = useRoute("/documentos/:documentId");
  const requestedId = params?.documentId;
  const currentDocument = requestedId ? PUBLIC_DOCUMENTS.find((document) => document.id === requestedId) : null;

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
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Central de documentação</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-pink-50 sm:text-base">Consulte em páginas próprias os documentos, políticas e orientações da Maria Imprime.</p>
            </section>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Documentos disponíveis">
              {PUBLIC_DOCUMENTS.map((document) => (
                <Link key={document.id} href={`/documentos/${document.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
                  <FileText className="h-5 w-5 text-pink-600" />
                  <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-pink-600">{document.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{documentSummaries[document.id]}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pink-600">Ler documento <ChevronRight className="h-4 w-4" /></span>
                </Link>
              ))}
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
              <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{currentDocument.content}</div>
            </article>
            <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6" aria-label="Outros documentos">
              <h2 className="text-sm font-bold text-slate-900">Outros documentos</h2>
              <ul className="mt-3 space-y-1">
                {PUBLIC_DOCUMENTS.filter((document) => document.id !== currentDocument.id).map((document) => <li key={document.id}><Link href={`/documentos/${document.id}`} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-pink-50 hover:text-pink-600"><span>{document.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></Link></li>)}
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
