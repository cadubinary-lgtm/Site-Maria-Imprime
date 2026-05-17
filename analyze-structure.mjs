import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'grafica_digital',
});

console.log('\n📊 ANÁLISE DA ESTRUTURA ATUAL\n');

// 1. Contar tipos de variação por produto
console.log('1️⃣ TIPOS DE VARIAÇÃO POR PRODUTO:');
const [productVariations] = await connection.execute(`
  SELECT 
    p.id as productId,
    p.name as productName,
    COUNT(vt.id) as totalVariations,
    GROUP_CONCAT(DISTINCT vt.name ORDER BY vt.name) as variationNames
  FROM products p
  LEFT JOIN variationTypes vt ON p.id = vt.productId
  GROUP BY p.id, p.name
  ORDER BY p.id;
`);
console.table(productVariations);

// 2. Identificar tipos duplicados
console.log('\n2️⃣ TIPOS DUPLICADOS (mesmo nome em múltiplos produtos):');
const [duplicates] = await connection.execute(`
  SELECT 
    name,
    COUNT(*) as duplicateCount,
    GROUP_CONCAT(DISTINCT productId) as productIds,
    GROUP_CONCAT(DISTINCT id) as variationTypeIds
  FROM variationTypes
  GROUP BY name
  HAVING COUNT(*) > 1
  ORDER BY duplicateCount DESC;
`);
console.table(duplicates);

// 3. Contar opções por tipo de variação
console.log('\n3️⃣ OPÇÕES POR TIPO DE VARIAÇÃO:');
const [optionsPerType] = await connection.execute(`
  SELECT 
    vt.id,
    vt.productId,
    vt.name as variationType,
    COUNT(vo.id) as optionCount,
    GROUP_CONCAT(vo.name ORDER BY vo.name) as optionNames
  FROM variationTypes vt
  LEFT JOIN variationOptions vo ON vt.id = vo.variationTypeId
  GROUP BY vt.id, vt.productId, vt.name
  ORDER BY vt.productId, vt.id;
`);
console.table(optionsPerType);

// 4. Estatísticas gerais
console.log('\n4️⃣ ESTATÍSTICAS GERAIS:');
const [stats] = await connection.execute(`
  SELECT 
    (SELECT COUNT(DISTINCT id) FROM products) as totalProducts,
    (SELECT COUNT(*) FROM variationTypes) as totalVariationTypes,
    (SELECT COUNT(DISTINCT name) FROM variationTypes) as uniqueVariationNames,
    (SELECT COUNT(*) FROM variationOptions) as totalVariationOptions,
    (SELECT COUNT(DISTINCT productId) FROM variationTypes) as productsWithVariations;
`);
console.table(stats);

// 5. Produtos sem variações
console.log('\n5️⃣ PRODUTOS SEM VARIAÇÕES:');
const [productsWithoutVariations] = await connection.execute(`
  SELECT 
    p.id,
    p.name
  FROM products p
  LEFT JOIN variationTypes vt ON p.id = vt.productId
  WHERE vt.id IS NULL
  ORDER BY p.id;
`);
console.table(productsWithoutVariations);

await connection.end();
console.log('\n✅ Análise concluída!\n');
