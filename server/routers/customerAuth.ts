/**
 * Customer Auth Router — Gráfica Ponto Digital
 * Autenticação própria de clientes (email/senha)
 * Separado do Manus OAuth (admin)
 */
import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { getDb, addToCart } from "../db";
import {
  customerAccounts,
  customerSessions,
} from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendSuspiciousLoginAlert,
  sendVerificationEmail,
} from "../emailService";
import { getSessionCookieOptions } from "../_core/cookies";
import { authenticateAdminRequest, logAudit } from "../admin-auth";

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000; // 24 horas
const RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hora

// ── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: Record<string, unknown>): string {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  const socket = req.socket as { remoteAddress?: string } | undefined;
  return socket?.remoteAddress || "unknown";
}

/**
 * Lê o cookie customer_session diretamente do header Cookie da requisição.
 * Não depende de cookie-parser — usa o mesmo padrão do sdk.ts (Manus OAuth).
 */
function getCustomerSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed["customer_session"] || undefined;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db;
}

async function requireCustomerAdmin(ctx: { user?: { role?: string } | null; req: unknown }) {
  if (ctx.user?.role === "admin") return { name: "Administrador", adminId: undefined };
  const admin = await authenticateAdminRequest(ctx.req as Request);
  if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem gerenciar acessos de clientes." });
  }
  return { name: admin.name, adminId: admin.adminId };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const customerAuthRouter = router({
  checkEmail: publicProcedure.input(z.object({ email: z.string().email() })).query(async ({ input }) => {
    const db = await requireDb();
    const match = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.email, input.email.toLowerCase().trim())).limit(1);
    return { exists: match.length > 0 };
  }),
  checkCpfCnpj: publicProcedure
    .input(z.object({ cpfCnpj: z.string().min(11).max(14) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const document = input.cpfCnpj.replace(/\D/g, "");
      if (document.length !== 11 && document.length !== 14) return { exists: false };
      const match = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.cpfCnpj, document)).limit(1);
      return { exists: match.length > 0 };
    }),
  /**
   * Registro de novo cliente
   */
  register: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
        lastName: z.string().min(2, "Sobrenome deve ter ao menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
        password: z
          .string()
          .min(8, "Senha deve ter ao menos 8 caracteres")
          .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
          .regex(/[0-9]/, "Senha deve conter ao menos um número"),
        // Endereço de entrega (opcional no cadastro)
        addressZipCode: z.string().optional(),
        addressStreet: z.string().optional(),
        addressNumber: z.string().optional(),
        addressComplement: z.string().optional(),
        addressNeighborhood: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      // Verificar email duplicado
      const existing = await db
        .select({ id: customerAccounts.id })
        .from(customerAccounts)
        .where(eq(customerAccounts.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está cadastrado. Faça login ou use outro email.",
        });
      }

      // Verificar CPF/CNPJ duplicado
      if (input.cpfCnpj) {
        const cpfExists = await db
          .select({ id: customerAccounts.id })
          .from(customerAccounts)
          .where(eq(customerAccounts.cpfCnpj, input.cpfCnpj))
          .limit(1);

        if (cpfExists.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este CPF/CNPJ já está cadastrado.",
          });
        }
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Token de verificação de email
      const emailVerificationToken = nanoid(64);
      const emailVerificationExpires = now + VERIFICATION_EXPIRES_MS;

      // Inserir cliente
      await db.insert(customerAccounts).values({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone?.trim() || null,
        cpfCnpj: input.cpfCnpj?.trim() || null,
        passwordHash,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
        status: "inactive",
        loginAttempts: 0,
        // Endereço de entrega (opcional)
        addressZipCode: input.addressZipCode?.replace(/\D/g, "") || null,
        addressStreet: input.addressStreet?.trim() || null,
        addressNumber: input.addressNumber?.trim() || null,
        addressComplement: input.addressComplement?.trim() || null,
        addressNeighborhood: input.addressNeighborhood?.trim() || null,
        addressCity: input.addressCity?.trim() || null,
        addressState: input.addressState?.toUpperCase() || null,
        createdAt: now,
        updatedAt: now,
      });

      // Enviar email de boas-vindas com link de verificação
      await sendWelcomeEmail(input.email, input.firstName, emailVerificationToken);

      return {
        success: true,
        message: "Cadastro realizado! Verifique seu email para ativar sua conta.",
      };
    }),

  /**
   * Login de cliente
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const now = Date.now();
      const req = ctx.req as Request;
      const res = ctx.res as Response;
      const ip = getClientIp(req as unknown as Record<string, unknown>);

      // Buscar cliente
      const [customer] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.email, input.email.toLowerCase()))
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos.",
        });
      }

      // Verificar bloqueio por tentativas excessivas
      if (customer.lockedUntil && customer.lockedUntil > now) {
        const minutesLeft = Math.ceil((customer.lockedUntil - now) / 60000);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Conta bloqueada por segurança. Tente novamente em ${minutesLeft} minuto(s).`,
        });
      }

      // Verificar senha
      const passwordValid = await bcrypt.compare(input.password, customer.passwordHash);

      if (!passwordValid) {
        const newAttempts = (customer.loginAttempts || 0) + 1;
        const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

        await db
          .update(customerAccounts)
          .set({
            loginAttempts: newAttempts,
            lockedUntil: shouldLock ? now + LOCK_DURATION_MS : null,
            updatedAt: now,
          })
          .where(eq(customerAccounts.id, customer.id));

        if (shouldLock) {
          await sendSuspiciousLoginAlert(customer.email, customer.firstName, ip);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Muitas tentativas incorretas. Conta bloqueada por 15 minutos. Um email de alerta foi enviado.",
          });
        }

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Email ou senha incorretos. ${MAX_LOGIN_ATTEMPTS - newAttempts} tentativa(s) restante(s).`,
        });
      }

      // Verificar se email foi confirmado
      if (!customer.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Confirme seu email antes de fazer login. Verifique sua caixa de entrada.",
        });
      }

      // Verificar se conta está ativa
      if (customer.status === "blocked") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta foi bloqueada. Entre em contato com o suporte.",
        });
      }

      // Criar sessão
      const sessionToken = nanoid(64);
      const expiresAt = now + SESSION_DURATION_MS;

      const reqHeaders = (req.headers) as Record<string, string | undefined>;
      await db.insert(customerSessions).values({
        customerId: customer.id,
        token: sessionToken,
        expiresAt,
        createdAt: now,
        ipAddress: ip,
        userAgent: reqHeaders["user-agent"] || null,
      });

      // Resetar tentativas e atualizar último login
      await db
        .update(customerAccounts)
        .set({
          loginAttempts: 0,
          lockedUntil: null,
          lastLogin: now,
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, customer.id));

      // Definir cookie de sessão usando getSessionCookieOptions (sameSite:'none', secure baseado em x-forwarded-proto)
      res.cookie("customer_session", sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: SESSION_DURATION_MS / 1000,
      });

      return {
        success: true,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
        },
      };
    }),

  /**
   * Logout de cliente
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const req = ctx.req as Request;
    const res = ctx.res as Response;
    const token = getCustomerSessionToken(req);

    if (token) {
      const db = await getDb();
      if (db) {
        await db.delete(customerSessions).where(eq(customerSessions.token, token));
      }
    }

    res.clearCookie("customer_session", {
      ...getSessionCookieOptions(req),
    });

    return { success: true };
  }),

  /**
   * Obter cliente autenticado atual
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const req = ctx.req as Request;
    const token = getCustomerSessionToken(req);
    if (!token) return null;

    const db = await getDb();
    if (!db) return null;

    const now = Date.now();

    const [session] = await db
      .select()
      .from(customerSessions)
      .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
      .limit(1);

    if (!session) return null;

    const [customer] = await db
      .select({
        id: customerAccounts.id,
        firstName: customerAccounts.firstName,
        lastName: customerAccounts.lastName,
        email: customerAccounts.email,
        phone: customerAccounts.phone,
        cpfCnpj: customerAccounts.cpfCnpj,
        emailVerified: customerAccounts.emailVerified,
        status: customerAccounts.status,
        priceTier: customerAccounts.priceTier,
        createdAt: customerAccounts.createdAt,
      })
      .from(customerAccounts)
      .where(eq(customerAccounts.id, session.customerId))
      .limit(1);

    if (!customer || customer.status === "blocked") return null;

    return customer;
  }),

  /**
   * Verificar email com token
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [customer] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.emailVerificationToken, input.token))
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token inválido ou já utilizado.",
        });
      }

      if (customer.emailVerificationExpires && customer.emailVerificationExpires < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token expirado. Solicite um novo email de verificação.",
        });
      }

      await db
        .update(customerAccounts)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          status: "active",
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, customer.id));

      return {
        success: true,
        message: "Email confirmado com sucesso! Você já pode fazer login.",
      };
    }),

  /**
   * Solicitar redefinição de senha
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [customer] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.email, input.email.toLowerCase()))
        .limit(1);

      // Sempre retornar sucesso (não revelar se email existe)
      if (!customer) {
        return { success: true, message: "Se este email estiver cadastrado, você receberá as instruções em breve." };
      }

      const resetToken = nanoid(64);
      const resetExpires = now + RESET_EXPIRES_MS;

      await db
        .update(customerAccounts)
        .set({
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, customer.id));

      await sendPasswordResetEmail(customer.email, customer.firstName, resetToken);

      return { success: true, message: "Se este email estiver cadastrado, você receberá as instruções em breve." };
    }),

  /**
   * Redefinir senha com token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z
          .string()
          .min(8, "Senha deve ter ao menos 8 caracteres")
          .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
          .regex(/[0-9]/, "Senha deve conter ao menos um número"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [customer] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.resetPasswordToken, input.token))
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token inválido ou já utilizado.",
        });
      }

      if (customer.resetPasswordExpires && customer.resetPasswordExpires < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token expirado. Solicite uma nova redefinição de senha.",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

      await db
        .update(customerAccounts)
        .set({
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          loginAttempts: 0,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, customer.id));

      // Invalidar todas as sessões existentes
      await db.delete(customerSessions).where(eq(customerSessions.customerId, customer.id));

      await sendPasswordChangedEmail(customer.email, customer.firstName);

      return { success: true, message: "Senha redefinida com sucesso! Faça login com sua nova senha." };
    }),

  /**
   * Reenviar email de verificação
   */
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [customer] = await db
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.email, input.email.toLowerCase()))
        .limit(1);

      if (!customer || customer.emailVerified) {
        return { success: true, message: "Se este email estiver cadastrado e não verificado, você receberá um novo link." };
      }

      const emailVerificationToken = nanoid(64);
      const emailVerificationExpires = now + VERIFICATION_EXPIRES_MS;

      await db
        .update(customerAccounts)
        .set({
          emailVerificationToken,
          emailVerificationExpires,
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, customer.id));

      await sendVerificationEmail(customer.email, customer.firstName, emailVerificationToken);

      return { success: true, message: "Novo link de verificação enviado para seu email." };
    }),

  /**
   * Listar todos os clientes (admin)
   */
  adminListCustomers: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["all", "active", "inactive", "blocked"]).optional(),
        accountType: z.enum(["customer", "reseller", "agency"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verificar se é admin via Manus OAuth
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }

      const db = await requireDb();
      let query = db
        .select({
          id: customerAccounts.id,
          firstName: customerAccounts.firstName,
          lastName: customerAccounts.lastName,
          email: customerAccounts.email,
          phone: customerAccounts.phone,
          cpfCnpj: customerAccounts.cpfCnpj,
          emailVerified: customerAccounts.emailVerified,
          status: customerAccounts.status,
          priceTier: customerAccounts.priceTier,
          accountType: customerAccounts.accountType,
          lastLogin: customerAccounts.lastLogin,
          createdAt: customerAccounts.createdAt,
          allowStorePickup: customerAccounts.allowStorePickup,
        })
        .from(customerAccounts);

      const rows = await query;

      let filtered = rows;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.firstName.toLowerCase().includes(s) ||
            c.lastName.toLowerCase().includes(s) ||
            c.email.toLowerCase().includes(s) ||
            (c.phone && c.phone.includes(s))
        );
      }
      if (input.status && input.status !== "all") {
        filtered = filtered.filter((c) => c.status === input.status);
      }
      if (input.accountType) filtered = filtered.filter((c) => c.accountType === input.accountType);

      const total = filtered.length;
      const paginated = filtered.slice(input.offset, input.offset + input.limit);

      return { customers: paginated, total };
    }),

  adminCreatePartnerAccount: publicProcedure
    .input(z.object({
      firstName: z.string().min(2), lastName: z.string().min(2), email: z.string().email(),
      phone: z.string().optional(), cpfCnpj: z.string().optional(), accountType: z.enum(["customer", "reseller", "agency"]),
      password: z.string().min(8, "A senha temporária deve ter ao menos 8 caracteres"),
      addressZipCode: z.string().optional(), addressStreet: z.string().optional(), addressNumber: z.string().optional(),
      addressComplement: z.string().optional(), addressNeighborhood: z.string().optional(), addressCity: z.string().optional(), addressState: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireCustomerAdmin(ctx);
      const db = await requireDb();
      const email = input.email.toLowerCase().trim();
      const normalizedCpfCnpj = input.cpfCnpj?.replace(/\D/g, "") || null;
      const [existing] = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.email, email)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado. Reenvie o acesso ou use a recuperação de senha." });
      if (normalizedCpfCnpj) {
        const [existingCpfCnpj] = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.cpfCnpj, normalizedCpfCnpj)).limit(1);
        if (existingCpfCnpj) throw new TRPCError({ code: "CONFLICT", message: "Este CPF/CNPJ já está cadastrado em outro cliente." });
      }
      const now = Date.now();
      const resetToken = nanoid(64);
      await db.insert(customerAccounts).values({
        firstName: input.firstName.trim(), lastName: input.lastName.trim(), email,
        phone: input.phone?.trim() || null, cpfCnpj: normalizedCpfCnpj,
        addressZipCode: input.addressZipCode?.trim() || null, addressStreet: input.addressStreet?.trim() || null, addressNumber: input.addressNumber?.trim() || null,
        addressComplement: input.addressComplement?.trim() || null, addressNeighborhood: input.addressNeighborhood?.trim() || null, addressCity: input.addressCity?.trim() || null, addressState: input.addressState?.trim() || null,
        passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS), emailVerified: true, status: "active",
        priceTier: input.accountType === "reseller" ? "reseller" : "final", accountType: input.accountType, resetPasswordToken: resetToken,
        resetPasswordExpires: now + RESET_EXPIRES_MS, loginAttempts: 0, createdAt: now, updatedAt: now,
      });
      await sendPasswordResetEmail(email, input.firstName.trim(), resetToken);
      await logAudit({ adminId: admin.adminId, adminName: admin.name, action: "partner_access_created", entity: "customerAccounts", after: { email, accountType: input.accountType } });
      return { success: true, message: "Acesso criado. O parceiro recebeu um link temporário para definir a senha." };
    }),

  adminResendPartnerInvite: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireCustomerAdmin(ctx);
      const db = await requireDb();
      const [customer] = await db.select().from(customerAccounts).where(eq(customerAccounts.id, input.customerId)).limit(1);
      if (!customer || customer.accountType === "customer") throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro não encontrado." });
      const resetToken = nanoid(64);
      await db.update(customerAccounts).set({ resetPasswordToken: resetToken, resetPasswordExpires: Date.now() + RESET_EXPIRES_MS, updatedAt: Date.now() }).where(eq(customerAccounts.id, customer.id));
      await sendPasswordResetEmail(customer.email, customer.firstName, resetToken);
      await logAudit({ adminId: admin.adminId, adminName: admin.name, action: "partner_access_resent", entity: "customerAccounts", entityId: String(customer.id) });
      return { success: true };
    }),

  /** Atualizar dados cadastrais de um cliente pelo painel administrativo. */
  adminUpdateCustomer: publicProcedure
    .input(z.object({
      customerId: z.number(),
      firstName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
      lastName: z.string().min(2, "Sobrenome deve ter ao menos 2 caracteres"),
      email: z.string().email("E-mail inválido"),
      phone: z.string().optional(),
      cpfCnpj: z.string().optional(),
      addressZipCode: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().max(2).optional(),
      priceTier: z.enum(["final", "reseller"]),
      newPassword: z
        .string()
        .min(8, "Senha deve ter ao menos 8 caracteres")
        .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
        .regex(/[0-9]/, "Senha deve conter ao menos um número")
        .optional()
        .or(z.literal("")),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireCustomerAdmin(ctx);
      const db = await requireDb();
      const [current] = await db.select().from(customerAccounts).where(eq(customerAccounts.id, input.customerId)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });

      const email = input.email.toLowerCase().trim();
      if (email !== current.email) {
        const duplicated = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.email, email)).limit(1);
        if (duplicated.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
      }

      const emailChanged = email !== current.email;
      const verificationToken = emailChanged ? nanoid(64) : null;
      const now = Date.now();
      const passwordHash = input.newPassword ? await bcrypt.hash(input.newPassword, SALT_ROUNDS) : undefined;
      await db.update(customerAccounts).set({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        phone: input.phone?.trim() || null,
        cpfCnpj: input.cpfCnpj?.replace(/\D/g, "") || null,
        addressZipCode: input.addressZipCode?.replace(/\D/g, "") || null,
        addressStreet: input.addressStreet?.trim() || null,
        addressNumber: input.addressNumber?.trim() || null,
        addressComplement: input.addressComplement?.trim() || null,
        addressNeighborhood: input.addressNeighborhood?.trim() || null,
        addressCity: input.addressCity?.trim() || null,
        addressState: input.addressState?.trim().toUpperCase() || null,
        priceTier: input.priceTier,
        ...(passwordHash ? { passwordHash } : {}),
        ...(emailChanged ? {
          emailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: now + VERIFICATION_EXPIRES_MS,
        } : {}),
        updatedAt: now,
      }).where(eq(customerAccounts.id, current.id));

      if (emailChanged && verificationToken) await sendVerificationEmail(email, input.firstName.trim(), verificationToken);
      await logAudit({ adminId: admin.adminId, adminName: admin.name, action: "customer_updated", entity: "customerAccounts", entityId: String(current.id), after: { email } });
      return { success: true, emailVerificationSent: emailChanged };
    }),

  /**
   * Bloquear/desbloquear cliente (admin)
   */
  adminUpdateCustomerStatus: publicProcedure
    .input(
      z.object({
        customerId: z.number(),
        status: z.enum(["active", "inactive", "blocked"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }

      const db = await requireDb();
      await db
        .update(customerAccounts)
        .set({ status: input.status as any, updatedAt: Date.now() })
        .where(eq(customerAccounts.id, input.customerId));

      return { success: true };
    }),

  /** Define a tabela comercial aplicada ao cliente autenticado da loja. */
  adminUpdateCustomerPriceTier: publicProcedure
    .input(z.object({ customerId: z.number(), priceTier: z.enum(["final", "reseller"]) }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }

      const db = await requireDb();
      await db
        .update(customerAccounts)
        .set({ priceTier: input.priceTier as any, updatedAt: Date.now() })
        .where(eq(customerAccounts.id, input.customerId));

      return { success: true };
    }),

  /**
   * Atualizar perfil do cliente autenticado
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
        addressZipCode: z.string().optional(),
        addressStreet: z.string().optional(),
        addressNumber: z.string().optional(),
        addressComplement: z.string().optional(),
        addressNeighborhood: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().max(2).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado." });

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada. Faça login novamente." });

      await db
        .update(customerAccounts)
        .set({
          ...(input.firstName && { firstName: input.firstName }),
          ...(input.lastName && { lastName: input.lastName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.cpfCnpj !== undefined && { cpfCnpj: input.cpfCnpj?.trim() || null }),
          ...(input.addressZipCode !== undefined && { addressZipCode: input.addressZipCode?.replace(/\D/g, '') || null }),
          ...(input.addressStreet !== undefined && { addressStreet: input.addressStreet?.trim() || null }),
          ...(input.addressNumber !== undefined && { addressNumber: input.addressNumber?.trim() || null }),
          ...(input.addressComplement !== undefined && { addressComplement: input.addressComplement?.trim() || null }),
          ...(input.addressNeighborhood !== undefined && { addressNeighborhood: input.addressNeighborhood?.trim() || null }),
          ...(input.addressCity !== undefined && { addressCity: input.addressCity?.trim() || null }),
          ...(input.addressState !== undefined && { addressState: input.addressState?.toUpperCase() || null }),
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, session.customerId));

      return { success: true };
    }),

  /**
   * Buscar perfil completo do cliente autenticado (inclui endereço)
   */
  getProfile: publicProcedure
    .query(async ({ ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) return null;

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) return null;

      const [customer] = await db
        .select({
          id: customerAccounts.id,
          firstName: customerAccounts.firstName,
          lastName: customerAccounts.lastName,
          email: customerAccounts.email,
          phone: customerAccounts.phone,
          cpfCnpj: customerAccounts.cpfCnpj,
          addressZipCode: customerAccounts.addressZipCode,
          addressStreet: customerAccounts.addressStreet,
          addressNumber: customerAccounts.addressNumber,
          addressComplement: customerAccounts.addressComplement,
          addressNeighborhood: customerAccounts.addressNeighborhood,
          addressCity: customerAccounts.addressCity,
          addressState: customerAccounts.addressState,
          allowStorePickup: customerAccounts.allowStorePickup,
        })
        .from(customerAccounts)
        .where(eq(customerAccounts.id, session.customerId))
        .limit(1);

      return customer ?? null;
    }),

  /**
   * Salvar endereço de entrega padrão do cliente autenticado
   */
  saveAddress: publicProcedure
    .input(
      z.object({
        addressZipCode: z.string().min(8, "CEP inválido"),
        addressStreet: z.string().min(2, "Rua obrigatória"),
        addressNumber: z.string().min(1, "Número obrigatório"),
        addressComplement: z.string().optional(),
        addressNeighborhood: z.string().min(2, "Bairro obrigatório"),
        addressCity: z.string().min(2, "Cidade obrigatória"),
        addressState: z.string().length(2, "UF deve ter 2 letras"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado." });

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada." });

      await db
        .update(customerAccounts)
        .set({
          addressZipCode: input.addressZipCode.replace(/\D/g, ""),
          addressStreet: input.addressStreet.trim(),
          addressNumber: input.addressNumber.trim(),
          addressComplement: input.addressComplement?.trim() || null,
          addressNeighborhood: input.addressNeighborhood.trim(),
          addressCity: input.addressCity.trim(),
          addressState: input.addressState.toUpperCase(),
          updatedAt: now,
        })
        .where(eq(customerAccounts.id, session.customerId));

      return { success: true };
    }),

  /**
   * Buscar pedidos do cliente autenticado (customer auth)
   */
  getMyOrders: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        orderBy: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) return [];

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) return [];

      const { sql: sqlFn } = await import("drizzle-orm");
      const rows = await db.execute(
        sqlFn`
          SELECT 
            o.id, o.orderNumber, o.status, o.totalPrice, o.paymentStatus,
            o.deliveryCity, o.deliveryState, o.createdAt, o.updatedAt,
            COUNT(oi.id) as itemCount
          FROM orders o
          LEFT JOIN orderItems oi ON o.id = oi.orderId
          WHERE o.customerId = ${session.customerId}
          GROUP BY o.id
          ORDER BY o.createdAt DESC
        `
      ) as any;

      let orders = (rows[0] ?? []) as any[];

      // Filtro por status
      if (input.status && input.status !== "all") {
        orders = orders.filter((o: any) => o.status === input.status);
      }
      // Filtro por número do pedido
      if (input.search) {
        const q = input.search.toLowerCase();
        orders = orders.filter((o: any) => o.orderNumber?.toLowerCase().includes(q));
      }
      // Ordenação
      if (input.orderBy === "oldest") {
        orders.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (input.orderBy === "highest") {
        orders.sort((a: any, b: any) => parseFloat(b.totalPrice) - parseFloat(a.totalPrice));
      } else if (input.orderBy === "lowest") {
        orders.sort((a: any, b: any) => parseFloat(a.totalPrice) - parseFloat(b.totalPrice));
      } else {
        orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return orders;
    }),

  /**
   * Buscar detalhe de um pedido do cliente autenticado
   */
  getOrderDetail: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado." });

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada." });

      const { sql: sqlFn } = await import("drizzle-orm");
      const rows = await db.execute(
        sqlFn`
          SELECT o.*, COUNT(oi.id) as itemCount
          FROM orders o
          LEFT JOIN orderItems oi ON o.id = oi.orderId
          WHERE o.orderNumber = ${input.orderNumber} AND o.customerId = ${session.customerId}
          GROUP BY o.id
          LIMIT 1
        `
      ) as any;

      const order = ((rows[0] ?? []) as any[])[0];
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });

      return order;
    }),

  /**
   * Recomprar pedido (adicionar itens ao carrinho) — cliente autenticado
   */
  reorder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const req = ctx.req as Request;
      const token = getCustomerSessionToken(req);
      if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado." });

      const db = await requireDb();
      const now = Date.now();

      const [session] = await db
        .select()
        .from(customerSessions)
        .where(and(eq(customerSessions.token, token), gt(customerSessions.expiresAt, now)))
        .limit(1);

      if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada." });

      const { sql: sqlFn } = await import("drizzle-orm");
      // Buscar itens do pedido original
      const rows = await db.execute(
        sqlFn`
          SELECT oi.productId, oi.quantity, oi.priceAtOrder,
            oi.selectedAttributes, oi.artFileUrl, oi.notes,
            oi.variationSnapshot, oi.customDimensions,
            oi.prazoName, oi.prazoHours, oi.urgencyRate, oi.urgencyMultiplier, oi.urgencyUnit, oi.urgencySurcharge, oi.forecastDate, oi.forecastLabel,
            oi.shippingMethod, oi.shippingPrice, oi.shippingLabel, oi.cepDestino
          FROM orderItems oi
          INNER JOIN orders o ON o.id = oi.orderId
          WHERE o.id = ${input.orderId} AND o.customerId = ${session.customerId}
        `
      ) as any;

      const items = (rows[0] ?? []) as any[];
      if (!items.length) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });

      let addedCount = 0;
      for (const item of items) {
        await addToCart({
          sessionId: `cust_${session.customerId}`,
          productId: item.productId,
          quantity: item.quantity,
          priceAtCart: parseFloat(item.priceAtOrder),
          selectedAttributes: item.selectedAttributes ?? undefined,
          artFileUrl: item.artFileUrl ?? undefined,
          notes: item.notes ?? undefined,
          variationSnapshot: item.variationSnapshot ?? undefined,
          customDimensions: item.customDimensions ?? undefined,
          prazoName: item.prazoName ?? undefined,
          prazoHours: item.prazoHours ?? undefined,
          urgencyRate: item.urgencyRate ? parseFloat(item.urgencyRate) : undefined,
          urgencyMultiplier: item.urgencyMultiplier ? parseFloat(item.urgencyMultiplier) : undefined,
          urgencyUnit: item.urgencyUnit ?? undefined,
          urgencySurcharge: item.urgencySurcharge ? parseFloat(item.urgencySurcharge) : undefined,
          forecastDate: item.forecastDate ?? undefined,
          forecastLabel: item.forecastLabel ?? undefined,
          shippingMethod: item.shippingMethod ?? undefined,
          shippingPrice: item.shippingPrice ? parseFloat(item.shippingPrice) : undefined,
          shippingLabel: item.shippingLabel ?? undefined,
          cepDestino: item.cepDestino ?? undefined,
        });
        addedCount++;
      }

      return { addedCount };
    }),

  /**
   * Excluir cliente (admin)
   * Remove a conta e todas as sessões vinculadas
   */
  adminDeleteCustomer: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }
      const db = await requireDb();
      // Sessões são removidas em cascata pelo banco (onDelete: cascade)
      await db.delete(customerAccounts).where(eq(customerAccounts.id, input.customerId));
      return { success: true };
    }),

  /**
   * Liberar/revogar pagamento na retirada da loja (admin)
   */
  adminToggleStorePickup: publicProcedure
    .input(z.object({ customerId: z.number(), allow: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }
      const db = await requireDb();
      await db
        .update(customerAccounts)
        .set({ allowStorePickup: input.allow, updatedAt: Date.now() })
        .where(eq(customerAccounts.id, input.customerId));
      return { success: true };
    }),

  /**
   * Buscar dados completos de um cliente (admin)
   */
  adminGetCustomerDetail: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }
      const db = await requireDb();
      const [customer] = await db
        .select({
          id: customerAccounts.id,
          firstName: customerAccounts.firstName,
          lastName: customerAccounts.lastName,
          email: customerAccounts.email,
          phone: customerAccounts.phone,
          cpfCnpj: customerAccounts.cpfCnpj,
          emailVerified: customerAccounts.emailVerified,
          status: customerAccounts.status,
          priceTier: customerAccounts.priceTier,
          lastLogin: customerAccounts.lastLogin,
          createdAt: customerAccounts.createdAt,
          updatedAt: customerAccounts.updatedAt,
          loginAttempts: customerAccounts.loginAttempts,
          lockedUntil: customerAccounts.lockedUntil,
          allowStorePickup: customerAccounts.allowStorePickup,
          addressZipCode: customerAccounts.addressZipCode,
          addressStreet: customerAccounts.addressStreet,
          addressNumber: customerAccounts.addressNumber,
          addressComplement: customerAccounts.addressComplement,
          addressNeighborhood: customerAccounts.addressNeighborhood,
          addressCity: customerAccounts.addressCity,
          addressState: customerAccounts.addressState,
        })
        .from(customerAccounts)
        .where(eq(customerAccounts.id, input.customerId))
        .limit(1);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
      // Buscar últimos 20 pedidos do cliente
      const { sql: sqlFn } = await import("drizzle-orm");
      const ordersRows = await db.execute(
        sqlFn`
          SELECT id, orderNumber, status, totalPrice, createdAt, shippingLabel, shippingPrice, payment_method AS paymentMethod
          FROM orders
          WHERE customerId = ${input.customerId}
          ORDER BY createdAt DESC
          LIMIT 20
        `
      ) as any;
      const orders = (ordersRows[0] ?? []) as any[];
      return { customer, orders };
    }),

  /**
   * Redefinir senha de cliente (admin)
   */
  adminSetCustomerPassword: publicProcedure
    .input(
      z.object({
        customerId: z.number(),
        newPassword: z
          .string()
          .min(8, "Senha deve ter ao menos 8 caracteres")
          .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
          .regex(/[0-9]/, "Senha deve conter ao menos um número"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin pode acessar." });
      }
      const db = await requireDb();
      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
      await db
        .update(customerAccounts)
        .set({ passwordHash, updatedAt: Date.now() })
        .where(eq(customerAccounts.id, input.customerId));
      return { success: true };
    }),

  /**
   * Verificar se e-mail já está cadastrado (para validação no checkout)
   */
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [existing] = await db
        .select({ id: customerAccounts.id })
        .from(customerAccounts)
        .where(eq(customerAccounts.email, input.email.toLowerCase().trim()))
        .limit(1);
      return { exists: !!existing };
    }),
});
