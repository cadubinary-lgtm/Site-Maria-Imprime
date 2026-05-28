import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  User, Phone, MapPin, Package, DollarSign, Clock,
  Calendar, Hash, Truck, Image as ImageIcon, Download
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-800" },
  pagamento_retirada: { label: "Pagamento na Retirada", color: "bg-blue-100 text-blue-800" },
  analisando:         { label: "Analisando",           color: "bg-orange-100 text-orange-800" },
  com_problemas:      { label: "Com Problemas",        color: "bg-red-100 text-red-800" },
  em_producao:        { label: "Em Produção",          color: "bg-purple-100 text-purple-800" },
  pronto_entrega:     { label: "Pronto p/ Entrega",    color: "bg-teal-100 text-teal-800" },
  pronto_retirada:    { label: "Pronto p/ Retirada",   color: "bg-cyan-100 text-cyan-800" },
  entregue:           { label: "Entregue",             color: "bg-emerald-100 text-emerald-800" },
  cancelado:          { label: "Cancelado",            color: "bg-gray-100 text-gray-800" },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }) : "-";

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?.*)?$/i.test(url);
}

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1].split("?")[0]);
  } catch {
    return "arquivo";
  }
}

export default function AdminOSPrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orderId = params.id ? parseInt(params.id) : undefined;

  const { data, isLoading, error } = trpc.admin.getOrderWithItems.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: orderFiles = [] } = trpc.checkout.getOrderFiles.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: artPreviews = [] } = trpc.checkout.getArtPreviews.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Pedido não encontrado</p>
        <Button onClick={() => setLocation("/admin/os")}>← Voltar para OS</Button>
      </div>
    );
  }

  const o = data.order as any;
  const items = data.items as any[];
  const files = orderFiles as any[];
  const previews = artPreviews as any[];
  const sc = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.analisando;
  const isStorePickup = o.freteId === "retirada" || (!o.deliveryStreet && !o.deliveryCity);

  const handlePrint = () => window.print();

  return (
    <>
      {/* Barra de ações — não aparece na impressão */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/os")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para OS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/pedidos/${orderId}`)}>
            Ver Pedido Completo
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">OS #{o.orderNumber}</span>
          <Button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir OS
          </Button>
        </div>
      </div>

      {/* Conteúdo da OS — aparece na tela e na impressão */}
      <div className="min-h-screen bg-gray-100 print:bg-white py-6 print:py-0">
        <div className="max-w-4xl mx-auto px-4 print:px-0 space-y-4 print:space-y-3">

          {/* Cabeçalho da OS */}
          <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 print:bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">ORDEM DE SERVIÇO</h1>
                  <p className="text-gray-300 text-xs">Gráfica Ponto Digital</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold text-xl">{o.orderNumber}</p>
                <p className="text-gray-300 text-xs">{fmtDate(o.createdAt)}</p>
              </div>
            </div>

            {/* Linha de status e info rápida */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <Badge className={`${sc.color} text-xs px-3 py-1`}>{sc.label}</Badge>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Hash className="w-3 h-3" /> ID: {o.id}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" /> {fmtDate(o.createdAt)}
              </div>
              {o.deliveryMethod && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Truck className="w-3 h-3" /> {o.deliveryMethod}
                </div>
              )}
            </div>
          </div>

          {/* Grid: Cliente + Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
            {/* Dados do Cliente */}
            <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" /> Dados do Cliente
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Nome</p>
                  <p className="font-semibold text-gray-900">{o.deliveryFullName || o.guestName || `Cliente #${o.clientId}`}</p>
                </div>
                {o.deliveryPhone && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Telefone / WhatsApp</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {o.deliveryPhone}
                    </p>
                  </div>
                )}
                {(o.guestEmail || o.clientEmail) && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">E-mail</p>
                    <p className="font-medium text-gray-800">{o.guestEmail || o.clientEmail}</p>
                  </div>
                )}
                {o.notes && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Observações do Cliente</p>
                    <p className="text-sm text-gray-700 bg-yellow-50 rounded p-2 mt-1">{o.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Endereço / Entrega */}
            <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Entrega / Retirada
              </h2>
              {isStorePickup ? (
                <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Retirada na Loja</p>
                    <p className="text-xs text-green-600">Cliente retira no estabelecimento</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {o.deliveryStreet && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Endereço</p>
                      <p className="font-medium text-gray-800">
                        {o.deliveryStreet}, {o.deliveryNumber}
                        {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                      </p>
                    </div>
                  )}
                  {o.deliveryNeighborhood && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Bairro / Cidade</p>
                      <p className="font-medium text-gray-800">
                        {o.deliveryNeighborhood} · {o.deliveryCity} - {o.deliveryState}
                      </p>
                    </div>
                  )}
                  {o.deliveryZipCode && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">CEP</p>
                      <p className="font-medium text-gray-800">{o.deliveryZipCode}</p>
                    </div>
                  )}
                  {o.deliveryMethod && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Método de Entrega</p>
                      <p className="font-medium text-gray-800 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {o.deliveryMethod}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Produtos do Pedido */}
          <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Produtos / Serviços</h2>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">Nenhum produto neste pedido</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2">Produto</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2">Qtd</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-2">Valor Unit.</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        {item.selectedAttributes && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Atributos: {item.selectedAttributes}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-orange-600 mt-0.5 bg-orange-50 rounded px-1.5 py-0.5 inline-block">
                            {item.notes}
                          </p>
                        )}
                        {item.artFileUrl && (
                          <a
                            href={item.artFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1 print:hidden"
                          >
                            <Download className="w-3 h-3" /> Baixar arquivo
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-medium text-gray-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0"))}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-900">
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" /> Resumo Financeiro
            </h2>
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{fmt(parseFloat(o.subtotalPrice?.toString() ?? o.totalPrice?.toString() ?? "0"))}</span>
              </div>
              {o.deliveryPrice && parseFloat(o.deliveryPrice.toString()) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frete</span>
                  <span>{fmt(parseFloat(o.deliveryPrice.toString()))}</span>
                </div>
              )}
              {o.discountAmount && parseFloat(o.discountAmount.toString()) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>- {fmt(parseFloat(o.discountAmount.toString()))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-orange-600">{fmt(parseFloat(o.totalPrice?.toString() ?? "0"))}</span>
              </div>
              {o.paymentMethod && (
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Forma de Pagamento</span>
                  <span className="capitalize">{o.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arquivos do Cliente */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" /> Arquivos Enviados pelo Cliente
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {files.map((file: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-600 truncate">{file.productName}</p>
                    </div>
                    {isImageUrl(file.artFileUrl) ? (
                      <div className="relative">
                        <img
                          src={file.artFileUrl}
                          alt={`Arte ${file.productName}`}
                          className="w-full h-32 object-contain bg-white p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <a
                          href={file.artFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-1 right-1 bg-white rounded shadow px-1.5 py-0.5 text-xs text-blue-600 hover:underline print:hidden"
                        >
                          Abrir
                        </a>
                      </div>
                    ) : isPdfUrl(file.artFileUrl) ? (
                      <div className="h-32 flex flex-col items-center justify-center gap-2 bg-red-50">
                        <FileText className="w-8 h-8 text-red-400" />
                        <p className="text-xs text-red-600 font-medium">PDF</p>
                        <a
                          href={file.artFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline print:hidden"
                        >
                          Abrir PDF
                        </a>
                      </div>
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center gap-2 bg-gray-50">
                        <Download className="w-8 h-8 text-gray-400" />
                        <a
                          href={file.artFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline print:hidden"
                        >
                          {fileNameFromUrl(file.artFileUrl)}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prévia de Arte (enviada pelo admin) */}
          {previews.length > 0 && (
            <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" /> Prévia de Arte (Aprovada)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {previews.map((preview: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={preview.imageUrl}
                      alt={`Prévia ${i + 1}`}
                      className="w-full h-32 object-contain bg-white p-1"
                    />
                    {preview.notes && (
                      <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-500">{preview.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo de Assinatura */}
          <div className="bg-white rounded-xl print:rounded-none shadow-sm border border-gray-100 print:border print:border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Controle de Produção
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 uppercase mb-6">Recebido por</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-400">Assinatura / Data</p>
                </div>
              </div>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 uppercase mb-6">Produzido por</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-400">Assinatura / Data</p>
                </div>
              </div>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400 uppercase mb-6">Entregue por</p>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs text-gray-400">Assinatura / Data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-gray-400 py-4 print:py-2">
            <p>Gráfica Ponto Digital · OS gerada em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      </div>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
