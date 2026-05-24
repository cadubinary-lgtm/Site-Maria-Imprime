/**
 * Email Service — Gráfica Ponto Digital
 * Integração com Resend para envio de emails transacionais
 *
 * Para migrar para domínio profissional:
 * 1. Verificar contato@graficapontodigital.com.br no painel Resend
 * 2. Atualizar RESEND_FROM_EMAIL=contato@graficapontodigital.com.br
 * 3. Atualizar RESEND_FROM_NAME=Gráfica Ponto Digital
 * Nenhuma alteração de código necessária.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = process.env.RESEND_FROM_NAME || "Gráfica Ponto Digital";
const SITE_URL = process.env.VITE_SITE_URL || "https://graficaapp-uwgro8uv.manus.space";

// ── Helpers ──────────────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:800;color:#FF6B35;letter-spacing:-1px;">●DIGITAL</span>
            <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;">Gráfica Ponto Digital</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Gráfica Ponto Digital. Todos os direitos reservados.</p>
            <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">Este email foi enviado automaticamente. Não responda a este endereço.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;margin:24px 0;">${text}</a>`;
}

function h1(text: string): string {
  return `<h1 style="color:#1a1a2e;font-size:24px;font-weight:700;margin:0 0 8px;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="color:#475569;font-size:15px;line-height:1.7;margin:12px 0;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function templateWelcome(firstName: string, verifyUrl: string): string {
  return baseTemplate("Bem-vindo à Gráfica Ponto Digital!", `
    ${h1(`Olá, ${firstName}! 👋`)}
    ${p("Seja bem-vindo à <strong>Gráfica Ponto Digital</strong>. Estamos felizes em ter você conosco!")}
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

export function templateOrderStatusUpdate(firstName: string, orderNumber: string, newStatus: string): string {
  return baseTemplate("Status do pedido atualizado", `
    ${h1("Status do pedido atualizado 📦")}
    ${p(`Olá, <strong>${firstName}</strong>! Seu pedido <strong>#${orderNumber}</strong> teve o status atualizado.`)}
    <div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#1e40af;font-size:15px;margin:0;"><strong>Novo status:</strong> ${newStatus}</p>
    </div>
    <div style="text-align:center;">${btn("Ver detalhes do pedido", `${SITE_URL}/confirmacao/${orderNumber}`)}</div>
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
  return send(to, "Bem-vindo à Gráfica Ponto Digital — Confirme seu email", templateWelcome(firstName, verifyUrl));
}

export async function sendVerificationEmail(to: string, firstName: string, verifyToken: string): Promise<SendResult> {
  const verifyUrl = `${SITE_URL}/verificar-email?token=${verifyToken}`;
  return send(to, "Confirme seu email — Gráfica Ponto Digital", templateVerifyEmail(firstName, verifyUrl));
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetToken: string): Promise<SendResult> {
  const resetUrl = `${SITE_URL}/nova-senha?token=${resetToken}`;
  return send(to, "Redefinição de senha — Gráfica Ponto Digital", templatePasswordReset(firstName, resetUrl));
}

export async function sendPasswordChangedEmail(to: string, firstName: string): Promise<SendResult> {
  return send(to, "Sua senha foi alterada — Gráfica Ponto Digital", templatePasswordChanged(firstName));
}

export async function sendSuspiciousLoginAlert(to: string, firstName: string, ip: string): Promise<SendResult> {
  const time = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return send(to, "⚠️ Atividade suspeita na sua conta — Gráfica Ponto Digital", templateSuspiciousLogin(firstName, ip, time));
}

export async function sendOrderConfirmationEmail(to: string, firstName: string, orderNumber: string, total: string): Promise<SendResult> {
  return send(to, `Pedido #${orderNumber} confirmado — Gráfica Ponto Digital`, templateOrderConfirmation(firstName, orderNumber, total));
}

export async function sendOrderStatusUpdateEmail(to: string, firstName: string, orderNumber: string, newStatus: string): Promise<SendResult> {
  return send(to, `Pedido #${orderNumber} atualizado — Gráfica Ponto Digital`, templateOrderStatusUpdate(firstName, orderNumber, newStatus));
}
