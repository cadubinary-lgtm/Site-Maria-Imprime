import React from 'react';
import { Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EmailHistoryItem {
  id: number;
  orderId: number;
  orderItemId?: number | null;
  recipientEmail: string;
  recipientName?: string | null;
  emailType: string;
  subject: string;
  templateName?: string | null;
  operatorNote?: string | null;
  proofImageUrl?: string | null;
  status: 'sent' | 'failed' | 'bounced';
  errorMessage?: string | null;
  sentAt: Date | string;
  createdAt: Date | string;
}

interface EmailTimelineProps {
  emails: EmailHistoryItem[];
  isLoading?: boolean;
  showProofImages?: boolean;
}

const getEmailTypeLabel = (emailType: string): string => {
  const labels: Record<string, string> = {
    'art_resend_request': 'Solicitação de Reenvio de Arte',
    'proof_for_approval': 'Prova para Aprovação',
    'order_confirmation': 'Confirmação de Pedido',
    'payment_confirmation': 'Confirmação de Pagamento',
    'production_started': 'Produção Iniciada',
    'ready_for_pickup': 'Pronto para Retirada',
    'ready_for_delivery': 'Pronto para Entrega',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'order_cancelled': 'Pedido Cancelado',
    'other': 'Outro',
  };
  return labels[emailType] || emailType;
};

const getEmailTypeIcon = (emailType: string) => {
  switch (emailType) {
    case 'art_resend_request':
    case 'proof_for_approval':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'order_confirmation':
    case 'payment_confirmation':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'production_started':
    case 'ready_for_pickup':
    case 'ready_for_delivery':
    case 'shipped':
    case 'delivered':
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    case 'order_cancelled':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Mail className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'sent':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Enviado
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Falha
        </span>
      );
    case 'bounced':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⚠ Devolvido
        </span>
      );
    default:
      return null;
  }
};

export function EmailTimeline({ emails, isLoading = false, showProofImages = false }: EmailTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum e-mail enviado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email, index) => (
        <div key={email.id} className="relative">
          {/* Timeline line */}
          {index < emails.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-12 bg-gray-200"></div>
          )}

          {/* Email card */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-sm">
              {getEmailTypeIcon(email.emailType)}
            </div>

            {/* Content */}
            <div className="flex-grow bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900">
                    {getEmailTypeLabel(email.emailType)}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Para: <span className="font-medium">{email.recipientName || email.recipientEmail}</span>
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(email.status)}
                </div>
              </div>

              {/* Subject */}
              <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded px-3 py-2">
                <span className="font-medium">Assunto:</span> {email.subject}
              </p>

              {/* Operator note */}
              {email.operatorNote && (
                <div className="mb-3 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Nota do Operador:</p>
                  <p className="text-sm text-blue-800">{email.operatorNote}</p>
                </div>
              )}

              {/* Error message */}
              {email.status === 'failed' && email.errorMessage && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2">
                  <p className="text-xs font-semibold text-red-900 mb-1">Erro:</p>
                  <p className="text-sm text-red-800">{email.errorMessage}</p>
                </div>
              )}

              {/* Proof image */}
              {showProofImages && email.proofImageUrl && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Prévia da Arte:</p>
                  <img
                    src={email.proofImageUrl}
                    alt="Prévia da arte"
                    className="max-w-xs h-auto rounded border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      if (email.proofImageUrl) {
                        window.open(email.proofImageUrl, '_blank');
                      }
                    }}
                  />
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <Clock className="w-3.5 h-3.5" />
                <time dateTime={typeof email.sentAt === 'string' ? email.sentAt : email.sentAt.toISOString()}>
                  {format(
                    typeof email.sentAt === 'string' ? new Date(email.sentAt) : email.sentAt,
                    "dd 'de' MMMM 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </time>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
