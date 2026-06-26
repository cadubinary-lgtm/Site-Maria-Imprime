/**
 * Script de diagnóstico: testa a criação de PIX diretamente na API do MP
 * Executa: node scripts/test-pix.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não encontrado no .env");
  process.exit(1);
}

console.log("🔑 Token encontrado:", ACCESS_TOKEN.substring(0, 20) + "...");
console.log("📡 Testando criação de PIX de R$ 1,00...\n");

// Payload mínimo exigido pelo MP para PIX
const payload = {
  transaction_amount: 1.00,
  description: "Teste PIX - Grafica Maria Imprime",
  payment_method_id: "pix",
  payer: {
    email: "test_user_123456@testuser.com",
    first_name: "Test",
    last_name: "User",
    identification: {
      type: "CPF",
      number: "12345678909"
    }
  },
  external_reference: "TEST_001"
};

console.log("📦 Payload enviado:");
console.log(JSON.stringify(payload, null, 2));
console.log("\n");

try {
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "X-Idempotency-Key": `test-pix-${Date.now()}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  console.log("📊 Status HTTP:", response.status);
  console.log("📨 Resposta completa da API:");
  console.log(JSON.stringify(data, null, 2));

  if (response.ok && data.id) {
    console.log("\n✅ PIX criado com sucesso!");
    console.log("   ID:", data.id);
    console.log("   Status:", data.status);
    const qr = data.point_of_interaction?.transaction_data?.qr_code;
    if (qr) {
      console.log("   QR Code (primeiros 50 chars):", qr.substring(0, 50) + "...");
    }
  } else {
    console.log("\n❌ Falha ao criar PIX");
    console.log("   Erro:", data.message || data.error);
    if (data.cause) {
      console.log("   Causas:");
      (Array.isArray(data.cause) ? data.cause : [data.cause]).forEach(c => {
        console.log(`     - [${c.code}] ${c.description}`);
      });
    }
  }
} catch (err) {
  console.error("❌ Erro de rede:", err.message);
}
