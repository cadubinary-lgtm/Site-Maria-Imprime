import { ArrowLeft, Download, FileText, Loader2, PackageCheck } from "lucide-react";
import { Link } from "wouter";
import { Footer } from "@/components/home/Footer";
import { trpc } from "@/lib/trpc";

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toUpperCase() || "ARQUIVO";
const formatFileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function PrintTemplatesPage() {
  const { data: templates = [], isLoading } = trpc.printTemplates.listPublic.useQuery(undefined, { staleTime: 60_000 });

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
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="templates-title" className="text-xl font-bold text-slate-900">Arquivos disponíveis</h2><p className="mt-1 text-sm text-slate-600">Escolha o arquivo indicado para o seu produto e siga as orientações de envio da arte.</p></div><Link href="/documentos/normas-envio-arte" className="text-sm font-bold text-pink-600 transition hover:text-pink-700">Ver normas para envio da arte</Link></div>
            {isLoading ? <div className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-pink-600" aria-label="Carregando gabaritos" /></div> : templates.length === 0 ? <div className="rounded-3xl border border-dashed border-pink-200 bg-pink-50 px-6 py-12 text-center"><FileText className="mx-auto h-8 w-8 text-pink-600" /><h2 className="mt-4 text-lg font-bold text-slate-900">Gabaritos em preparação</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Nossa equipe está organizando os arquivos. Se precisar de um gabarito específico, fale conosco para receber a orientação correta.</p><Link href="/contato" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-pink-700">Falar com a equipe</Link></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{templates.map((template) => <article key={template.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-md"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600"><FileText className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-bold text-slate-900">{template.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{template.description || "Arquivo de montagem disponibilizado pela Maria Imprime."}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500"><span>{extensionOf(template.fileName)}</span><span>{formatFileSize(template.fileSize)}</span></div><a href={template.fileUrl} target="_blank" rel="noopener noreferrer" download className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-bold text-pink-700 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"><Download className="h-4 w-4" />Baixar gabarito</a></article>)}</div>}
          </section>

          <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Não encontrou o seu produto?</h2><p className="mt-1 text-sm text-slate-600">Nossa equipe pode orientar qual arquivo usar antes de você enviar a arte.</p></div><Link href="/catalogo" className="inline-flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700"><ArrowLeft className="h-4 w-4" />Ver todos os produtos</Link></section>
        </div>
      </main>
      <Footer />
    </>
  );
}
