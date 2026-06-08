/**
 * Integração com API dos Correios
 * Autenticação, token management e cálculo de frete
 */

import { getDb } from "./db";

interface CorreiosAuthResponse {
  token: string;
  expiresIn: number;
}

interface CorreiosShippingResponse {
  servicos: Array<{
    codigo: string;
    nome: string;
    valor: string;
    prazoEntrega: number;
  }>;
}

/**
 * Autenticar com API dos Correios usando Basic Auth
 * Armazena token com data de expiração
 */
export async function authenticateCorreios(
  user: string,
  password: string,
  postalCard: string
): Promise<string> {
  try {
    // Preparar Basic Auth
    const credentials = Buffer.from(`${user}:${password}`).toString("base64");

    // Fazer requisição de autenticação
    const response = await fetch("https://correios.com.br/api/auth", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cartaoPostagem: postalCard,
      }),
    });

    if (!response.ok) {
      throw new Error(`Autenticação falhou: ${response.statusText}`);
    }

    const data = (await response.json()) as CorreiosAuthResponse;

    // Calcular data de expiração (24 horas)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

    // Salvar token no banco de dados
    const db = await getDb();
    await (db as any).query(
      `UPDATE storeSettings SET correiosToken = ?, correiosTokenExpiry = ? WHERE id = 1`,
      [data.token, expiryDate]
    );

    return data.token;
  } catch (error) {
    console.error("Erro ao autenticar com Correios:", error);
    throw error;
  }
}

/**
 * Obter token válido, renovando se necessário
 */
export async function getValidCorreiosToken(
  user: string,
  password: string,
  postalCard: string
): Promise<string> {
  try {
    const db = await getDb();

    // Buscar token armazenado
    const result = await (db as any).query(
      `SELECT correiosToken, correiosTokenExpiry FROM storeSettings WHERE id = 1`
    );

    if (result && result.length > 0) {
      const { correiosToken, correiosTokenExpiry } = result[0];

      // Verificar se token ainda é válido (com 1 hora de margem)
      if (correiosToken && correiosTokenExpiry) {
        const expiryTime = new Date(correiosTokenExpiry).getTime();
        const nowTime = new Date().getTime();
        const marginTime = 60 * 60 * 1000; // 1 hora

        if (expiryTime - nowTime > marginTime) {
          return correiosToken;
        }
      }
    }

    // Token expirado ou não existe, renovar
    return await authenticateCorreios(user, password, postalCard);
  } catch (error) {
    console.error("Erro ao obter token válido:", error);
    throw error;
  }
}

/**
 * Calcular frete com a API dos Correios
 * Usa caixa unificada para múltiplos produtos
 */
export async function calculateShippingCorreios(
  originCEP: string,
  destinationCEP: string,
  weight: number, // kg
  height: number, // cm
  width: number, // cm
  length: number, // cm
  token: string
): Promise<CorreiosShippingResponse> {
  try {
    // Validar travas de segurança
    const minHeight = 1;
    const minWidth = 10;
    const minLength = 15;
    const maxSum = 200;

    // Aplicar mínimos
    let finalHeight = Math.max(height, minHeight);
    let finalWidth = Math.max(width, minWidth);
    let finalLength = Math.max(length, minLength);

    // Validar soma máxima
    if (finalHeight + finalWidth + finalLength > maxSum) {
      // Reduzir proporcionalmente
      const sum = finalHeight + finalWidth + finalLength;
      const ratio = maxSum / sum;
      finalHeight = Math.round(finalHeight * ratio);
      finalWidth = Math.round(finalWidth * ratio);
      finalLength = Math.round(finalLength * ratio);
    }

    // Fazer requisição de cálculo
    const response = await fetch("https://correios.com.br/api/preco", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cepOrigem: originCEP,
        cepDestino: destinationCEP,
        peso: weight,
        altura: finalHeight,
        largura: finalWidth,
        comprimento: finalLength,
        // Solicitar PAC e SEDEX
        servicos: ["04162", "40010"], // Códigos dos Correios
      }),
    });

    if (!response.ok) {
      throw new Error(`Cálculo de frete falhou: ${response.statusText}`);
    }

    const data = (await response.json()) as CorreiosShippingResponse;
    return data;
  } catch (error) {
    console.error("Erro ao calcular frete com Correios:", error);
    throw error;
  }
}

/**
 * Unificar múltiplos produtos em uma caixa única
 * Calcula peso total e volume total
 */
export function unifyShippingBox(
  products: Array<{
    weight: number; // kg
    height: number; // cm
    width: number; // cm
    length: number; // cm
    quantity: number;
  }>
): {
  totalWeight: number;
  totalVolume: number;
  unifiedHeight: number;
  unifiedWidth: number;
  unifiedLength: number;
} {
  // Calcular peso total
  const totalWeight = products.reduce(
    (sum, p) => sum + p.weight * p.quantity,
    0
  );

  // Calcular volume total
  const totalVolume = products.reduce(
    (sum, p) => sum + p.height * p.width * p.length * p.quantity,
    0
  );

  // Calcular dimensões da caixa única usando raiz cúbica
  const cubedDimension = Math.cbrt(totalVolume);

  // Usar dimensões proporcionais (aproximadamente cúbica)
  // Para simplificar, usar a raiz cúbica para altura, largura e comprimento
  const unifiedHeight = Math.round(cubedDimension);
  const unifiedWidth = Math.round(cubedDimension);
  const unifiedLength = Math.round(cubedDimension);

  return {
    totalWeight,
    totalVolume,
    unifiedHeight,
    unifiedWidth,
    unifiedLength,
  };
}
