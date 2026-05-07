import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL!);

async function cleanupAll() {
  try {
    const connection = await pool.getConnection();
    console.log('🧹 Iniciando limpeza completa do banco...\n');

    // 1. Remover produtos de teste
    console.log('1️⃣ Removendo produtos de teste...');
    const [testResult] = await connection.query(
      `DELETE FROM products WHERE name LIKE '%test%' OR name LIKE '%Test%'`
    ) as any;
    console.log(`   ✅ Removidos ${testResult.affectedRows} produtos de teste\n`);

    // 2. Remover duplicatas
    console.log('2️⃣ Removendo produtos duplicados...');
    const [duplicates] = await connection.query(`
      SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM products
      GROUP BY name
      HAVING count > 1
    `) as any;

    let totalRemoved = 0;
    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(Number);
      const idsToRemove = ids.slice(1);
      
      await connection.query(
        'DELETE FROM products WHERE id IN (?)',
        [idsToRemove]
      );
      
      totalRemoved += idsToRemove.length;
    }
    console.log(`   ✅ Removidas ${totalRemoved} duplicatas\n`);

    // 3. Adicionar imagens aos produtos
    console.log('3️⃣ Adicionando imagens aos produtos...');
    const [products] = await connection.query('SELECT id, name FROM products WHERE imageUrl IS NULL OR imageUrl = ""') as any;
    
    for (const product of products) {
      const imageUrl = `https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&h=500&fit=crop&q=80`;
      await connection.query(
        'UPDATE products SET imageUrl = ? WHERE id = ?',
        [imageUrl, product.id]
      );
    }
    console.log(`   ✅ Adicionadas imagens a ${products.length} produtos\n`);

    // 4. Contar produtos finais
    const [[{ total }]] = await connection.query('SELECT COUNT(*) as total FROM products') as any;
    console.log(`📊 Total de produtos após limpeza: ${total}\n`);
    console.log('✨ Limpeza concluída com sucesso!');

    await connection.release();
  } catch (error) {
    console.error('❌ Erro:', (error as Error).message);
  } finally {
    await pool.end();
  }
}

cleanupAll();
