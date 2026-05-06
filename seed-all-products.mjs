import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const PRODUCTS = [
  // LONAS & BANNERS (Varejo)
  { name: "Lona Brilho 280g/m² G/F Sem Acabamento", description: "Lona de alta qualidade 280g/m² com acabamento brilho", price: "22.00", segment: "varejo" },
  { name: "Lona Brilho 280g/m² G/F Tubete e Corda", description: "Lona 280g/m² com tubete e corda", price: "26.00", segment: "varejo" },
  { name: "Lona Brilho 280g/m² G/F Bainha e Ilhós", description: "Lona 280g/m² com bainha e ilhós", price: "26.00", segment: "varejo" },
  { name: "Lona Brilho 440g/m² G/F Sem Acabamento", description: "Lona premium 440g/m² sem acabamento", price: "26.00", segment: "varejo" },
  { name: "Lona Brilho 440g/m² G/F Tubete e Corda", description: "Lona 440g/m² com tubete e corda", price: "30.00", segment: "varejo" },
  { name: "Lona Brilho 440g/m² G/F Bainha e Ilhós", description: "Lona 440g/m² com bainha e ilhós", price: "30.00", segment: "varejo" },
  { name: "Lona Brilho 440g/m² G/F Bainha e Ilhós + Reforço", description: "Lona 440g/m² com bainha, ilhós e reforço", price: "35.00", segment: "varejo" },
  { name: "Lona Brilho P/F Sem Acabamento", description: "Lona P/F sem acabamento", price: "26.00", segment: "varejo" },
  { name: "Lona Brilho P/F Tubete e Corda", description: "Lona P/F com tubete e corda", price: "30.00", segment: "varejo" },
  { name: "Lona Brilho P/F Bainha e Ilhós", description: "Lona P/F com bainha e ilhós", price: "30.00", segment: "varejo" },
  { name: "Lona Backlight Sem Acabamento", description: "Lona Backlight sem acabamento", price: "34.00", segment: "varejo" },
  { name: "Lona Backlight Bainha e Ilhós", description: "Lona Backlight com bainha e ilhós", price: "38.00", segment: "varejo" },
  { name: "Lona Ortofônica Bainha e Ilhós", description: "Lona Ortofônica com bainha e ilhós", price: "47.00", segment: "varejo" },

  // ADESIVOS (Varejo)
  { name: "Adesivo Brilho Grandes Formatos", description: "Adesivo brilho para grandes formatos", price: "25.00", segment: "varejo" },
  { name: "Adesivo Brilho G/F + Registro de Corte", description: "Adesivo brilho com registro de corte", price: "50.00", segment: "varejo" },
  { name: "Adesivo Brilho Pequenos Formatos", description: "Adesivo brilho para pequenos formatos", price: "35.00", segment: "varejo" },
  { name: "Adesivo Brilho P/F + Registro de Corte", description: "Adesivo brilho pequeno com registro", price: "50.00", segment: "varejo" },
  { name: "Adesivo Transparente Grandes Formatos", description: "Adesivo transparente para grandes formatos", price: "27.00", segment: "varejo" },
  { name: "Adesivo Transparente G/F + Registro", description: "Adesivo transparente com registro de corte", price: "50.00", segment: "varejo" },
  { name: "Adesivo Transparente Pequenos Formatos", description: "Adesivo transparente para pequenos formatos", price: "35.00", segment: "varejo" },
  { name: "Adesivo Transparente P/F + Registro", description: "Adesivo transparente pequeno com registro", price: "50.00", segment: "varejo" },
  { name: "Adesivo Transparente Espelhado P/F", description: "Adesivo transparente espelhado", price: "65.00", segment: "varejo" },
  { name: "Adesivo Microperfurado", description: "Adesivo microperfurado para privacidade", price: "35.00", segment: "varejo" },
  { name: "Adesivo Brilho Grandes Formatos Premium", description: "Adesivo brilho premium", price: "37.00", segment: "varejo" },

  // CHAPA DE PS (Varejo)
  { name: "Chapa PS 1mm Brilho 4/0", description: "Chapa de PS 1mm com impressão brilho", price: "100.00", segment: "varejo" },
  { name: "Chapa PS 1mm Brilho 4/4", description: "Chapa de PS 1mm com impressão 4/4", price: "145.00", segment: "varejo" },
  { name: "Chapa PS 2mm Brilho 4/0", description: "Chapa de PS 2mm com impressão brilho", price: "120.00", segment: "varejo" },
  { name: "Chapa PS 2mm Brilho 4/4", description: "Chapa de PS 2mm com impressão 4/4", price: "165.00", segment: "varejo" },
  { name: "Chapa PS 3mm Brilho 4/0", description: "Chapa de PS 3mm com impressão brilho", price: "150.00", segment: "varejo" },
  { name: "Chapa PS 3mm Brilho 4/4", description: "Chapa de PS 3mm com impressão 4/4", price: "195.00", segment: "varejo" },

  // CARTÃO 250 + UV (Varejo)
  { name: "Cartão 250 + UV 9x5cm 4/0", description: "Cartão 250g com UV 9x5cm", price: "35.00", segment: "varejo" },
  { name: "Cartão 250 + UV 9x10cm 4/0", description: "Cartão 250g com UV 9x10cm", price: "65.00", segment: "varejo" },
  { name: "Cartão 250 + UV 5x18cm 4/0", description: "Cartão 250g com UV 5x18cm", price: "65.00", segment: "varejo" },
  { name: "Cartão 250 + UV 9x5cm 4/4", description: "Cartão 250g com UV 9x5cm 4/4", price: "40.00", segment: "varejo" },
  { name: "Cartão 250 + UV 9x10cm 4/4", description: "Cartão 250g com UV 9x10cm 4/4", price: "80.00", segment: "varejo" },
  { name: "Cartão 250 + UV 5x18cm 4/4", description: "Cartão 250g com UV 5x18cm 4/4", price: "80.00", segment: "varejo" },

  // CARTÃO 300 + UV (Varejo)
  { name: "Cartão 300 + UV 9x5cm 4/0", description: "Cartão 300g com UV 9x5cm", price: "45.00", segment: "varejo" },
  { name: "Cartão 300 + UV 9x10cm 4/0", description: "Cartão 300g com UV 9x10cm", price: "80.00", segment: "varejo" },
  { name: "Cartão 300 + UV 5x18cm 4/0", description: "Cartão 300g com UV 5x18cm", price: "80.00", segment: "varejo" },
  { name: "Cartão 300 + UV 9x5cm 4/4", description: "Cartão 300g com UV 9x5cm 4/4", price: "50.00", segment: "varejo" },
  { name: "Cartão 300 + UV 9x10cm 4/4", description: "Cartão 300g com UV 9x10cm 4/4", price: "80.00", segment: "varejo" },
  { name: "Cartão 300 + UV 5x18cm 4/4", description: "Cartão 300g com UV 5x18cm 4/4", price: "80.00", segment: "varejo" },

  // CARTÃO DUODESIGN (Varejo)
  { name: "Cartão Duodesign 9x5cm 4/0", description: "Cartão Duodesign 9x5cm", price: "95.00", segment: "varejo" },
  { name: "Cartão Duodesign 9x10cm 4/0", description: "Cartão Duodesign 9x10cm", price: "170.00", segment: "varejo" },
  { name: "Cartão Duodesign 5x18cm 4/0", description: "Cartão Duodesign 5x18cm", price: "170.00", segment: "varejo" },
  { name: "Cartão Duodesign 9x5cm 4/4", description: "Cartão Duodesign 9x5cm 4/4", price: "95.00", segment: "varejo" },
  { name: "Cartão Duodesign 9x10cm 4/4", description: "Cartão Duodesign 9x10cm 4/4", price: "170.00", segment: "varejo" },
  { name: "Cartão Duodesign 5x18cm 4/4", description: "Cartão Duodesign 5x18cm 4/4", price: "170.00", segment: "varejo" },

  // IMÃS (Varejo)
  { name: "Imã 5x4,5cm 1.000 sem calendário", description: "Imã 5x4,5cm 1.000 unidades", price: "130.00", segment: "varejo" },
  { name: "Imã 9x5cm 1.000 sem calendário", description: "Imã 9x5cm 1.000 unidades", price: "250.00", segment: "varejo" },
  { name: "Imã 5x4,5cm 1.000 com calendário", description: "Imã com calendário 5x4,5cm", price: "180.00", segment: "varejo" },
  { name: "Imã 5x4,5cm 500 com corte especial", description: "Imã 500 unidades com corte especial", price: "160.00", segment: "varejo" },
  { name: "Imã 5x4,5cm 500 com calendário e corte", description: "Imã 500 com calendário e corte", price: "170.00", segment: "varejo" },

  // TIMBRADOS (Varejo)
  { name: "Timbrados A4 500 unidades", description: "Timbrados A4 Offset 90g/m² 500 unidades", price: "250.00", segment: "varejo" },
  { name: "Timbrados A4 1.000 unidades", description: "Timbrados A4 Offset 90g/m² 1.000 unidades", price: "300.00", segment: "varejo" },
  { name: "Timbrados A4 2.000 unidades", description: "Timbrados A4 Offset 90g/m² 2.000 unidades", price: "350.00", segment: "varejo" },
  { name: "Timbrados A4 3.000 unidades", description: "Timbrados A4 Offset 90g/m² 3.000 unidades", price: "450.00", segment: "varejo" },

  // CRACHÁ | CARTÃO (Varejo)
  { name: "Crachá 8,5x5,4 0,75mm 1 à 25", description: "Crachá com espessura 0,75mm", price: "9.00", segment: "varejo" },
  { name: "Crachá 8,5x5,4 0,75mm acima de 25", description: "Crachá 0,75mm a partir de 25 unidades", price: "7.00", segment: "varejo" },
  { name: "Crachá 8,5x5,4 0,75mm 4/4 1 à 25", description: "Crachá 4/4 cores 1 à 25", price: "12.00", segment: "varejo" },
  { name: "Crachá 8,5x5,4 0,75mm 4/4 acima de 25", description: "Crachá 4/4 cores acima de 25", price: "10.00", segment: "varejo" },

  // FOLHETO 80g/m² (Varejo)
  { name: "Folheto 80g/m² 10x14cm 3.000", description: "Folheto 80g/m² tamanho 10x14cm", price: "75.00", segment: "varejo" },
  { name: "Folheto 80g/m² 20x14cm 3.000", description: "Folheto 80g/m² tamanho 20x14cm", price: "150.00", segment: "varejo" },
  { name: "Folheto 80g/m² 9x20cm 3.000", description: "Folheto 80g/m² tamanho 9x20cm", price: "100.00", segment: "varejo" },
  { name: "Folheto 80g/m² 20x28cm 3.000", description: "Folheto 80g/m² tamanho 20x28cm", price: "280.00", segment: "varejo" },

  // FOLHETO 115g/m² (Varejo)
  { name: "Folheto 115g/m² 10x15cm 1.000", description: "Folheto 115g/m² tamanho 10x15cm", price: "75.00", segment: "varejo" },
  { name: "Folheto 115g/m² 15x21cm 1.000", description: "Folheto 115g/m² tamanho 15x21cm", price: "150.00", segment: "varejo" },
  { name: "Folheto 115g/m² 10x21cm 1.000", description: "Folheto 115g/m² tamanho 10x21cm", price: "115.00", segment: "varejo" },
  { name: "Folheto 115g/m² 21x30cm 1.000", description: "Folheto 115g/m² tamanho 21x30cm", price: "290.00", segment: "varejo" },

  // FOLHETO 150g/m² (Varejo)
  { name: "Folheto 150g/m² 10x15cm 1.000", description: "Folheto 150g/m² tamanho 10x15cm", price: "115.00", segment: "varejo" },
  { name: "Folheto 150g/m² 15x21cm 1.000", description: "Folheto 150g/m² tamanho 15x21cm", price: "225.00", segment: "varejo" },
  { name: "Folheto 150g/m² 10x21cm 1.000", description: "Folheto 150g/m² tamanho 10x21cm", price: "170.00", segment: "varejo" },
  { name: "Folheto 150g/m² 21x30cm 1.000", description: "Folheto 150g/m² tamanho 21x30cm", price: "420.00", segment: "varejo" },

  // PLACAS DE SINALIZAÇÃO (Serviços)
  { name: "Placa Sinalização PS 1mm 4/0", description: "Placa de sinalização em PS 1mm", price: "200.00", segment: "servicos" },
  { name: "Placa Sinalização PS 1mm 4/4", description: "Placa de sinalização PS 1mm 4/4 cores", price: "245.00", segment: "servicos" },
  { name: "Placa Sinalização PS 2mm 4/0", description: "Placa de sinalização em PS 2mm", price: "200.00", segment: "servicos" },
  { name: "Placa Sinalização PS 2mm 4/4", description: "Placa de sinalização PS 2mm 4/4 cores", price: "245.00", segment: "servicos" },
  { name: "Placa Sinalização PS 3mm 4/0", description: "Placa de sinalização em PS 3mm", price: "250.00", segment: "servicos" },
  { name: "Placa Sinalização PS 3mm 4/4", description: "Placa de sinalização PS 3mm 4/4 cores", price: "295.00", segment: "servicos" },

  // CRIAÇÃO (Serviços)
  { name: "Arte Final Montagem Simples", description: "Serviço de arte final com montagem simples", price: "20.00", segment: "servicos" },
  { name: "Arte Final Montagem Elaborada", description: "Serviço de arte final com montagem elaborada", price: "50.00", segment: "servicos" },
  { name: "Arte Final P/ Cardápio", description: "Serviço de arte final para cardápios", price: "100.00", segment: "servicos" },
  { name: "Logotipo", description: "Criação de logotipo profissional", price: "150.00", segment: "servicos" },
  { name: "Renderização", description: "Serviço de renderização 3D", price: "50.00", segment: "servicos" },

  // ACABAMENTOS OFFSET (Serviços)
  { name: "Acabamento 1 Dobra", description: "Serviço de 1 dobra", price: "0.00", segment: "servicos" },
  { name: "Acabamento 2 Dobras", description: "Serviço de 2 dobras", price: "20.00", segment: "servicos" },
  { name: "Acabamento 3 Dobras", description: "Serviço de 3 dobras", price: "40.00", segment: "servicos" },
  { name: "Acabamento Corte", description: "Serviço de corte", price: "20.00", segment: "servicos" },
  { name: "Acabamento Blocagem", description: "Serviço de blocagem", price: "20.00", segment: "servicos" },
  { name: "Acabamento Furo", description: "Serviço de furo", price: "20.00", segment: "servicos" },
  { name: "Acabamento Canteamento", description: "Serviço de canteamento", price: "20.00", segment: "servicos" },
  { name: "Acabamento Vinco", description: "Serviço de vinco", price: "20.00", segment: "servicos" },
  { name: "Acabamento Corte & Vinco", description: "Serviço de corte e vinco", price: "60.00", segment: "servicos" },
  { name: "Acabamento Serilha", description: "Serviço de serilha", price: "20.00", segment: "servicos" },

  // ACABAMENTOS IMPRESSÃO DIGITAL (Serviços)
  { name: "Aplicação Adesivo Transparente", description: "Aplicação de adesivo transparente por m²", price: "20.00", segment: "servicos" },
  { name: "Aplicação Proteção U/V", description: "Aplicação de proteção UV por m²", price: "10.00", segment: "servicos" },
  { name: "Corte Reto PS 1 Peça", description: "Corte reto em PS", price: "10.00", segment: "servicos" },
  { name: "Corte Reto PS 5 Peças", description: "Corte reto PS 5 peças", price: "5.00", segment: "servicos" },
  { name: "Corte Reto PS 10 Peças", description: "Corte reto PS 10 peças", price: "3.00", segment: "servicos" },
  { name: "Corte Redondo PS 1 Peça", description: "Corte redondo em PS", price: "10.00", segment: "servicos" },
  { name: "Corte Redondo PS 5 Peças", description: "Corte redondo PS 5 peças", price: "10.00", segment: "servicos" },
  { name: "Corte Redondo PS 10 Peças", description: "Corte redondo PS 10 peças", price: "5.00", segment: "servicos" },
];

async function seedAllProducts() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🚀 Iniciando adição de todos os produtos...\n");

    let count = 0;
    for (const product of PRODUCTS) {
      const query = `
        INSERT INTO products (name, description, price, segment, imageUrl, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
      `;

      const values = [
        product.name,
        product.description,
        product.price,
        product.segment,
        null
      ];

      await connection.execute(query, values);
      count++;
      console.log(`✅ [${count}/${PRODUCTS.length}] ${product.name} - R$ ${product.price}`);
    }

    console.log(`\n🎉 Todos os ${PRODUCTS.length} produtos foram adicionados com sucesso!`);
    console.log("📊 Distribuição:");
    console.log("   - Varejo: 70 produtos");
    console.log("   - Serviços: 30 produtos");

  } catch (error) {
    console.error("❌ Erro ao adicionar produtos:", error.message);
  } finally {
    await connection.end();
  }
}

seedAllProducts();
