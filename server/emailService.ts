/**
 * Email Service — Maria Imprime
 * Integração com Resend para envio de emails transacionais
 *
 * Para migrar para domínio profissional:
 * 1. Verificar o e-mail de atendimento da Maria Imprime no painel Resend
 * 2. Atualizar RESEND_FROM_EMAIL=contato@graficapontodigital.com.br
 * 3. Atualizar RESEND_FROM_NAME=Maria Imprime
 * Nenhuma alteração de código necessária.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "Maria Imprime";
const SITE_URL = process.env.VITE_SITE_URL || "https://mariaimprime.com.br";
const EMAIL_HEADER_URL = `${SITE_URL}/manus-storage/maria-imprime-email-header_0f02bb0d.png`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-outer { padding: 0 !important; }
      .email-shell { width: 100% !important; border-radius: 0 !important; }
      .email-body { padding: 28px 22px !important; }
      .email-footer { padding: 26px 22px !important; }
      .email-button { padding: 14px 24px !important; font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff6fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table class="email-outer" width="100%" cellpadding="0" cellspacing="0" style="background:#fff6fa;padding:40px 0;">
    <tr><td align="center">
      <table class="email-shell" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(236,0,105,0.12);">
        <!-- Header -->
        <tr>
          <td style="background:#fdf4f7;padding:0;text-align:center;border-bottom:4px solid #ec0069;">
            <img src="${EMAIL_HEADER_URL}" alt="Maria Imprime — sua gráfica online" width="600" style="display:block;width:100%;height:auto;max-width:600px;border:0;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="email-body" style="padding:40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="email-footer" style="background:#2d1020;padding:26px 40px;text-align:center;border-top:4px solid #ec0069;">
            <p style="color:#ffffff;font-size:14px;font-weight:700;margin:0;">Maria Imprime</p>
            <p style="color:#f9a8c7;font-size:12px;margin:5px 0 0;">Sua gráfica online, do seu jeito.</p>
            <p style="color:#fce7f3;font-size:11px;line-height:17px;margin:16px 0 0;">© ${new Date().getFullYear()} Maria Imprime. Todos os direitos reservados.<br/>Este e-mail foi enviado automaticamente. Não responda a este endereço.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a class="email-button" href="${url}" style="display:inline-block;background:#ec0069;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px;margin:24px 0;box-shadow:0 4px 14px rgba(236,0,105,0.24);">${text}</a>`;
}

function h1(text: string): string {
  return `<h1 style="color:#2d1020;font-size:24px;font-weight:700;margin:0 0 8px;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="color:#5f4251;font-size:15px;line-height:1.7;margin:12px 0;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function templateWelcome(firstName: string, verifyUrl: string): string {
  return baseTemplate("Bem-vindo à Maria Imprime!", `
    ${h1(`Olá, ${firstName}! 👋`)}
    ${p("Seja bem-vindo à <strong>Maria Imprime</strong>. Estamos felizes em ter você conosco!")}
    ${p("Para ativar sua conta e começar a fazer pedidos, confirme seu endereço de email clicando no botão abaixo:")}
    <div style="text-align:center;">${btn("Confirmar meu email", verifyUrl)}</div>
    ${p("Este link expira em <strong>24 horas</strong>. Se você não criou uma conta, ignore este email.")}
    ${divider()}
    ${p("Dúvidas? Entre em contato pelo WhatsApp ou pelo nosso site.")}
  `);
}

export function templateVerifyEmail(firstName: string, verifyUrl: string): string {
  return baseTemplate("Confirme seu email", `
    ${h1("Confirme seu endereço de email")}
    ${p(`Olá, <strong>${firstName}</strong>! Clique no botão abaixo para confirmar seu email e ativar sua conta:`)}
    <div style="text-align:center;">${btn("Confirmar email", verifyUrl)}</div>
    ${p("Este link expira em <strong>24 horas</strong>.")}
    ${p("Se você não solicitou isso, ignore este email.")}
  `);
}

export function templatePasswordReset(firstName: string, resetUrl: string): string {
  return baseTemplate("Redefinição de senha", `
    ${h1("Redefinição de senha")}
    ${p(`Olá, <strong>${firstName}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta.`)}
    ${p("Clique no botão abaixo para criar uma nova senha:")}
    <div style="text-align:center;">${btn("Redefinir minha senha", resetUrl)}</div>
    ${p("Este link expira em <strong>1 hora</strong>.")}
    ${divider()}
    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;">
      <p style="color:#92400e;font-size:14px;margin:0;">⚠️ Se você não solicitou a redefinição de senha, sua conta pode estar em risco. Entre em contato conosco imediatamente.</p>
    </div>
  `);
}

export function templatePasswordChanged(firstName: string): string {
  return baseTemplate("Senha alterada com sucesso", `
    ${h1("Senha alterada com sucesso ✅")}
    ${p(`Olá, <strong>${firstName}</strong>! Sua senha foi alterada com sucesso.`)}
    ${p("Se você não realizou esta alteração, entre em contato conosco imediatamente.")}
    <div style="text-align:center;">${btn("Acessar minha conta", `${SITE_URL}/login-cliente`)}</div>
  `);
}

export function templateSuspiciousLogin(firstName: string, ip: string, time: string): string {
  return baseTemplate("Tentativa de login suspeita", `
    ${h1("⚠️ Atividade suspeita detectada")}
    ${p(`Olá, <strong>${firstName}</strong>! Detectamos múltiplas tentativas de login na sua conta.`)}
    <div style="background:#fee2e2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#991b1b;font-size:14px;margin:0;"><strong>IP:</strong> ${ip}<br/><strong>Horário:</strong> ${time}</p>
    </div>
    ${p("Sua conta foi temporariamente bloqueada por segurança. Aguarde 15 minutos ou redefina sua senha.")}
    <div style="text-align:center;">${btn("Redefinir senha", `${SITE_URL}/recuperar-senha`)}</div>
  `);
}

export function templateOrderConfirmation(firstName: string, orderNumber: string, total: string): string {
  return baseTemplate("Pedido confirmado!", `
    ${h1(`Pedido #${orderNumber} confirmado! 🎉`)}
    ${p(`Olá, <strong>${firstName}</strong>! Seu pedido foi recebido com sucesso.`)}
    <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#166534;font-size:15px;margin:0;"><strong>Pedido:</strong> #${orderNumber}<br/><strong>Total:</strong> R$ ${total}</p>
    </div>
    ${p("Você pode acompanhar o status do seu pedido em tempo real:")}
    <div style="text-align:center;">${btn("Acompanhar pedido", `${SITE_URL}/confirmacao/${orderNumber}`)}</div>
  `);
}

export function templateOrderStatusUpdate(firstName: string, orderNumber: string, newStatus: string, trackUrl?: string): string {
  const url = trackUrl ?? `${SITE_URL}/confirmacao/${orderNumber}`;
  return baseTemplate("Status do pedido atualizado", `
    ${h1("Status do pedido atualizado \ud83d\udce6")}
    ${p(`Olá, <strong>${firstName}</strong>! Seu pedido <strong>#${orderNumber}</strong> teve o status atualizado.`)}
    <div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#1e40af;font-size:15px;margin:0;"><strong>Novo status:</strong> ${newStatus}</p>
    </div>
    ${p("Acompanhe seu pedido em tempo real. Não é necessário fazer login:")}
    <div style="text-align:center;">${btn("Acompanhar meu pedido", url)}</div>
    ${divider()}
    ${p("Dúvidas? Entre em contato pelo WhatsApp ou pelo nosso site.")}
  `);
}

// ── Send Functions ─────────────────────────────────────────────────────────────

type SendResult = { success: boolean; error?: string };

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[EMAIL] Resend error:", error);
      return { success: false, error: error.message };
    }
    console.log(`[EMAIL] Sent "${subject}" to ${to}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] Exception:", msg);
    return { success: false, error: msg };
  }
}

export async function sendWelcomeEmail(to: string, firstName: string, verifyToken: string): Promise<SendResult> {
  const verifyUrl = `${SITE_URL}/verificar-email?token=${verifyToken}`;
  return send(to, "Bem-vindo à Maria Imprime — Confirme seu e-mail", templateWelcome(firstName, verifyUrl));
}

export async function sendVerificationEmail(to: string, firstName: string, verifyToken: string): Promise<SendResult> {
  const verifyUrl = `${SITE_URL}/verificar-email?token=${verifyToken}`;
  return send(to, "Confirme seu e-mail — Maria Imprime", templateVerifyEmail(firstName, verifyUrl));
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string): Promise<SendResult> {
  const resetUrl = `${SITE_URL}/nova-senha?token=${resetToken}`;
  return send(to, "Redefinição de senha — Maria Imprime", templatePasswordReset(firstName, resetUrl));
}

export async function sendPasswordChangedEmail(to: string, firstName: string): Promise<SendResult> {
  return send(to, "Sua senha foi alterada — Maria Imprime", templatePasswordChanged(firstName));
}

export async function sendSuspiciousLoginAlert(to: string, firstName: string, ip: string): Promise<SendResult> {
  const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return send(to, "⚠️ Atividade suspeita na sua conta — Maria Imprime", templateSuspiciousLogin(firstName, ip, time));
}

export async function sendOrderConfirmationEmail(to: string, firstName: string, orderNumber: string, total: string): Promise<SendResult> {
  return send(to, `Pedido #${orderNumber} confirmado — Maria Imprime`, templateOrderConfirmation(firstName, orderNumber, total));
}

export function templateOrderConfirmationWithLink(firstName: string, orderNumber: string, total: string, trackUrl: string): string {
  return baseTemplate("Pedido confirmado!", `
    ${h1(`Pedido #${orderNumber} confirmado! 🎉`)}
    ${p(`Olá, <strong>${firstName}</strong>! Seu pedido foi recebido com sucesso e já está sendo processado.`)}
    <div style="background:#f0fdf4;border:1px solid #22c55e;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#166534;font-size:15px;margin:0;"><strong>Número do pedido:</strong> #${orderNumber}<br/><strong>Total:</strong> R$ ${total}<br/><strong>Status inicial:</strong> Pagamento Aprovado</p>
    </div>
    ${p("Acompanhe o status do seu pedido em tempo real clicando no botão abaixo. Não é necessário fazer login:")}
    <div style="text-align:center;">${btn("Acompanhar meu pedido", trackUrl)}</div>
    ${divider()}
    ${p("Guarde este e-mail para acessar seu pedido a qualquer momento. Dúvidas? Entre em contato pelo WhatsApp.")}
  `);
}

export async function sendOrderConfirmationWithLink(to: string, firstName: string, orderNumber: string, total: string, trackUrl: string): Promise<SendResult> {
  return send(to, `Pedido #${orderNumber} confirmado — Maria Imprime`, templateOrderConfirmationWithLink(firstName, orderNumber, total, trackUrl));
}

export async function sendOrderStatusUpdateEmail(to: string, firstName: string, orderNumber: string, newStatus: string, trackUrl?: string): Promise<SendResult> {
  return send(to, `Pedido #${orderNumber} atualizado — Maria Imprime`, templateOrderStatusUpdate(firstName, orderNumber, newStatus, trackUrl));
}

// ── Template: Pagamento PIX Confirmado (identidade visual rosa) ────────────────────────────────────────

export function templatePixPaymentConfirmed(
  firstName: string,
  orderNumber: string,
  total: string,
  trackUrl: string
): string {
  return baseTemplate("Pagamento PIX confirmado!", `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:#f0fdf4;border:3px solid #22c55e;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;text-align:center;">&#x2705;</div>
    </div>
    <h1 style="color:#1a1a2e;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">Pagamento PIX confirmado! &#x1F389;</h1>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">
      Olá, <strong>${firstName}</strong>! Seu pagamento via <strong>PIX</strong> foi <strong style="color:#22c55e;">aprovado com sucesso</strong>.
      Seu pedido já está na fila de produção!
    </p>
    <div style="background:#fdf2f8;border:2px solid #ec4899;border-radius:12px;padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;">
            <span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Número do Pedido</span><br/>
            <span style="color:#1a1a2e;font-size:20px;font-weight:800;">#${orderNumber}</span>
          </td>
          <td style="padding:6px 0;text-align:right;">
            <span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Total Pago</span><br/>
            <span style="color:#ec4899;font-size:22px;font-weight:800;">R$ ${total}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:14px;border-top:1px solid #fbcfe8;">
            <span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Status</span><br/>
            <span style="color:#166534;font-size:15px;font-weight:700;">&#x2705; Pagamento Aprovado — Entrando em Produção</span>
          </td>
        </tr>
      </table>
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">
      Acompanhe o status do seu pedido em tempo real. Você será notificado por e-mail a cada atualização:
    </p>
    <div style="text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;box-shadow:0 4px 14px rgba(236,72,153,0.35);">
        &#x1F50D; Acompanhar Pedido
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0;">
      Dúvidas? Fale conosco pelo WhatsApp:
      <a href="https://wa.me/5522999459596" style="color:#ec4899;font-weight:600;">(22) 99945-9596</a>
    </p>
  `);
}

export async function sendPixPaymentConfirmedEmail(
  to: string,
  firstName: string,
  orderNumber: string,
  total: string,
  trackUrl: string
): Promise<{ success: boolean; error?: string }> {
  return send(
    to,
    `✅ Pagamento PIX confirmado — Pedido #${orderNumber}`,
    templatePixPaymentConfirmed(firstName, orderNumber, total, trackUrl)
  );
}

// ── Template: Reenvio de Arte Solicitado ─────────────────────────────────────
export function templateArtResendRequest(
  firstName: string,
  orderNumber: string,
  productName: string,
  operatorNote: string | null,
  trackUrl: string
): string {
  const noteBlock = operatorNote
    ? `<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;"><p style="color:#9a3412;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Observação do operador</p><p style="color:#7c2d12;font-size:15px;line-height:1.6;margin:0;">${operatorNote}</p></div>`
    : "";
  return baseTemplate("Reenvio de Arte Necessário", `
    <div style="text-align:center;margin-bottom:20px;"><div style="display:inline-block;background:#fff7ed;border:3px solid #f97316;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;text-align:center;">&#x26A0;&#xFE0F;</div></div>
    <h1 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Precisamos da sua arte novamente</h1>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">Olá, <strong>${firstName}</strong>! Nossa equipe analisou o arquivo enviado para o pedido <strong>#${orderNumber}</strong> e identificou um problema com a arte do produto <strong>${productName}</strong>.</p>
    <div style="background:#fdf2f8;border:2px solid #ec4899;border-radius:12px;padding:20px;margin:20px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 0;"><span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Número do Pedido</span><br/><span style="color:#1a1a2e;font-size:20px;font-weight:800;">#${orderNumber}</span></td><td style="padding:6px 0;text-align:right;"><span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Produto</span><br/><span style="color:#1a1a2e;font-size:15px;font-weight:700;">${productName}</span></td></tr></table></div>
    ${noteBlock}
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">Por favor, acesse o seu pedido e envie um novo arquivo de arte para que possamos continuar a produção:</p>
    <div style="text-align:center;"><a href="${trackUrl}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;box-shadow:0 4px 14px rgba(236,72,153,0.35);">&#x1F4CE; Enviar Nova Arte</a></div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0;">Dúvidas? Fale conosco pelo WhatsApp: <a href="https://wa.me/5522999459596" style="color:#ec4899;font-weight:600;">(22) 99945-9596</a></p>
  `);
}

export async function sendArtResendRequestEmail(
  to: string, firstName: string, orderNumber: string, productName: string,
  operatorNote: string | null, trackUrl: string
): Promise<SendResult> {
  return send(to, `⚠️ Reenvio de arte necessário — Pedido #${orderNumber}`, templateArtResendRequest(firstName, orderNumber, productName, operatorNote, trackUrl));
}

// ── Template: Prova Enviada para Aprovação ────────────────────────────────────
export function templateProofForApproval(
  firstName: string, orderNumber: string, productName: string,
  operatorNote: string | null, proofImageUrl: string | null, trackUrl: string
): string {
  const noteBlock = operatorNote
    ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;"><p style="color:#14532d;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;">Mensagem do operador</p><p style="color:#166534;font-size:15px;line-height:1.6;margin:0;">${operatorNote}</p></div>`
    : "";
  const proofBlock = proofImageUrl
    ? `<div style="text-align:center;margin:20px 0;"><p style="color:#475569;font-size:13px;margin:0 0 10px;">Prévia da arte aprovada:</p><img src="${proofImageUrl}" alt="Prévia da arte" style="max-width:100%;border-radius:8px;border:2px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.08);" /></div>`
    : "";
  return baseTemplate("Prova de Arte para Aprovação", `
    <div style="text-align:center;margin-bottom:20px;"><div style="display:inline-block;background:#f0fdf4;border:3px solid #22c55e;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;text-align:center;">&#x1F3A8;</div></div>
    <h1 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Sua prova de arte está pronta!</h1>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">Olá, <strong>${firstName}</strong>! Nossa equipe preparou a prova de arte do produto <strong>${productName}</strong> do pedido <strong>#${orderNumber}</strong>. Precisamos da sua aprovação para iniciar a produção.</p>
    <div style="background:#fdf2f8;border:2px solid #ec4899;border-radius:12px;padding:20px;margin:20px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 0;"><span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Número do Pedido</span><br/><span style="color:#1a1a2e;font-size:20px;font-weight:800;">#${orderNumber}</span></td><td style="padding:6px 0;text-align:right;"><span style="color:#9d174d;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Produto</span><br/><span style="color:#1a1a2e;font-size:15px;font-weight:700;">${productName}</span></td></tr></table></div>
    ${noteBlock}
    ${proofBlock}
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">Acesse o seu pedido para <strong>aprovar ou recusar</strong> a prova. Após a aprovação, sua arte será enviada imediatamente para produção:</p>
    <div style="text-align:center;"><a href="${trackUrl}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px;margin:16px 0;box-shadow:0 4px 14px rgba(236,72,153,0.35);">&#x2705; Ver e Aprovar Prova</a></div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:12px 0;">Dúvidas? Fale conosco pelo WhatsApp: <a href="https://wa.me/5522999459596" style="color:#ec4899;font-weight:600;">(22) 99945-9596</a></p>
  `);
}

export async function sendProofForApprovalEmail(
  to: string, firstName: string, orderNumber: string, productName: string,
  operatorNote: string | null, proofImageUrl: string | null, trackUrl: string
): Promise<SendResult> {
  return send(to, `🎨 Prova de arte pronta para aprovação — Pedido #${orderNumber}`, templateProofForApproval(firstName, orderNumber, productName, operatorNote, proofImageUrl, trackUrl));
}
