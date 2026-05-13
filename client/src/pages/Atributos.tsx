import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AttributeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const attributeCategories: AttributeCategory[] = [
  {
    id: 'impressao',
    name: 'TIPO DE IMPRESSÃO',
    description: 'Selecione o tipo de impressão desejado',
    icon: '🖨️',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    id: 'material',
    name: 'TIPO DE MATERIAL',
    description: 'Escolha o material para seu produto',
    icon: '📦',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    id: 'papel',
    name: 'TIPO DE PAPEL',
    description: 'Selecione a gramatura e tipo de papel',
    icon: '📄',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  },
  {
    id: 'acabamento',
    name: 'TIPO DE ACABAMENTO',
    description: 'Escolha o acabamento para seu produto',
    icon: '✨',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  },
  {
    id: 'cor',
    name: 'TIPO DE COR',
    description: 'Selecione a configuração de cores',
    icon: '🎨',
    color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  },
  {
    id: 'formato',
    name: 'TIPO DE FORMATO',
    description: 'Escolha o formato do seu produto',
    icon: '📐',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  },
  {
    id: 'quantidade',
    name: 'QUANTIDADE',
    description: 'Defina a quantidade desejada',
    icon: '🔢',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  },
];

export default function Atributos() {
  const handleAddAttribute = (categoryId: string) => {
    console.log(`Adicionar atributo à categoria: ${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gerenciador de Atributos</h1>
          <p className="text-lg text-slate-600">
            Gerencie todos os atributos disponíveis para seus produtos
          </p>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attributeCategories.map((category) => (
            <Card
              key={category.id}
              className={`border-2 transition-all duration-300 cursor-pointer ${category.color}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-slate-600 mt-1">
                        {category.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Placeholder para atributos */}
                  <div className="bg-white/50 rounded-lg p-3 border border-dashed border-slate-300">
                    <p className="text-sm text-slate-500 text-center">
                      Nenhum atributo adicionado
                    </p>
                  </div>

                  {/* Botão para adicionar */}
                  <Button
                    onClick={() => handleAddAttribute(category.id)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Atributo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seção de Resumo */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Resumo de Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attributeCategories.map((category) => (
              <div key={category.id} className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl mb-2">{category.icon}</p>
                <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                <p className="text-xs text-slate-500 mt-1">0 atributos</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
