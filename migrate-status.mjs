import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // 1. Primeiro converter os status antigos para os novos (usando VARCHAR temporário)
  // Alterar para VARCHAR para aceitar qualquer valor durante a conversão
  await conn.execute("ALTER TABLE `orders` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'analisando'");
  console.log('1. Convertido para VARCHAR');

  // 2. Atualizar os valores antigos para os novos
  await conn.execute("UPDATE `orders` SET `status` = 'analisando' WHERE `status` IN ('pedido_recebido', 'arte_em_analise', 'aguardando_aprovacao')");
  console.log('2. Status antigos convertidos para analisando');
  
  await conn.execute("UPDATE `orders` SET `status` = 'em_producao' WHERE `status` IN ('impressao', 'acabamento')");
  console.log('3. impressao/acabamento convertidos para em_producao');
  
  await conn.execute("UPDATE `orders` SET `status` = 'pronto_entrega' WHERE `status` IN ('pronto', 'saiu_para_entrega')");
  console.log('4. pronto/saiu_para_entrega convertidos para pronto_entrega');

  // 3. Agora alterar para o novo enum
  await conn.execute("ALTER TABLE `orders` MODIFY COLUMN `status` enum('pagamento_aprovado','pagamento_retirada','analisando','com_problemas','em_producao','pronto_entrega','pronto_retirada','entregue','cancelado') NOT NULL DEFAULT 'analisando'");
  console.log('5. Enum atualizado na tabela orders');

  // 4. Alterar orderStatusHistory previousStatus para VARCHAR temporário
  await conn.execute("ALTER TABLE `orderStatusHistory` MODIFY COLUMN `previousStatus` VARCHAR(50)");
  console.log('6. orderStatusHistory previousStatus -> VARCHAR');
  
  await conn.execute("UPDATE `orderStatusHistory` SET `previousStatus` = 'analisando' WHERE `previousStatus` IN ('pedido_recebido', 'arte_em_analise', 'aguardando_aprovacao')");
  await conn.execute("UPDATE `orderStatusHistory` SET `previousStatus` = 'em_producao' WHERE `previousStatus` IN ('impressao', 'acabamento')");
  await conn.execute("UPDATE `orderStatusHistory` SET `previousStatus` = 'pronto_entrega' WHERE `previousStatus` IN ('pronto', 'saiu_para_entrega')");
  
  await conn.execute("ALTER TABLE `orderStatusHistory` MODIFY COLUMN `previousStatus` enum('pagamento_aprovado','pagamento_retirada','analisando','com_problemas','em_producao','pronto_entrega','pronto_retirada','entregue','cancelado')");
  console.log('7. Enum atualizado na tabela orderStatusHistory previousStatus');

  // 5. Alterar orderStatusHistory newStatus
  await conn.execute("ALTER TABLE `orderStatusHistory` MODIFY COLUMN `newStatus` VARCHAR(50) NOT NULL");
  await conn.execute("UPDATE `orderStatusHistory` SET `newStatus` = 'analisando' WHERE `newStatus` IN ('pedido_recebido', 'arte_em_analise', 'aguardando_aprovacao')");
  await conn.execute("UPDATE `orderStatusHistory` SET `newStatus` = 'em_producao' WHERE `newStatus` IN ('impressao', 'acabamento')");
  await conn.execute("UPDATE `orderStatusHistory` SET `newStatus` = 'pronto_entrega' WHERE `newStatus` IN ('pronto', 'saiu_para_entrega')");
  
  await conn.execute("ALTER TABLE `orderStatusHistory` MODIFY COLUMN `newStatus` enum('pagamento_aprovado','pagamento_retirada','analisando','com_problemas','em_producao','pronto_entrega','pronto_retirada','entregue','cancelado') NOT NULL");
  console.log('8. Enum atualizado na tabela orderStatusHistory newStatus');

  console.log('\n✅ Migração concluída com sucesso!');
} catch (e) {
  console.error('❌ Erro:', e.message);
} finally {
  await conn.end();
}
