import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  });
} catch { /* .env may not exist */ }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database");

  try {
    // Step 1: Expand enum to include BOTH old and new values
    await conn.execute(`
      ALTER TABLE \`orders\` MODIFY COLUMN \`status\` 
      ENUM('aguardando','em_producao','enviado','entregue','pedido_recebido','aguardando_pagamento','impressao','acabamento','pronto','cancelado') 
      NOT NULL DEFAULT 'pedido_recebido'
    `);
    console.log("✅ Step 1: Expanded orders.status enum");

    // Step 2: Migrate old values to new ones
    await conn.execute(`UPDATE \`orders\` SET status = 'pedido_recebido' WHERE status = 'aguardando'`);
    console.log("✅ Step 2: Migrated 'aguardando' → 'pedido_recebido'");

    // Step 3: Now set final enum with only new values
    await conn.execute(`
      ALTER TABLE \`orders\` MODIFY COLUMN \`status\` 
      ENUM('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado') 
      NOT NULL DEFAULT 'pedido_recebido'
    `);
    console.log("✅ Step 3: Finalized orders.status enum");

    // Step 4: Update orderStatusHistory previousStatus
    await conn.execute(`
      ALTER TABLE \`orderStatusHistory\` MODIFY COLUMN \`previousStatus\` 
      ENUM('aguardando','em_producao','enviado','entregue','pedido_recebido','aguardando_pagamento','impressao','acabamento','pronto','cancelado')
    `);
    await conn.execute(`UPDATE \`orderStatusHistory\` SET previousStatus = 'pedido_recebido' WHERE previousStatus = 'aguardando'`);
    await conn.execute(`
      ALTER TABLE \`orderStatusHistory\` MODIFY COLUMN \`previousStatus\` 
      ENUM('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado')
    `);
    console.log("✅ Step 4: Updated orderStatusHistory.previousStatus enum");

    // Step 5: Update orderStatusHistory newStatus
    await conn.execute(`
      ALTER TABLE \`orderStatusHistory\` MODIFY COLUMN \`newStatus\` 
      ENUM('aguardando','em_producao','enviado','entregue','pedido_recebido','aguardando_pagamento','impressao','acabamento','pronto','cancelado') 
      NOT NULL
    `);
    await conn.execute(`UPDATE \`orderStatusHistory\` SET newStatus = 'pedido_recebido' WHERE newStatus = 'aguardando'`);
    await conn.execute(`
      ALTER TABLE \`orderStatusHistory\` MODIFY COLUMN \`newStatus\` 
      ENUM('pedido_recebido','aguardando_pagamento','em_producao','impressao','acabamento','pronto','enviado','entregue','cancelado') 
      NOT NULL
    `);
    console.log("✅ Step 5: Updated orderStatusHistory.newStatus enum");

    console.log("\n✅ Migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
    process.exit(0);
  }
}

run();
