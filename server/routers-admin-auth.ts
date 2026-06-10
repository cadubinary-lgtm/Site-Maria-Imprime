/**
 * Admin Auth Router
 * Procedures tRPC para autenticação própria de administradores e gestão de admins.
 * Separado do Manus OAuth — login via email + senha.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import { adminAccounts, adminSessions, auditLogs } from "../drizzle/schema";
import {
  loginAdmin,
  logoutAdmin,
  hashPassword,
  logAudit,
  createFirstSuperAdmin,
  ADMIN_SESSION_COOKIE,
  authenticateAdminRequest,
} from "./admin-auth";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Procedure que requer autenticação admin própria (não Manus OAuth)
 * Lê o cookie admin_session do request
 */
const adminAuthProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminUser = await authenticateAdminRequest(ctx.req);
  if (!adminUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Login de administrador necessário" });
  }
  return next({ ctx: { ...ctx, adminUser } });
});

/**
 * Procedure que requer role superadmin
 */
const superAdminProcedure = adminAuthProcedure.use(({ ctx, next }) => {
  if ((ctx as any).adminUser.role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas superadmin pode executar esta ação" });
  }
  return next({ ctx });
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const adminAuthRouter = router({

  // ─── Autenticação ───────────────────────────────────────────────────────────

  /**
   * Login de administrador — email + senha
   * Retorna token JWT e seta cookie admin_session
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email("E-mail inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const ipAddress = ctx.req.ip || ctx.req.connection?.remoteAddress || "unknown";
        const userAgent = ctx.req.headers["user-agent"] || "";

        const { token, admin } = await loginAdmin({
          email: input.email,
          password: input.password,
          ipAddress,
          userAgent,
        });

        // Setar cookie HTTP-only
        ctx.res.cookie(ADMIN_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 8 * 60 * 60 * 1000, // 8 horas
          path: "/",
        });

        return {
          success: true,
          admin: {
            id: admin.adminId,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        };
      } catch (err) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: err instanceof Error ? err.message : "Falha no login",
        });
      }
    }),

  /**
   * Verificar sessão admin atual
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const adminUser = await authenticateAdminRequest(ctx.req);
    if (!adminUser) return null;
    return {
      id: adminUser.adminId,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    };
  }),

  /**
   * Logout — invalida sessão e remove cookie
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k.trim(), decodeURIComponent(v.join("="))];
      })
    );
    const token = cookies[ADMIN_SESSION_COOKIE];
    if (token) {
      await logoutAdmin(token);
    }
    ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { path: "/" });
    return { success: true };
  }),

  /**
   * Criar primeiro superadmin (apenas quando não existe nenhum)
   */
  createFirstSuperAdmin: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("E-mail inválido"),
      password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      setupKey: z.string(), // Chave de setup para evitar criação não autorizada
    }))
    .mutation(async ({ input }) => {
      // Verificar chave de setup (variável de ambiente)
      const expectedKey = process.env.ADMIN_SETUP_KEY || "setup-grafica-2024";
      if (input.setupKey !== expectedKey) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Chave de setup inválida" });
      }

      try {
        await createFirstSuperAdmin({
          name: input.name,
          email: input.email,
          password: input.password,
        });
        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Erro ao criar superadmin",
        });
      }
    }),

  // ─── Gestão de Administradores ──────────────────────────────────────────────

  /**
   * Listar todos os administradores (superadmin ou admin podem ver)
   */
  listAdmins: adminAuthProcedure.query(async () => {
    const db = (await getDb())!;
    const result = await (db as any).query.adminAccounts.findMany({
      orderBy: (t: any, { desc }: any) => desc(t.createdAt),
    });
    // Nunca retornar passwordHash
    return result.map((a: any) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      status: a.status,
      lastLogin: a.lastLogin,
      createdAt: a.createdAt,
      createdBy: a.createdBy,
    }));
  }),

  /**
   * Criar novo administrador (apenas superadmin)
   */
  createAdmin: superAdminProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
      role: z.enum(["superadmin", "admin", "production"]).default("admin"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const now = Date.now();
      const adminUser = (ctx as any).adminUser;

      // Verificar se email já existe
      const existing = await (db as any).query.adminAccounts.findFirst({
        where: eq(adminAccounts.email, input.email.toLowerCase().trim()),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }

      const passwordHash = await hashPassword(input.password);

      const result = await db.insert(adminAccounts).values({
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: input.role,
        status: "active",
        createdBy: adminUser.adminId,
        createdAt: now,
        updatedAt: now,
      });

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "create_admin",
        entity: "adminAccounts",
        entityId: String((result as any).insertId),
        after: { name: input.name, email: input.email, role: input.role },
      });

      return { success: true };
    }),

  /**
   * Atualizar administrador (apenas superadmin)
   */
  updateAdmin: superAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      role: z.enum(["superadmin", "admin", "production"]).optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const now = Date.now();
      const adminUser = (ctx as any).adminUser;

      // Buscar estado anterior para auditoria
      const before = await (db as any).query.adminAccounts.findFirst({
        where: eq(adminAccounts.id, input.id),
      });
      if (!before) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Administrador não encontrado" });
      }

      const updateData: Record<string, any> = { updatedAt: now };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email.toLowerCase().trim();
      if (input.role !== undefined) updateData.role = input.role;
      if (input.status !== undefined) updateData.status = input.status;

      await db.update(adminAccounts)
        .set(updateData)
        .where(eq(adminAccounts.id, input.id));

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "update_admin",
        entity: "adminAccounts",
        entityId: String(input.id),
        before: { name: before.name, email: before.email, role: before.role, status: before.status },
        after: updateData,
      });

      return { success: true };
    }),

  /**
   * Resetar senha de administrador (apenas superadmin)
   * Retorna a nova senha gerada aleatoriamente
   */
  resetAdminPassword: superAdminProcedure
    .input(z.object({
      id: z.number(),
      newPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const now = Date.now();
      const adminUser = (ctx as any).adminUser;

      const admin = await (db as any).query.adminAccounts.findFirst({
        where: eq(adminAccounts.id, input.id),
      });
      if (!admin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Administrador não encontrado" });
      }

      const passwordHash = await hashPassword(input.newPassword);

      await db.update(adminAccounts)
        .set({ passwordHash, updatedAt: now, loginAttempts: 0, lockedUntil: null })
        .where(eq(adminAccounts.id, input.id));

      // Invalidar todas as sessões ativas do admin
      await db.delete(adminSessions).where(eq(adminSessions.adminId, input.id));

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "reset_password",
        entity: "adminAccounts",
        entityId: String(input.id),
        after: { note: "Senha resetada pelo superadmin" },
      });

      return { success: true };
    }),

  /**
   * Ativar/desativar administrador (apenas superadmin)
   */
  toggleAdminStatus: superAdminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "inactive"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;
      const now = Date.now();
      const adminUser = (ctx as any).adminUser;

      await db.update(adminAccounts)
        .set({ status: input.status, updatedAt: now })
        .where(eq(adminAccounts.id, input.id));

      // Se desativando, invalidar sessões
      if (input.status === "inactive") {
        await db.delete(adminSessions).where(eq(adminSessions.adminId, input.id));
      }

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: input.status === "active" ? "activate_admin" : "deactivate_admin",
        entity: "adminAccounts",
        entityId: String(input.id),
        after: { status: input.status },
      });

      return { success: true };
    }),

  // ─── Auditoria ──────────────────────────────────────────────────────────────

  /**
   * Listar logs de auditoria (apenas superadmin ou admin)
   */
  listAuditLogs: adminAuthProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const result = await (db as any).query.auditLogs.findMany({
        orderBy: (t: any, { desc }: any) => desc(t.createdAt),
        limit: input.limit,
        offset: input.offset,
      });
      return result;
    }),

  /**
   * Verificar se existe algum superadmin cadastrado
   */
  hasSuperAdmin: publicProcedure.query(async () => {
    const db = (await getDb())!;
    const existing = await (db as any).query.adminAccounts.findFirst({
      where: eq(adminAccounts.role, "superadmin"),
    });
    return { exists: !!existing };
  }),
});
