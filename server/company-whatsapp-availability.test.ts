import { describe, expect, it } from "vitest";
import { getCompanyWhatsAppMessage, getWhatsAppUrl, isWhatsAppBusinessOpen } from "../client/src/hooks/useCompanySettings";

const allDaysBusinessHours = {
  showWhatsappButton: true,
  whatsappDefaultMessage: "Olá, preciso de atendimento.",
  useWhatsappBusinessHours: true,
  whatsappBusinessDays: "[0,1,2,3,4,5,6]",
  whatsappStartTime: "09:00",
  whatsappEndTime: "17:00",
};

describe("disponibilidade pública do WhatsApp", () => {
  it("monta o link com a mensagem padrão configurada", () => {
    const message = getCompanyWhatsAppMessage(allDaysBusinessHours);
    expect(getWhatsAppUrl("5522999459596", message)).toContain("Ol%C3%A1%2C%20preciso%20de%20atendimento.");
  });

  it("oculta o botão quando a chave global está desligada", () => {
    expect(isWhatsAppBusinessOpen({ ...allDaysBusinessHours, showWhatsappButton: false }, new Date("2024-01-02T12:00:00Z"))).toBe(false);
  });

  it("respeita o início e o fim do expediente em America/Sao_Paulo", () => {
    expect(isWhatsAppBusinessOpen(allDaysBusinessHours, new Date("2024-01-02T12:00:00Z"))).toBe(true);
    expect(isWhatsAppBusinessOpen(allDaysBusinessHours, new Date("2024-01-02T11:00:00Z"))).toBe(false);
    expect(isWhatsAppBusinessOpen(allDaysBusinessHours, new Date("2024-01-02T20:00:00Z"))).toBe(false);
  });
});
