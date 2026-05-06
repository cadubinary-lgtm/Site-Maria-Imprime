import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATA = {
  "🍔 ALIMENTAÇÃO": {
    icon: "🍔",
    slug: "alimentacao",
    segment: "alimentacao",
    categories: {
      "Hamburgueria": ["Cardápios", "Folhetos / Panfletos", "Cartões de visita", "Etiquetas", "Adesivos de lacre", "Papel anti-gordura", "Embalagens personalizadas", "Displays de mesa", "Imã de geladeira", "Banners"],
      "Pizzaria": ["Cardápios", "Folhetos / Panfletos", "Cartões de visita", "Etiquetas", "Adesivos de lacre", "Embalagens personalizadas", "Displays de mesa", "Imã de geladeira"],
      "Açaíteria": ["Cardápios", "Folhetos / Panfletos", "Etiquetas", "Adesivos", "Embalagens personalizadas"],
      "Restaurante": ["Cardápios", "Folhetos / Panfletos", "Cartões de visita", "Displays de mesa", "Banners"],
      "Delivery": ["Folhetos / Panfletos", "Etiquetas", "Adesivos de lacre", "Embalagens personalizadas", "Imã de geladeira"],
      "Doceria": ["Etiquetas", "Tags", "Embalagens personalizadas", "Cartões", "Adesivos"],
      "Confeitaria": ["Etiquetas", "Tags", "Embalagens personalizadas", "Cartões", "Adesivos"],
      "Padaria": ["Folhetos / Panfletos", "Etiquetas", "Embalagens", "Cartões"],
      "Marmitaria": ["Etiquetas", "Embalagens personalizadas", "Adesivos de lacre", "Folhetos"],
      "Food Truck": ["Banners", "Cardápios", "Adesivos", "Cartões"],
      "Cafeteria": ["Cardápios", "Cartões", "Etiquetas", "Embalagens"],
      "Sorveteria": ["Etiquetas", "Cartões", "Embalagens", "Banners"],
      "Bar": ["Cardápios", "Banners", "Cartões", "Adesivos"],
      "Lanchonete": ["Cardápios", "Folhetos", "Cartões", "Embalagens"],
      "Peixaria": ["Etiquetas", "Folhetos", "Cartões", "Banners"],
    }
  },
  "💄 BELEZA & ESTÉTICA": {
    icon: "💄",
    slug: "beleza",
    segment: "beleza",
    categories: {
      "Salão de Beleza": ["Cartões de visita", "Folhetos / Panfletos", "Cartões fidelidade", "Agenda", "Fichas de cliente", "Adesivos"],
      "Barbearia": ["Cartões", "Folhetos", "Cartões fidelidade", "Adesivos", "Banners"],
      "Cosméticos": ["Etiquetas", "Embalagens personalizadas", "Adesivos", "Cartões"],
      "Perfumaria": ["Etiquetas", "Embalagens", "Cartões", "Adesivos"],
    }
  },
  "🛍️ E-COMMERCE": {
    icon: "🛍️",
    slug: "ecommerce",
    segment: "varejo",
    categories: {
      "Loja Virtual": ["Etiquetas", "Embalagens", "Papel de seda", "Adesivos de lacre", "Cartão de agradecimento", "Inserts promocionais"],
    }
  },
  "💊 SAÚDE & FARMÁCIA": {
    icon: "💊",
    slug: "saude",
    segment: "servicos",
    categories: {
      "Farmácia": ["Cartões", "Folhetos", "Etiquetas", "Embalagens"],
      "Farmácia de Manipulação": ["Etiquetas", "Embalagens", "Papel timbrado"],
      "Clínica Médica": ["Cartões", "Receituários", "Papel timbrado", "Fichas"],
      "Clínica Odontológica": ["Cartões", "Receituários", "Fichas", "Pastas"],
    }
  },
  "🚗 AUTOMOTIVO": {
    icon: "🚗",
    slug: "automotivo",
    segment: "servicos",
    categories: {
      "Mecânica": ["Cartões", "Folhetos", "Talões", "Etiquetas"],
      "Auto Center": ["Cartões", "Folhetos", "Adesivos automotivos", "Lembretes"],
    }
  },
  "⚖️ JURÍDICO": {
    icon: "⚖️",
    slug: "juridico",
    segment: "servicos",
    categories: {
      "Advocacia": ["Cartões profissionais", "Papel timbrado", "Pastas", "Envelopes"],
    }
  },
  "🏠 IMOBILIÁRIA": {
    icon: "🏠",
    slug: "imobiliaria",
    segment: "servicos",
    categories: {
      "Imobiliária": ["Cartões", "Folhetos", "Placas", "Faixas", "Papel timbrado"],
    }
  },
  "❄️ REFRIGERAÇÃO": {
    icon: "❄️",
    slug: "refrigeracao",
    segment: "servicos",
    categories: {
      "Técnicos em Refrigeração": ["Cartões", "Folhetos", "Etiquetas técnicas", "Talões"],
    }
  },
  "🎉 EVENTOS": {
    icon: "🎉",
    slug: "eventos",
    segment: "servicos",
    categories: {
      "Produtores de Eventos": ["Convites", "Banners", "Painéis", "Credenciais", "Pulseiras"],
    }
  },
  "🐾 PET SHOP": {
    icon: "🐾",
    slug: "petshop",
    segment: "varejo",
    categories: {
      "Pet Shop": ["Cartões", "Folhetos", "Etiquetas", "Embalagens"],
    }
  },
  "🏫 EDUCAÇÃO": {
    icon: "🏫",
    slug: "educacao",
    segment: "servicos",
    categories: {
      "Escola": ["Comunicados", "Apostilas", "Certificados"],
      "Curso": ["Folhetos", "Certificados", "Apostilas"],
    }
  },
  "🌐 PROVEDORES": {
    icon: "🌐",
    slug: "provedores",
    segment: "servicos",
    categories: {
      "Provedor de Internet": ["Folhetos", "Cartões", "Boletos", "Contratos"],
    }
  },
  "🏢 PUBLICIDADE": {
    icon: "🏢",
    slug: "publicidade",
    segment: "servicos",
    categories: {
      "Agência": ["Banners", "Adesivos", "Lonas", "Backdrops"],
    }
  },
  "👕 VAREJO": {
    icon: "👕",
    slug: "varejo",
    segment: "varejo",
    categories: {
      "Loja de Roupas": ["Tags", "Etiquetas", "Banners", "Sacolas"],
      "Loja de Calçados": ["Etiquetas", "Cartões", "Banners"],
    }
  },
  "🏗️ CONSTRUÇÃO": {
    icon: "🏗️",
    slug: "construcao",
    segment: "servicos",
    categories: {
      "Construtora": ["Placas de obra", "Banners", "Pastas"],
    }
  },
  "🔧 SERVIÇOS": {
    icon: "🔧",
    slug: "servicos",
    segment: "servicos",
    categories: {
      "Assistência Técnica": ["Cartões", "Ordens de serviço", "Etiquetas"],
      "Eletricista": ["Cartões", "Folhetos", "Adesivos"],
      "Encanador": ["Cartões", "Folhetos"],
    }
  },
  "🏨 TURISMO": {
    icon: "🏨",
    slug: "turismo",
    segment: "servicos",
    categories: {
      "Hotel": ["Cartões", "Cardápios", "Sinalização"],
      "Pousada": ["Cartões", "Folhetos"],
    }
  },
  "🎣 NÁUTICA": {
    icon: "🎣",
    slug: "nautica",
    segment: "servicos",
    categories: {
      "Passeios de Barco": ["Folhetos", "Cartões", "Banners"],
    }
  },
  "🎨 ARTESANATO": {
    icon: "🎨",
    slug: "artesanato",
    segment: "varejo",
    categories: {
      "Artesão": ["Tags", "Etiquetas", "Embalagens"],
    }
  },
  "🏭 REVENDEDORES": {
    icon: "🏭",
    slug: "revendedores",
    segment: "varejo",
    categories: {
      "Revendedor Gráfico": ["Todos os produtos"],
    }
  },
};

