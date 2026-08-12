import { z } from "zod";
import { eq } from "drizzle-orm";
import { companySettings } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const companySettingsInput = z.object({
  legalName: z.string().min(1).max(255),
  tradeName: z.string().min(1).max(255),
  cnpj: z.string().min(1).max(20),
  stateRegistration: z.string().max(50).optional().nullable(),
  commercialPhone: z.string().min(1).max(20),
  whatsappNumber: z.string().min(1).max(20),
  supportEmail: z.string().email().max(255),
  zipCode: z.string().min(1).max(10),
  street: z.string().min(1).max(255),
  addressNumber: z.string().min(1).max(20),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  printLogoUrl: z.string().max(2000).optional().nullable(),
  printLogoKey: z.string().max(255).optional().nullable(),
  nextOsNumber: z.number().int().min(1).max(999999999),
  osTerms: z.string().max(10000).optional().nullable(),
});

const allowedTermsTags = new Set(["b", "strong", "i", "em", "ul", "ol", "li", "br", "p", "div"]);

function sanitizeOsTerms(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, rawName: string) => {
    const name = rawName.toLowerCase();
    if (!allowedTermsTags.has(name)) return "";
    return tag.startsWith("</") ? `</${name}>` : `<${name}>`;
  }).trim() || null;
}

/**
 * Módulo isolado para os dados institucionais da empresa.
 * Mantém uma única configuração no registro id=1 e não toca dados de produtos ou pedidos.
 */
export const companySettingsRouter = router({
  getPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, 1))
      .limit(1);

    return settings ?? null;
  }),

  getAdmin: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, 1))
      .limit(1);

    return settings ?? null;
  }),

  save: adminProcedure.input(companySettingsInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const values = {
      legalName: input.legalName.trim(),
      tradeName: input.tradeName.trim(),
      cnpj: input.cnpj.trim(),
      stateRegistration: input.stateRegistration?.trim() || null,
      commercialPhone: input.commercialPhone.trim(),
      whatsappNumber: input.whatsappNumber.replace(/\D/g, ""),
      supportEmail: input.supportEmail.trim(),
      zipCode: input.zipCode.trim(),
      street: input.street.trim(),
      addressNumber: input.addressNumber.trim(),
      neighborhood: input.neighborhood.trim(),
      city: input.city.trim(),
      state: input.state.trim().toUpperCase(),
      printLogoUrl: input.printLogoUrl || null,
      printLogoKey: input.printLogoKey || null,
      nextOsNumber: input.nextOsNumber,
      osTerms: sanitizeOsTerms(input.osTerms),
    };

    const [existing] = await db
      .select({ id: companySettings.id })
      .from(companySettings)
      .where(eq(companySettings.id, 1))
      .limit(1);

    if (existing) {
      await db.update(companySettings).set(values).where(eq(companySettings.id, 1));
    } else {
      await db.insert(companySettings).values({ id: 1, ...values });
    }

    return { success: true } as const;
  }),
});
