#!/usr/bin/env node

/**
 * ========================================
 * SEED: Atributos Globais e Regras de Compatibilidade
 * ========================================
 * Cria:
 * 1. Atributos globais (Material, Acabamento, Ilhós, Bastão, Laminação, Dobra)
 * 2. Valores de atributos por tipo
 * 3. Produtos de teste (Lona, Folheto, Adesivo, Placa)
 * 4. Vinculação de atributos aos produtos
 * 5. Regras de compatibilidade por categoria
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api/trpc';

// Simular um usuário admin para as chamadas
const headers = {
  'Content-Type': 'application/json',
};

async function callTrpc(procedure, input) {
  const url = `${API_BASE}/${procedure}`;
  console.log(`📡 Chamando ${procedure}...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ json: input }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erro em ${procedure}:`, error);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ ${procedure} sucesso`);
    return data.result?.data;
  } catch (error) {
    console.error(`❌ Erro ao chamar ${procedure}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando seed de atributos e regras...\n');

  // ========================================
  // PASSO 1: Criar Atributos Globais
  // ========================================
  console.log('📋 PASSO 1: Criando atributos globais...\n');

  const attributes = [];

  // Material
  const material = await callTrpc('attributes.createAttribute', {
    name: 'Material',
    slug: 'material',
    description: 'Tipo de material (Lona, Papel, Vinil, etc)',
    type: 'select',
    isGlobal: true,
  });
  if (material) attributes.push({ id: material.id, name: 'Material', slug: 'material' });

  // Acabamento
  const acabamento = await callTrpc('attributes.createAttribute', {
    name: 'Acabamento',
    slug: 'acabamento',
    description: 'Tipo de acabamento (Brilho, Fosco, Laminado)',
    type: 'select',
    isGlobal: true,
  });
  if (acabamento) attributes.push({ id: acabamento.id, name: 'Acabamento', slug: 'acabamento' });

  // Ilhós
  const ilhos = await callTrpc('attributes.createAttribute', {
    name: 'Ilhós',
    slug: 'ilhos',
    description: 'Adicionar ilhós nas extremidades',
    type: 'select',
    isGlobal: true,
  });
  if (ilhos) attributes.push({ id: ilhos.id, name: 'Ilhós', slug: 'ilhos' });

  // Bastão
  const bastao = await callTrpc('attributes.createAttribute', {
    name: 'Bastão',
    slug: 'bastao',
    description: 'Bastão para pendurar',
    type: 'select',
    isGlobal: true,
  });
  if (bastao) attributes.push({ id: bastao.id, name: 'Bastão', slug: 'bastao' });

  // Laminação
  const laminacao = await callTrpc('attributes.createAttribute', {
    name: 'Laminação',
    slug: 'laminacao',
    description: 'Tipo de laminação (Brilho, Fosco, Matte)',
    type: 'select',
    isGlobal: true,
  });
  if (laminacao) attributes.push({ id: laminacao.id, name: 'Laminação', slug: 'laminacao' });

  // Dobra
  const dobra = await callTrpc('attributes.createAttribute', {
    name: 'Dobra',
    slug: 'dobra',
    description: 'Tipo de dobra (Simples, Dupla, Sanfona)',
    type: 'select',
    isGlobal: true,
  });
  if (dobra) attributes.push({ id: dobra.id, name: 'Dobra', slug: 'dobra' });

  console.log(`\n✅ ${attributes.length} atributos criados\n`);

  // ========================================
  // PASSO 2: Criar Valores de Atributos
  // ========================================
  console.log('📋 PASSO 2: Criando valores de atributos...\n');

  // Valores para Material
  if (material) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: material.id,
      value: 'Lona 280g',
      priceModifier: 0,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: material.id,
      value: 'Papel Couchê 300g',
      priceModifier: -5,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: material.id,
      value: 'Vinil Adesivo',
      priceModifier: 10,
    });
  }

  // Valores para Acabamento
  if (acabamento) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: acabamento.id,
      value: 'Brilho',
      priceModifier: 0,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: acabamento.id,
      value: 'Fosco',
      priceModifier: 5,
    });
  }

  // Valores para Ilhós
  if (ilhos) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: ilhos.id,
      value: 'Sim',
      priceModifier: 15,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: ilhos.id,
      value: 'Não',
      priceModifier: 0,
    });
  }

  // Valores para Bastão
  if (bastao) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: bastao.id,
      value: 'Sim',
      priceModifier: 20,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: bastao.id,
      value: 'Não',
      priceModifier: 0,
    });
  }

  // Valores para Laminação
  if (laminacao) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: laminacao.id,
      value: 'Brilho',
      priceModifier: 10,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: laminacao.id,
      value: 'Fosco',
      priceModifier: 12,
    });
  }

  // Valores para Dobra
  if (dobra) {
    await callTrpc('attributes.createAttributeValue', {
      attributeId: dobra.id,
      value: 'Simples',
      priceModifier: 0,
    });
    await callTrpc('attributes.createAttributeValue', {
      attributeId: dobra.id,
      value: 'Dupla',
      priceModifier: 5,
    });
  }

  console.log('\n✅ Valores de atributos criados\n');

  // ========================================
  // PASSO 3: Criar Produtos de Teste
  // ========================================
  console.log('📋 PASSO 3: Criando produtos de teste...\n');

  const products = [];

  // Produto: Lona
  const lonaProduct = await callTrpc('products.createProduct', {
    name: 'Lona 280g Brilho',
    description: 'Lona de alta qualidade para banners e lonas',
    price: '100',
    segment: 'varejo',
    imageUrl: 'https://via.placeholder.com/300x300?text=Lona',
  });
  if (lonaProduct) products.push({ id: lonaProduct.id, name: 'Lona', category: 'Lona' });

  // Produto: Folheto
  const folhetoProduct = await callTrpc('products.createProduct', {
    name: 'Folheto A4 Couchê 300g',
    description: 'Folheto profissional em papel couchê',
    price: '50',
    segment: 'varejo',
    imageUrl: 'https://via.placeholder.com/300x300?text=Folheto',
  });
  if (folhetoProduct) products.push({ id: folhetoProduct.id, name: 'Folheto', category: 'Folheto' });

  // Produto: Adesivo
  const adesivoProduct = await callTrpc('products.createProduct', {
    name: 'Adesivo Vinil 10x10cm',
    description: 'Adesivo de vinil para personalizações',
    price: '25',
    segment: 'varejo',
    imageUrl: 'https://via.placeholder.com/300x300?text=Adesivo',
  });
  if (adesivoProduct) products.push({ id: adesivoProduct.id, name: 'Adesivo', category: 'Adesivo' });

  // Produto: Placa
  const placaProduct = await callTrpc('products.createProduct', {
    name: 'Placa PVC 20x30cm',
    description: 'Placa de PVC para sinalização',
    price: '75',
    segment: 'varejo',
    imageUrl: 'https://via.placeholder.com/300x300?text=Placa',
  });
  if (placaProduct) products.push({ id: placaProduct.id, name: 'Placa', category: 'Placa' });

  console.log(`\n✅ ${products.length} produtos criados\n`);

  // ========================================
  // PASSO 4: Vincular Atributos aos Produtos
  // ========================================
  console.log('📋 PASSO 4: Vinculando atributos aos produtos...\n');

  // Vincular Material a todos os produtos
  if (material) {
    for (const product of products) {
      await callTrpc('attributes.linkAttributeToProduct', {
        productId: product.id,
        attributeId: material.id,
        isRequired: true,
        allowMultiple: false,
      });
    }
  }

  // Vincular Acabamento a todos os produtos
  if (acabamento) {
    for (const product of products) {
      await callTrpc('attributes.linkAttributeToProduct', {
        productId: product.id,
        attributeId: acabamento.id,
        isRequired: false,
        allowMultiple: false,
      });
    }
  }

  // Vincular Ilhós apenas a Lona
  if (ilhos && products[0]) {
    await callTrpc('attributes.linkAttributeToProduct', {
      productId: products[0].id, // Lona
      attributeId: ilhos.id,
      isRequired: false,
      allowMultiple: false,
    });
  }

  // Vincular Bastão apenas a Lona
  if (bastao && products[0]) {
    await callTrpc('attributes.linkAttributeToProduct', {
      productId: products[0].id, // Lona
      attributeId: bastao.id,
      isRequired: false,
      allowMultiple: false,
    });
  }

  // Vincular Laminação a Folheto e Adesivo
  if (laminacao && products[1]) {
    await callTrpc('attributes.linkAttributeToProduct', {
      productId: products[1].id, // Folheto
      attributeId: laminacao.id,
      isRequired: false,
      allowMultiple: false,
    });
  }
  if (laminacao && products[2]) {
    await callTrpc('attributes.linkAttributeToProduct', {
      productId: products[2].id, // Adesivo
      attributeId: laminacao.id,
      isRequired: false,
      allowMultiple: false,
    });
  }

  // Vincular Dobra a Folheto
  if (dobra && products[1]) {
    await callTrpc('attributes.linkAttributeToProduct', {
      productId: products[1].id, // Folheto
      attributeId: dobra.id,
      isRequired: false,
      allowMultiple: false,
    });
  }

  console.log('\n✅ Atributos vinculados aos produtos\n');

  // ========================================
  // PASSO 5: Criar Regras de Compatibilidade
  // ========================================
  console.log('📋 PASSO 5: Criando regras de compatibilidade...\n');

  // LONA: Mostrar Ilhós e Bastão quando Material = Lona
  if (products[0] && material && ilhos && bastao) {
    await callTrpc('attributes.createAttributeRule', {
      productId: products[0].id, // Lona
      name: 'Lona requer Ilhós e Bastão',
      description: 'Quando material é Lona, mostrar opções de Ilhós e Bastão',
      conditions: [
        {
          attributeId: material.id,
          operator: 'equals',
          value: 'Lona 280g',
        },
      ],
      actions: [
        {
          targetAttributeId: ilhos.id,
          action: 'show',
        },
        {
          targetAttributeId: bastao.id,
          action: 'show',
        },
      ],
    });
  }

  // LONA: Ocultar Laminação e Dobra para Lona
  if (products[0] && material && laminacao && dobra) {
    await callTrpc('attributes.createAttributeRule', {
      productId: products[0].id, // Lona
      name: 'Lona não permite Laminação ou Dobra',
      description: 'Lona não é compatível com Laminação ou Dobra',
      conditions: [
        {
          attributeId: material.id,
          operator: 'equals',
          value: 'Lona 280g',
        },
      ],
      actions: [
        {
          targetAttributeId: laminacao.id,
          action: 'hide',
        },
        {
          targetAttributeId: dobra.id,
          action: 'hide',
        },
      ],
    });
  }

  // FOLHETO: Mostrar Dobra quando Material = Papel Couchê
  if (products[1] && material && dobra) {
    await callTrpc('attributes.createAttributeRule', {
      productId: products[1].id, // Folheto
      name: 'Folheto permite Dobra',
      description: 'Quando material é Papel Couchê, mostrar opção de Dobra',
      conditions: [
        {
          attributeId: material.id,
          operator: 'equals',
          value: 'Papel Couchê 300g',
        },
      ],
      actions: [
        {
          targetAttributeId: dobra.id,
          action: 'show',
        },
      ],
    });
  }

  // ADESIVO: Ocultar Dobra
  if (products[2] && dobra) {
    await callTrpc('attributes.createAttributeRule', {
      productId: products[2].id, // Adesivo
      name: 'Adesivo não permite Dobra',
      description: 'Adesivo não é compatível com Dobra',
      conditions: [],
      actions: [
        {
          targetAttributeId: dobra.id,
          action: 'hide',
        },
      ],
    });
  }

  console.log('\n✅ Regras de compatibilidade criadas\n');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\nResumo:');
  console.log(`- ${attributes.length} atributos globais criados`);
  console.log(`- ${products.length} produtos de teste criados`);
  console.log('- Atributos vinculados aos produtos');
  console.log('- Regras de compatibilidade por categoria implementadas');
}

main().catch(console.error);
