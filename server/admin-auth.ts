/**
 * Admin Auth Service
 * Autenticação própria para administradores do sistema.
 * Independente do Manus OAuth — login via email + senha.
 * Usa bcryptjs para hash de senhas e jose para JWT.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "./db";
import { adminAccounts, adminSessions, auditLogs } from "../drizzle/schema";
import type { Request } from "express";

// Cookie name para sessão admin
export const ADMIN_SESSION_COOKIE = "admin_session";

// Duração da sessão: 8 horas
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

// Máximo de tentativas de login antes de bloquear
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export type AdminSessionPayload = {
  adminId: number;
  email: string;
  role: "superadmin" | "admin" | "production" | "seller";
  name: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "fallback-secret-change-in-production";
  return new TextEncoder().encode(secret + "_admin_auth");
}

/**
 * Hash de senha com bcrypt (salt rounds = 12)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gerar token JWT para sessão admin
 */
export async function generateAdminToken(payload: AdminSessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

/**
 * Verificar e decodificar token JWT admin
 */
export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Login de administrador — retorna token JWT ou lança erro
 */
export async function loginAdmin(params: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ token: string; admin: AdminSessionPayload }> {
  const db = (await getDb())!;
  const now = Date.now();

  // Buscar admin pelo email
  const admin = await (db as any).query.adminAccounts.findFirst({
    where: eq(adminAccounts.email, params.email.toLowerCase().trim()),
  });

  if (!admin) {
    throw new Error("Credenciais inválidas");
  }

  // Verificar se está bloqueado
  if (admin.lockedUntil && now < admin.lockedUntil) {
    const minutesLeft = Math.ceil((admin.lockedUntil - now) / 60000);
    throw new Error(`Conta bloqueada. Tente novamente em ${minutesLeft} minuto(s).`);
  }

  // Verificar se está ativo
  if (admin.status !== "active") {
    throw new Error("Conta desativada. Entre em contato com o administrador.");
  }

  // Verificar senha
  const passwordValid = await verifyPassword(params.password, admin.passwordHash);

  if (!passwordValid) {
    // Incrementar tentativas de login
    const newAttempts = (admin.loginAttempts || 0) + 1;
    const updateData: Record<string, any> = { loginAttempts: newAttempts };

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = now + LOCK_DURATION_MS;
      updateData.loginAttempts = 0;
    }

    await db.update(adminAccounts)
      .set(updateData)
      .where(eq(adminAccounts.id, admin.id));

    throw new Error("Credenciais inválidas");
  }

  // Reset tentativas e atualizar lastLogin
  await db.update(adminAccounts)
    .set({
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: now,
      updatedAt: now,
    })
    .where(eq(adminAccounts.id, admin.id));

  // Gerar token JWT
  const sessionPayload: AdminSessionPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    name: admin.name,
  };
  const token = await generateAdminToken(sessionPayload);

  // Salvar sessão no banco
  await db.insert(adminSessions).values({
    adminId: admin.id,
    token,
    expiresAt: now + SESSION_TTL_MS,
    createdAt: now,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  // Registrar auditoria
  await logAudit({
    adminId: admin.id,
    adminName: admin.name,
    action: "admin_login",
    entity: "adminAccounts",
    entityId: String(admin.id),
    ipAddress: params.ipAddress,
  });

  return { token, admin: sessionPayload };
}

/**
 * Autenticar request — extrai token do cookie e valida sessão
 */
export async function authenticateAdminRequest(req: Request): Promise<AdminSessionPayload | null> {
  try {
    // Extrair token do cookie
    const cookieHeader = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map(c => {
        const [k, ...v] = c.trim().split("=");
        return [k.trim(), decodeURIComponent(v.join("="))];
      })
    );
    const token = cookies[ADMIN_SESSION_COOKIE];
    if (!token) return null;

    // Verificar JWT
    const payload = await verifyAdminToken(token);
    if (!payload) return null;

    // Verificar se sessão ainda existe no banco e não expirou
    const db = (await getDb())!;
    const now = Date.now();
    const session = await (db as any).query.adminSessions.findFirst({
      where: and(
        eq(adminSessions.token, token),
        gt(adminSessions.expiresAt, now)
      ),
    });

    if (!session) return null;

    // Verificar se admin ainda está ativo
    const admin = await (db as any).query.adminAccounts.findFirst({
      where: and(
        eq(adminAccounts.id, payload.adminId),
        eq(adminAccounts.status, "active")
      ),
    });

    if (!admin) return null;

    return {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };
  } catch {
    return null;
  }
}

/**
 * Logout — invalida sessão no banco
 */
export async function logoutAdmin(token: string): Promise<void> {
  const db = (await getDb())!;
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
}

/**
 * Registrar entrada de auditoria
 */
export async function logAudit(params: {
  adminId?: number;
  adminName?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
}): Promise<void> {
  try {
    const db = (await getDb())!;
    await db.insert(auditLogs).values({
      adminId: params.adminId ?? null,
      adminName: params.adminName ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      before: params.before ? JSON.stringify(params.before) : null,
      after: params.after ? JSON.stringify(params.after) : null,
      ipAddress: params.ipAddress ?? null,
      createdAt: Date.now(),
    });
  } catch (err) {
    // Nunca deixar falha de auditoria derrubar a operação principal
    console.error("[AuditLog] Falha ao registrar:", err);
  }
}

/**
 * Criar primeiro superadmin (usado apenas quando não existe nenhum admin)
 */
export async function createFirstSuperAdmin(params: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const db = (await getDb())!;
  const now = Date.now();

  // Verificar se já existe algum superadmin
  const existing = await (db as any).query.adminAccounts.findFirst({
    where: eq(adminAccounts.role, "superadmin"),
  });

  if (existing) {
    throw new Error("Já existe um superadmin cadastrado.");
  }

  const passwordHash = await hashPassword(params.password);

  await db.insert(adminAccounts).values({
    name: params.name,
    email: params.email.toLowerCase().trim(),
    passwordHash,
    role: "superadmin",
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
}
