/**
 * Script de diagnóstico v2: testa PIX com e-mail de cliente real
 * O erro 2034 "Invalid users involved" ocorre quando:
 * - payer.email == e-mail da conta vendedora
 * - payer.email é um e-mail de teste em modo produção
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Primeiro: verificar qual é o e-mail da conta vendedora
console.log("🔍 Verificando conta do vendedor...\n");
const meResponse = await fetch("https://api.mercadopago.com/users/me", {
  headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
});
const meData = await meResponse.json();
console.log("👤 Conta vendedora:");
console.log("   ID:", meData.id);
console.log("   Email:", meData.email);
console.log("   Site:", meData.site_id);
console.log("   Status:", meData.status?.site_status);
console.log("");

// Testar com um e-mail diferente da conta vendedora
const testEmail = "cliente.teste@gmail.com"; // e-mail diferente da conta
console.log(`📡 Testando PIX com payer.email = "${testEmail}"...\n`);

const payload = {
  transaction_amount: 1.00,
  description: "Teste PIX - Grafica Maria Imprime",
  payment_method_id: "pix",
  payer: {
    email: testEmail,
    first_name: "Cliente",
    last_name: "Teste",
    identification: {
      type: "CPF",
      number: "12345678909"
    }
  },
  external_reference: "TEST_002"
};

const response = await fetch("https://api.mercadopago.com/v1/payments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ACCESS_TOKEN}`,
    "X-Idempotency-Key": `test-pix2-${Date.now()}`
  },
  body: JSON.stringify(payload)
});

const data = await response.json();
console.log("📊 Status HTTP:", response.status);

if (response.ok && data.id) {
  console.log("✅ PIX criado com sucesso!");
  console.log("   ID:", data.id);
  console.log("   Status:", data.status);
  const qr = data.point_of_interaction?.transaction_data?.qr_code;
  if (qr) console.log("   QR Code OK ✓");
} else {
  console.log("❌ Falha:", data.message);
  if (data.cause) {
    data.cause.forEach(c => console.log(`   [${c.code}] ${c.description}`));
  }
}
