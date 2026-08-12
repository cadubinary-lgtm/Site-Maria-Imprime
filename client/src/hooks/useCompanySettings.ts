import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export const COMPANY_SETTINGS_FALLBACK = {
  legalName: "Carlos Eduardo Barreto Novaes Pinheiro - ME",
  tradeName: "Maria Imprime / Gráfica Ponto Digital",
  cnpj: "34.528.399/0001-08",
  stateRegistration: "",
  commercialPhone: "(22) 99945-9596",
  whatsappNumber: "5522999459596",
  showWhatsappButton: true,
  whatsappDefaultMessage: "Olá! Como podemos ajudar?",
  useWhatsappBusinessHours: false,
  whatsappBusinessDays: "[1,2,3,4,5]",
  whatsappStartTime: "09:00",
  whatsappEndTime: "17:00",
  supportEmail: "contatomariaimprime@gmail.com",
  zipCode: "28908-200",
  street: "Avenida Antonio Ferreira dos Santos",
  addressNumber: "651",
  neighborhood: "Braga",
  city: "Cabo Frio",
  state: "RJ",
  printLogoUrl: "/manus-storage/logo-maria-imprime_acc5585b.webp",
  printLogoKey: "logo-maria-imprime_acc5585b.webp",
  nextOsNumber: 1001,
  osTerms: "Confira todas as informações antes de iniciar a produção. Prazos começam a contar após aprovação da arte. Alterações solicitadas após o início da produção podem gerar custos adicionais. Em caso de dúvidas, entre em contato com nosso atendimento.",
};

export function useCompanySettings() {
  const query = trpc.companySettings.getPublic.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    ...query,
    company: query.data ?? COMPANY_SETTINGS_FALLBACK,
  };
}

export function getWhatsAppUrl(whatsappNumber: string | null | undefined, message?: string) {
  const number = (whatsappNumber || COMPANY_SETTINGS_FALLBACK.whatsappNumber).replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

type WhatsAppAvailabilitySettings = {
  showWhatsappButton?: boolean | null;
  whatsappDefaultMessage?: string | null;
  useWhatsappBusinessHours?: boolean | null;
  whatsappBusinessDays?: string | null;
  whatsappStartTime?: string | null;
  whatsappEndTime?: string | null;
};

export function getCompanyWhatsAppMessage(company: WhatsAppAvailabilitySettings) {
  return company.whatsappDefaultMessage?.trim() || COMPANY_SETTINGS_FALLBACK.whatsappDefaultMessage;
}

export function parseWhatsAppBusinessDays(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed)) return parsed.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  } catch (_) {}
  return [1, 2, 3, 4, 5];
}

function timeToMinutes(value: string | null | undefined, fallback: string) {
  const [hour, minute] = (value || fallback).split(":").map(Number);
  return hour * 60 + minute;
}

export function isWhatsAppBusinessOpen(company: WhatsAppAvailabilitySettings, now = new Date()) {
  if (!company.showWhatsappButton) return false;
  if (!company.useWhatsappBusinessHours) return true;

  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(now);
  const dayIndex = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[weekday];
  const allowedDays = parseWhatsAppBusinessDays(company.whatsappBusinessDays);
  if (!allowedDays.includes(dayIndex)) return false;

  const timeParts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(timeParts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(timeParts.find((part) => part.type === "minute")?.value || 0);
  const currentMinutes = hour * 60 + minute;
  const start = timeToMinutes(company.whatsappStartTime, COMPANY_SETTINGS_FALLBACK.whatsappStartTime);
  const end = timeToMinutes(company.whatsappEndTime, COMPANY_SETTINGS_FALLBACK.whatsappEndTime);
  return currentMinutes >= start && currentMinutes < end;
}

export function useWhatsAppButtonVisibility(company: WhatsAppAvailabilitySettings) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return isWhatsAppBusinessOpen(company, now);
}

export function getCompanyAddressLine(company: Pick<typeof COMPANY_SETTINGS_FALLBACK, "street" | "addressNumber">) {
  return `${company.street}, ${company.addressNumber}`;
}

export function getCompanyLocationLine(company: Pick<typeof COMPANY_SETTINGS_FALLBACK, "neighborhood" | "city" | "state">) {
  return `${company.neighborhood} - ${company.city} - ${company.state}`;
}
