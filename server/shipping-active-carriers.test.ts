/**
 * Testes para filtro de transportadoras ativas
 * Valida que apenas transportadoras com isActive=true são retornadas
 * no cálculo de frete do Melhor Envio
 */

import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos e interfaces para os testes
// ─────────────────────────────────────────────────────────────────────────────

interface Carrier {
  id: number;
  companyId: number;
  name: string;
  code: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MeQuote {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string | null;
  };
  price: string;
  custom_price?: string;
  delivery_time: number;
  custom_delivery_time?: number;
  error?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Função auxiliar: filtro de transportadoras ativas
// ─────────────────────────────────────────────────────────────────────────────

function filterActiveCarriers(
  quotes: MeQuote[],
  activeCarriers: Carrier[]
): MeQuote[] {
  // Criar mapa de companyId -> isActive (apenas transportadoras ativas)
  const activeCarrierMap = new Map(
    activeCarriers
      .filter((c) => c.isActive) // Filtrar apenas ativas
      .map((c) => [c.companyId, true])
  );

  // Filtrar apenas quotes de transportadoras ativas
  return quotes.filter(
    (q) => !q.error && activeCarrierMap.has(q.company.id)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe("Filtro de Transportadoras Ativas", () => {
  it("deve retornar apenas transportadoras ativas", () => {
    // Dados: 3 transportadoras (2 ativas, 1 inativa)
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        companyId: 40045,
        name: "Jadlog",
        code: "jadlog",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Sedex está INATIVA, não deve aparecer no resultado
      {
        id: 3,
        companyId: 40096,
        name: "Sedex",
        code: "sedex",
        logoUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Dados: 3 cotações do Melhor Envio (Correios, Jadlog, Sedex)
    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
      },
      {
        id: 2,
        name: "Jadlog Cargo",
        company: {
          id: 40045,
          name: "Jadlog",
          picture: null,
        },
        price: "18.90",
        delivery_time: 3,
      },
      {
        id: 3,
        name: "Sedex",
        company: {
          id: 40096,
          name: "Sedex",
          picture: null,
        },
        price: "35.00",
        delivery_time: 2,
      },
    ];

    // Aplicar filtro
    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    // Validações
    expect(filtered).toHaveLength(2);
    expect(filtered[0].company.id).toBe(40010); // Correios (ativa)
    expect(filtered[1].company.id).toBe(40045); // Jadlog (ativa)
    expect(filtered.some((q) => q.company.id === 40096)).toBe(false); // Sedex (inativa) removida
  });

  it("deve retornar lista vazia quando nenhuma transportadora está ativa", () => {
    // Dados: todas as transportadoras inativas
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        companyId: 40045,
        name: "Jadlog",
        code: "jadlog",
        logoUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
      },
      {
        id: 2,
        name: "Jadlog Cargo",
        company: {
          id: 40045,
          name: "Jadlog",
          picture: null,
        },
        price: "18.90",
        delivery_time: 3,
      },
    ];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    expect(filtered).toHaveLength(0);
  });

  it("deve retornar todas as cotações quando todas as transportadoras estão ativas", () => {
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        companyId: 40045,
        name: "Jadlog",
        code: "jadlog",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
      },
      {
        id: 2,
        name: "Jadlog Cargo",
        company: {
          id: 40045,
          name: "Jadlog",
          picture: null,
        },
        price: "18.90",
        delivery_time: 3,
      },
    ];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    expect(filtered).toHaveLength(2);
  });

  it("deve ignorar cotações com erro mesmo que transportadora esteja ativa", () => {
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
        error: true, // Cotação com erro
      },
    ];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    expect(filtered).toHaveLength(0);
  });

  it("deve manter ordem das cotações após filtro", () => {
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        companyId: 40045,
        name: "Jadlog",
        code: "jadlog",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        companyId: 40096,
        name: "Sedex",
        code: "sedex",
        logoUrl: null,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
      },
      {
        id: 2,
        name: "Sedex",
        company: {
          id: 40096,
          name: "Sedex",
          picture: null,
        },
        price: "35.00",
        delivery_time: 2,
      },
      {
        id: 3,
        name: "Jadlog Cargo",
        company: {
          id: 40045,
          name: "Jadlog",
          picture: null,
        },
        price: "18.90",
        delivery_time: 3,
      },
    ];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    // Deve manter a ordem: Correios (índice 0), Jadlog (índice 2)
    expect(filtered).toHaveLength(2);
    expect(filtered[0].company.id).toBe(40010); // Correios mantém posição 0
    expect(filtered[1].company.id).toBe(40045); // Jadlog mantém posição relativa
  });

  it("deve funcionar com lista vazia de cotações", () => {
    const activeCarriers: Carrier[] = [
      {
        id: 1,
        companyId: 40010,
        name: "Correios",
        code: "correios",
        logoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const meQuotes: MeQuote[] = [];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    expect(filtered).toHaveLength(0);
  });

  it("deve funcionar com lista vazia de transportadoras", () => {
    const activeCarriers: Carrier[] = [];

    const meQuotes: MeQuote[] = [
      {
        id: 1,
        name: "PAC",
        company: {
          id: 40010,
          name: "Correios",
          picture: null,
        },
        price: "25.50",
        delivery_time: 5,
      },
    ];

    const filtered = filterActiveCarriers(meQuotes, activeCarriers);

    // Nenhuma transportadora ativa, nenhuma cotação deve passar
    expect(filtered).toHaveLength(0);
  });
});
