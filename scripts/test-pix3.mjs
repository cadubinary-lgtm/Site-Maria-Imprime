/**
 * Script de diagnóstico v3: simula o fluxo real
 * - Caso 1: cliente usa o e-mail da conta vendedora → deve ser filtrado para "cliente@mariaimprime.com.br"
 * - Caso 2: cliente usa e-mail próprio → deve funcionar normalmente
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const SELLER_EMAIL = "grafica.digitalonline@gmail.com";

function ensurePayerEmailDiffersFromSeller(payerEmail) {
  const normalized = (payerEmail || "").toLowerCase().trim();
  if (normalized === SELLER_EMAIL || normalized === "") {
    return "cliente@mariaimprime.com.br";
  }
  return normalized;
}

async function testPix(label, payerEmailRaw) {
  const payerEmail = ensurePayerEmailDiffersFromSeller(payerEmailRaw);
  console.log(`\n🧪 ${label}`);
  console.log(`   Input email: "${payerEmailRaw}" → Sanitizado: "${payerEmail}"`);

  const payload = {
    transaction_amount: 1.00,
    description: "Teste PIX - Grafica Maria Imprime",
    payment_method_id: "pix",
    payer: {
      email: payerEmail,
      first_name: "Cliente",
      last_name: "Teste",
      identification: { type: "CPF", number: "12345678909" }
    },
    external_reference: `TEST_${Date.now()}`
  };

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "X-Idempotency-Key": `test-pix3-${Date.now()}-${Math.random()}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok && data.id) {
    const qr = data.point_of_interaction?.transaction_data?.qr_code;
    console.log(`   ✅ PIX criado! ID: ${data.id} | Status: ${data.status} | QR: ${qr ? "OK" : "AUSENTE"}`);
  } else {
    console.log(`   ❌ Falha: ${data.message}`);
    if (data.cause) data.cause.forEach(c => console.log(`      [${c.code}] ${c.description}`));
  }
}

// Caso 1: cliente logado com e-mail da gráfica (o problema original)
await testPix("CASO 1: cliente usa e-mail da conta vendedora", SELLER_EMAIL);

// Caso 2: cliente com e-mail próprio
await testPix("CASO 2: cliente com e-mail próprio", "meu.cliente@gmail.com");

// Caso 3: cliente sem e-mail (guest)
await testPix("CASO 3: cliente sem e-mail (string vazia)", "");

console.log("\n✅ Teste concluído!");
