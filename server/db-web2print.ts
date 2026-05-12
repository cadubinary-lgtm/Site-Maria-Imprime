import { getDb } from "./db";
import { fileValidations } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Criar validação de arquivo
 */
export async function createFileValidation(data: {
  orderId: number;
  fileName: string;
  fileSize: number;
  dpi?: number;
  colorMode?: string;
  hasBleed?: boolean;
  hasSafeMargin?: boolean;
  status: "enviado" | "em_analise" | "aprovado" | "correcao_solicitada" | "rejeitado";
  issues?: string;
  validatedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(fileValidations).values({
    orderId: data.orderId,
    fileName: data.fileName,
    fileSize: data.fileSize,
    dpi: data.dpi,
    colorMode: data.colorMode,
    hasBleed: data.hasBleed,
    hasSafeMargin: data.hasSafeMargin,
    status: data.status,
    issues: data.issues,
    validatedBy: data.validatedBy,
  });
}

/**
 * Obter validação de arquivo por ID
 */
export async function getFileValidationById(validationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(fileValidations)
    .where(eq(fileValidations.id, validationId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Obter validações de um pedido
 */
export async function getOrderFileValidations(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(fileValidations)
    .where(eq(fileValidations.orderId, orderId))
    .orderBy(desc(fileValidations.createdAt));
}

/**
 * Atualizar status de validação
 */
export async function updateFileValidationStatus(
  validationId: number,
  status: "enviado" | "em_analise" | "aprovado" | "correcao_solicitada" | "rejeitado",
  issues?: string,
  validatedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(fileValidations)
    .set({
      status,
      issues,
      validatedBy,
      validatedAt: new Date(),
    })
    .where(eq(fileValidations.id, validationId));
}

/**
 * Validar DPI do arquivo
 */
export function validateDPI(dpi: number, minDPI: number = 300): { valid: boolean; message?: string } {
  if (dpi < minDPI) {
    return {
      valid: false,
      message: `DPI insuficiente: ${dpi}. Mínimo recomendado: ${minDPI} DPI`,
    };
  }
  return { valid: true };
}

/**
 * Validar modo de cor
 */
export function validateColorMode(
  colorMode: string,
  requiredMode: string = "CMYK"
): { valid: boolean; message?: string } {
  if (colorMode !== requiredMode) {
    return {
      valid: false,
      message: `Modo de cor incorreto: ${colorMode}. Requerido: ${requiredMode}`,
    };
  }
  return { valid: true };
}

/**
 * Validar sangria
 */
export function validateBleed(hasBleed: boolean): { valid: boolean; message?: string } {
  if (!hasBleed) {
    return {
      valid: false,
      message: `Arquivo sem sangria. Mínimo requerido: 3mm`,
    };
  }
  return { valid: true };
}

/**
 * Validar margem de segurança
 */
export function validateSafetyMargin(hasSafeMargin: boolean): { valid: boolean; message?: string } {
  if (!hasSafeMargin) {
    return {
      valid: false,
      message: `Arquivo sem margem de segurança. Mínimo requerido: 5mm`,
    };
  }
  return { valid: true };
}

/**
 * Listar validações pendentes
 */
export async function getPendingFileValidations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(fileValidations)
    .where(eq(fileValidations.status, "em_analise"))
    .orderBy(desc(fileValidations.createdAt));
}

/**
 * Listar validações rejeitadas
 */
export async function getRejectedFileValidations(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(fileValidations)
    .where(eq(fileValidations.status, "rejeitado"))
    .orderBy(desc(fileValidations.createdAt))
    .limit(limit);
}

/**
 * Listar validações aprovadas
 */
export async function getApprovedFileValidations(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(fileValidations)
    .where(eq(fileValidations.status, "aprovado"))
    .orderBy(desc(fileValidations.createdAt))
    .limit(limit);
}

/**
 * Contar validações por status
 */
export async function countFileValidationsByStatus() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const statuses = ["enviado", "em_analise", "aprovado", "correcao_solicitada", "rejeitado"] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const result = await db
      .select()
      .from(fileValidations)
      .where(eq(fileValidations.status, status));
    counts[status] = result.length;
  }

  return counts;
}
