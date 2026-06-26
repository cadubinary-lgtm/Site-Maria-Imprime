import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, Send, MessageCircle, Mail, Phone, Bell, AlertCircle } from "lucide-react";

export default function AutomationDashboard() {
  const [selectedTab, setSelectedTab] = useState<"whatsapp" | "email" | "sms" | "notificacao" | "failed">("whatsapp");
  const [orderId, setOrderId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  // Queries
  const { data: statusCounts, isLoading: loadingCounts } = trpc.automation.countByStatus.useQuery();
  const { data: typeCounts, isLoading: loadingTypeCounts } = trpc.automation.countByType.useQuery();
  const { data: whatsappLogs, isLoading: loadingWhatsapp } = trpc.automation.getLogsByType.useQuery({
    type: "whatsapp",
  });
  const { data: emailLogs, isLoading: loadingEmail } = trpc.automation.getLogsByType.useQuery({
    type: "email",
  });
  const { data: smsLogs, isLoading: loadingSms } = trpc.automation.getLogsByType.useQuery({
    type: "sms",
  });
  const { data: notificationLogs, isLoading: loadingNotification } = trpc.automation.getLogsByType.useQuery({
    type: "notificacao",
  });
  const { data: failedLogs, isLoading: loadingFailed } = trpc.automation.getFailedLogs.useQuery({});

  // Mutations
  const sendWhatsAppMutation = trpc.automation.sendWhatsApp.useMutation({
    onSuccess: () => {
      toast.success("Mensagem WhatsApp enviada com sucesso!");
      setRecipient("");
      setMessage("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const sendEmailMutation = trpc.automation.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email enviado com sucesso!");
      setRecipient("");
      setMessage("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const sendSmsMutation = trpc.automation.sendSMS.useMutation({
    onSuccess: () => {
      toast.success("SMS enviado com sucesso!");
      setRecipient("");
      setMessage("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const handleSendWhatsApp = () => {
    if (!orderId || !recipient || !message) {
      toast.error("Preencha todos os campos");
      return;
    }
    sendWhatsAppMutation.mutate({
      orderId: parseInt(orderId),
      phoneNumber: recipient,
      message,
    });
  };

  const handleSendEmail = () => {
    if (!orderId || !recipient || !message) {
      toast.error("Preencha todos os campos");
      return;
    }
    sendEmailMutation.mutate({
      orderId: parseInt(orderId),
      email: recipient,
      subject: "Atualização do seu pedido",
      message,
    });
  };

  const handleSendSms = () => {
    if (!orderId || !recipient || !message) {
      toast.error("Preencha todos os campos");
      return;
    }
    sendSmsMutation.mutate({
      orderId: parseInt(orderId),
      phoneNumber: recipient,
      message,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enviado":
        return <span className="text-green-600">✓</span>;
      case "falhou":
        return <span className="text-red-600">✗</span>;
      default:
        return <span className="text-yellow-600">⏳</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enviado":
        return <Badge className="bg-green-100 text-green-800">Enviado</Badge>;
      case "falhou":
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Automação Inteligente</h1>
          <p className="text-gray-600 mt-2">Envie notificações por WhatsApp, Email, SMS e mais</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{statusCounts?.enviado || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Falhados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-red-600">{statusCounts?.falhou || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTypeCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-green-500">{typeCounts?.whatsapp || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Email</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTypeCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{typeCounts?.email || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">SMS</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTypeCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-orange-600">{typeCounts?.sms || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de envio */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enviar Notificação</CardTitle>
            <CardDescription>Escolha o canal e envie uma mensagem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>ID do Pedido</Label>
                  <Input
                    type="number"
                    placeholder="123"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Destinatário (Email/Telefone)</Label>
                  <Input
                    placeholder="email@example.com ou +5511999999999"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Mensagem</Label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendWhatsApp}
                  disabled={sendWhatsAppMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendEmailMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </Button>
                <Button
                  onClick={handleSendSms}
                  disabled={sendSmsMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Enviar SMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Abas de histórico */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedTab === "whatsapp" ? "default" : "outline"}
            onClick={() => setSelectedTab("whatsapp")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp ({whatsappLogs?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "email" ? "default" : "outline"}
            onClick={() => setSelectedTab("email")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email ({emailLogs?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "sms" ? "default" : "outline"}
            onClick={() => setSelectedTab("sms")}
          >
            <Phone className="w-4 h-4 mr-2" />
            SMS ({smsLogs?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "notificacao" ? "default" : "outline"}
            onClick={() => setSelectedTab("notificacao")}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notificações ({notificationLogs?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "failed" ? "default" : "outline"}
            onClick={() => setSelectedTab("failed")}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Falhadas ({failedLogs?.length || 0})
          </Button>
        </div>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Automações</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTab === "whatsapp" && (
              <div className="space-y-2">
                {loadingWhatsapp ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : whatsappLogs && whatsappLogs.length > 0 ? (
                  whatsappLogs.map((log: any) => (
                    <div key={log.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pedido #{log.orderId}</p>
                        <p className="text-sm text-gray-600">{log.recipient}</p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma mensagem WhatsApp enviada</p>
                )}
              </div>
            )}

            {selectedTab === "email" && (
              <div className="space-y-2">
                {loadingEmail ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : emailLogs && emailLogs.length > 0 ? (
                  emailLogs.map((log: any) => (
                    <div key={log.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pedido #{log.orderId}</p>
                        <p className="text-sm text-gray-600">{log.recipient}</p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum email enviado</p>
                )}
              </div>
            )}

            {selectedTab === "sms" && (
              <div className="space-y-2">
                {loadingSms ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : smsLogs && smsLogs.length > 0 ? (
                  smsLogs.map((log: any) => (
                    <div key={log.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pedido #{log.orderId}</p>
                        <p className="text-sm text-gray-600">{log.recipient}</p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhum SMS enviado</p>
                )}
              </div>
            )}

            {selectedTab === "notificacao" && (
              <div className="space-y-2">
                {loadingNotification ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : notificationLogs && notificationLogs.length > 0 ? (
                  notificationLogs.map((log: any) => (
                    <div key={log.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pedido #{log.orderId}</p>
                        <p className="text-sm text-gray-600">{log.recipient}</p>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma notificação enviada</p>
                )}
              </div>
            )}

            {selectedTab === "failed" && (
              <div className="space-y-2">
                {loadingFailed ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : failedLogs && failedLogs.length > 0 ? (
                  failedLogs.map((log: any) => (
                    <div key={log.id} className="border border-red-200 rounded p-3 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Pedido #{log.orderId}</p>
                          <p className="text-sm text-gray-600">{log.recipient}</p>
                          {log.errorMessage && (
                            <p className="text-sm text-red-600 mt-1">{log.errorMessage}</p>
                          )}
                        </div>
                        <Badge className="bg-red-100 text-red-800">Falhou</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma automação falhada</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}