async function seedHierarchy() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🚀 Iniciando população de segmentos, categorias e produtos...\n");

    // Mapa para armazenar produtos únicos
    const uniqueProducts = new Map();
    let productId = 1;

    // Primeiro, criar todos os produtos únicos
    console.log("📦 Criando produtos únicos...");
    for (const [segmentName, segmentData] of Object.entries(DATA)) {
      for (const [categoryName, products] of Object.entries(segmentData.categories)) {
        for (const productName of products) {
          if (!uniqueProducts.has(productName)) {
            uniqueProducts.set(productName, {
              id: productId++,
              name: productName,
              description: `Produto: ${productName}`,
              price: "50.00",
              segment: segmentData.segment,
            });
          }
        }
      }
    }

    // Inserir produtos no banco
    for (const product of uniqueProducts.values()) {
      const query = `
        INSERT INTO products (name, description, price, segment, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, true, NOW(), NOW())
        ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
      `;
      await connection.execute(query, [product.name, product.description, product.price, product.segment]);
    }
    console.log(`✅ ${uniqueProducts.size} produtos únicos criados\n`);

    // Agora, criar segmentos e categorias
    console.log("🏷️ Criando segmentos e categorias...");
    let segmentCount = 0;
    let categoryCount = 0;

    for (const [segmentName, segmentData] of Object.entries(DATA)) {
      // Inserir segmento
      const segmentQuery = `
        INSERT INTO segments (name, icon, slug, createdAt)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
      `;
      const [segmentResult] = await connection.execute(segmentQuery, [
        segmentName,
        segmentData.icon,
        segmentData.slug,
      ]);
      const segmentId = segmentResult.insertId;
      segmentCount++;

      // Inserir categorias
      for (const [categoryName, products] of Object.entries(segmentData.categories)) {
        const categoryQuery = `
          INSERT INTO categories (segmentId, name, slug, createdAt)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        `;
        const [categoryResult] = await connection.execute(categoryQuery, [
          segmentId,
          categoryName,
          categoryName.toLowerCase().replace(/\s+/g, "-"),
        ]);
        const categoryId = categoryResult.insertId;
        categoryCount++;

        // Relacionar produtos com categoria
        for (const productName of products) {
          const product = uniqueProducts.get(productName);
          if (product) {
            const relationQuery = `
              INSERT IGNORE INTO productCategories (productId, categoryId, createdAt)
              VALUES (?, ?, NOW())
            `;
            await connection.execute(relationQuery, [product.id, categoryId]);
          }
        }
      }
    }

    console.log(`✅ ${segmentCount} segmentos criados`);
    console.log(`✅ ${categoryCount} categorias criadas`);
    console.log(`\n🎉 Hierarquia completa criada com sucesso!`);
    console.log(`📊 Total: ${uniqueProducts.size} produtos únicos em ${categoryCount} categorias`);

  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await connection.end();
  }
}

seedHierarchy();
