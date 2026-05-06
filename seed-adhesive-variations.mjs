import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MATERIALS = [
  {
    name: "Adesivo Brilho Premium",
    description: "Alta qualidade de impressão com cores vivas e excelente definição. Ideal para acabamento profissional e maior durabilidade.",
    price: "50.00"
  },
  {
    name: "Adesivo Brilho Promocional",
    description: "Opção mais econômica, indicada para campanhas de curto prazo e ações promocionais.",
    price: "30.00"
  },
  {
    name: "Adesivo Brilho Blackout",
    description: "Possui camada bloqueadora de luz, impedindo transparência. Indicado para cobertura de superfícies ou aplicação sobre adesivos existentes.",
    price: "60.00"
  },
  {
    name: "Adesivo Fosco",
    description: "Acabamento sem brilho, com visual elegante e sofisticado. Reduz reflexos e melhora a leitura.",
    price: "55.00"
  },
  {
    name: "Adesivo Fosco Blackout",
    description: "Acabamento fosco com bloqueio total de transparência. Ideal para aplicações que exigem cobertura completa com aparência premium.",
    price: "70.00"
  },
  {
    name: "Adesivo Microperfurado",
    description: "Indicado para aplicação em vidros. Permite visibilidade de dentro para fora, mantendo a comunicação visível externamente.",
    price: "75.00"
  },
  {
    name: "Adesivo Transparente",
    description: "Fundo invisível que evidencia apenas a arte impressa. Ideal para aplicações discretas em superfícies lisas ou vidro.",
    price: "45.00"
  },
  {
    name: "Adesivo Retroverso",
    description: "Impressão espelhada para aplicação interna em vidro, com leitura correta pelo lado externo. Oferece maior proteção à impressão.",
    price: "80.00"
  }
];

const FINISHES = [
  {
    name: "Meio Corte",
    description: "Recorte especial mantendo a base do adesivo",
    price: "15.00"
  },
  {
    name: "Corte Total",
    description: "Adesivo totalmente recortado e solto",
    price: "20.00"
  },
  {
    name: "Refile",
    description: "Corte reto simples",
    price: "10.00"
  }
];

async function seedVariations() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🚀 Iniciando população de variações de adesivos...\n");

    // Encontrar o produto "Adesivos" ou criar um se não existir
    let [products] = await connection.execute(
      "SELECT id FROM products WHERE name LIKE '%Adesivo%' LIMIT 1"
    );

    let productId;
    if (products.length > 0) {
      productId = products[0].id;
      console.log(`✅ Encontrado produto de adesivos com ID: ${productId}`);
    } else {
      // Criar um produto de adesivos se não existir
      const [result] = await connection.execute(
        `INSERT INTO products (name, description, price, segment, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, true, NOW(), NOW())`,
        ["Adesivos Personalizados", "Adesivos de alta qualidade personalizados", "100.00", "varejo"]
      );
      productId = result.insertId;
      console.log(`✅ Criado novo produto de adesivos com ID: ${productId}`);
    }

    // Criar tipo de variação: MATERIAIS
    console.log("\n📦 Criando tipo de variação: MATERIAIS");
    const [materialTypeResult] = await connection.execute(
      `INSERT INTO variationTypes (productId, type, name, isRequired, createdAt)
       VALUES (?, ?, ?, true, NOW())`,
      [productId, "material", "Material"]
    );
    const materialTypeId = materialTypeResult.insertId;
    console.log(`✅ Tipo de variação MATERIAIS criado com ID: ${materialTypeId}`);

    // Inserir opções de materiais
    console.log("\n🎨 Inserindo 8 opções de materiais...");
    for (const material of MATERIALS) {
      await connection.execute(
        `INSERT INTO variationOptions (variationTypeId, name, description, priceModifier, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [materialTypeId, material.name, material.description, material.price]
      );
    }
    console.log(`✅ 8 materiais inseridos com sucesso`);

    // Criar tipo de variação: ACABAMENTOS
    console.log("\n📦 Criando tipo de variação: ACABAMENTOS");
    const [finishTypeResult] = await connection.execute(
      `INSERT INTO variationTypes (productId, type, name, isRequired, createdAt)
       VALUES (?, ?, ?, true, NOW())`,
      [productId, "acabamento", "Acabamento"]
    );
    const finishTypeId = finishTypeResult.insertId;
    console.log(`✅ Tipo de variação ACABAMENTOS criado com ID: ${finishTypeId}`);

    // Inserir opções de acabamentos
    console.log("\n✂️ Inserindo 3 opções de acabamentos...");
    for (const finish of FINISHES) {
      await connection.execute(
        `INSERT INTO variationOptions (variationTypeId, name, description, priceModifier, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [finishTypeId, finish.name, finish.description, finish.price]
      );
    }
    console.log(`✅ 3 acabamentos inseridos com sucesso`);

    console.log("\n🎉 Variações de adesivos populadas com sucesso!");
    console.log(`📊 Total: 8 materiais + 3 acabamentos = 11 variações`);
    console.log(`💰 Preços de materiais: R$ 30 a R$ 80`);
    console.log(`💰 Preços de acabamentos: R$ 10 a R$ 20`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await connection.end();
  }
}

seedVariations();
