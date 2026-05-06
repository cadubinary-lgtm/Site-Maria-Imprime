import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const SERVICES = [
  {
    name: "Design de Logo",
    description: "Criação de logo profissional e único para sua marca com múltiplas versões e formatos",
    price: "500.00",
    segment: "servicos"
  },
  {
    name: "Criação de Site",
    description: "Desenvolvimento de site responsivo e otimizado para SEO com design moderno",
    price: "1500.00",
    segment: "servicos"
  },
  {
    name: "Consultoria de Marketing",
    description: "Consultoria estratégica para potencializar suas vendas e presença digital",
    price: "800.00",
    segment: "servicos"
  },
  {
    name: "Fotografia Profissional",
    description: "Sessão de fotografia profissional para produtos, eventos ou retratos corporativos",
    price: "600.00",
    segment: "servicos"
  },
  {
    name: "Edição de Vídeo",
    description: "Edição profissional de vídeos com efeitos, transições e trilha sonora",
    price: "700.00",
    segment: "servicos"
  },
  {
    name: "Desenvolvimento de App",
    description: "Desenvolvimento de aplicativo mobile ou web personalizado para seu negócio",
    price: "2500.00",
    segment: "servicos"
  },
  {
    name: "Branding Completo",
    description: "Pacote completo de identidade visual: logo, cores, tipografia e guidelines",
    price: "1200.00",
    segment: "servicos"
  },
  {
    name: "Social Media Management",
    description: "Gestão completa de redes sociais com conteúdo, engagement e análise de resultados",
    price: "900.00",
    segment: "servicos"
  },
  {
    name: "Copywriting",
    description: "Redação persuasiva para anúncios, landing pages e conteúdo de marketing",
    price: "400.00",
    segment: "servicos"
  },
  {
    name: "Consultoria de Negócios",
    description: "Consultoria estratégica para crescimento, planejamento e otimização de processos",
    price: "1000.00",
    segment: "servicos"
  }
];

async function seedServices() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🚀 Iniciando adição de 10 produtos de serviços...\n");

    for (const service of SERVICES) {
      const query = `
        INSERT INTO products (name, description, price, segment, imageUrl, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
      `;

      const values = [
        service.name,
        service.description,
        service.price,
        service.segment,
        null // imageUrl pode ser adicionado depois
      ];

      await connection.execute(query, values);
      console.log(`✅ Adicionado: ${service.name} - R$ ${service.price}`);
    }

    console.log("\n🎉 Todos os 10 produtos foram adicionados com sucesso!");
    console.log("📊 Você pode visualizá-los no catálogo em 'Serviços'");

  } catch (error) {
    console.error("❌ Erro ao adicionar produtos:", error.message);
  } finally {
    await connection.end();
  }
}

seedServices();
