import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface DeliveryOption {
  id?: number;
  name: string;
  description: string;
  daysMin: number;
  daysMax: number;
  priceMultiplier: number;
}

interface SegmentOption {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export default function AdminNewProduct() {
  const [, navigate] = useLocation();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch segments
  const { data: segmentsData } = trpc.segments.getAll.useQuery();

  const segments = useMemo(() => {
    if (segmentsData && segmentsData.length > 0) {
      return segmentsData;
    }
    return [];
  }, [segmentsData]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    calculationType: 'unidade',
    pricePerM2: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    imageUrl: '',
    selectedSegments: [] as string[],
  });

  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    name: '',
    description: '',
    daysMin: '',
    daysMax: '',
    priceMultiplier: '',
  });

  // Create product mutation
  const createProductMutation = trpc.admin.createProduct.useMutation({
    onSuccess: () => {
      showNotification('success', 'Produto criado com sucesso!');
      setTimeout(() => navigate('/admin'), 2000);
    },
    onError: (error: any) => {
      showNotification('error', `Erro ao criar produto: ${error.message}`);
    },
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculationTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, calculationType: value }));
  };

  const handleSegmentToggle = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSegments: prev.selectedSegments.includes(slug)
        ? prev.selectedSegments.filter(s => s !== slug)
        : [...prev.selectedSegments, slug],
    }));
  };

  const handleAddDelivery = () => {
    if (!newDelivery.name || !newDelivery.daysMin || !newDelivery.daysMax || !newDelivery.priceMultiplier) {
      showNotification('error', 'Preencha todos os campos do prazo');
      return;
    }

    setDeliveryOptions(prev => [...prev, {
      name: newDelivery.name,
      description: newDelivery.description,
      daysMin: parseInt(newDelivery.daysMin),
      daysMax: parseInt(newDelivery.daysMax),
      priceMultiplier: parseFloat(newDelivery.priceMultiplier),
    }]);

    setNewDelivery({ name: '', description: '', daysMin: '', daysMax: '', priceMultiplier: '' });
    setShowDeliveryForm(false);
  };

  const handleRemoveDelivery = (index: number) => {
    setDeliveryOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price) {
      showNotification('error', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.calculationType === 'm2' && !formData.pricePerM2) {
      showNotification('error', 'Preencha o preço por m²');
      return;
    }

    if (formData.calculationType === 'm2' && (!formData.minWidth || !formData.maxWidth || !formData.minHeight || !formData.maxHeight)) {
      showNotification('error', 'Preencha todas as dimensões');
      return;
    }

    if (formData.selectedSegments.length === 0) {
      showNotification('error', 'Selecione pelo menos um segmento');
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        segment: formData.selectedSegments[0] as 'alimentacao' | 'beleza' | 'varejo' | 'servicos',
        imageUrl: formData.imageUrl,
        calculationType: formData.calculationType === 'm2' ? 'm2' : 'unidade',
        pricePerM2: formData.calculationType === 'm2' ? formData.pricePerM2 : undefined,
        minWidth: formData.calculationType === 'm2' ? formData.minWidth : undefined,
        maxWidth: formData.calculationType === 'm2' ? formData.maxWidth : undefined,
        minHeight: formData.calculationType === 'm2' ? formData.minHeight : undefined,
        maxHeight: formData.calculationType === 'm2' ? formData.maxHeight : undefined,
      });
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Produto</h1>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <Input
              type="text"
              name="name"
              placeholder="Ex: Adesivo Brilho"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <Textarea
              name="description"
              placeholder="Descreva o produto"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
            <Input
              type="number"
              name="price"
              placeholder="0.00"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Tipo de Cobrança */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cobrança</label>
            <Select value={formData.calculationType} onValueChange={handleCalculationTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unidade">Unidade</SelectItem>
                <SelectItem value="m2">m² (Metro Quadrado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos condicionais para m² */}
          {formData.calculationType === 'm2' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço por m² (R$)</label>
                <Input
                  type="number"
                  name="pricePerM2"
                  placeholder="50.00"
                  step="0.01"
                  value={formData.pricePerM2}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Largura Mín (m)</label>
                  <Input
                    type="number"
                    name="minWidth"
                    placeholder="1.00"
                    step="0.01"
                    value={formData.minWidth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Largura Máx (m)</label>
                  <Input
                    type="number"
                    name="maxWidth"
                    placeholder="49.20"
                    step="0.01"
                    value={formData.maxWidth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Altura Mín (m)</label>
                  <Input
                    type="number"
                    name="minHeight"
                    placeholder="1.00"
                    step="0.01"
                    value={formData.minHeight}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Altura Máx (m)</label>
                  <Input
                    type="number"
                    name="maxHeight"
                    placeholder="5.99"
                    step="0.01"
                    value={formData.maxHeight}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Prazos de Produção */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Prazos de Produção</h3>
              <Button
                type="button"
                onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
              >
                <Plus size={18} /> Novo Prazo
              </Button>
            </div>

            {showDeliveryForm && (
              <Card className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <div className="space-y-4">
                  <Input
                    placeholder="Nome (ex: Prazo Normal)"
                    value={newDelivery.name}
                    onChange={(e) => setNewDelivery(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Descrição"
                    value={newDelivery.description}
                    onChange={(e) => setNewDelivery(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Dias Mín"
                      value={newDelivery.daysMin}
                      onChange={(e) => setNewDelivery(prev => ({ ...prev, daysMin: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Dias Máx"
                      value={newDelivery.daysMax}
                      onChange={(e) => setNewDelivery(prev => ({ ...prev, daysMax: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Preço/m²"
                      step="0.01"
                      value={newDelivery.priceMultiplier}
                      onChange={(e) => setNewDelivery(prev => ({ ...prev, priceMultiplier: e.target.value }))}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddDelivery}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Adicionar Prazo
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {deliveryOptions.map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-gray-400 text-xl">⋮⋮</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{option.name}</p>
                        <p className="text-sm text-gray-600">{option.daysMin} dias úteis • R$ {parseFloat(String(option.priceMultiplier)).toFixed(2)}/m²</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✏️
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveDelivery(index)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Segmentos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Segmentos</label>
            <Card className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {segments.map((segment: SegmentOption) => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => handleSegmentToggle(segment.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-colors ${
                      formData.selectedSegments.includes(segment.slug)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{segment.icon || '📦'}</span>
                      <span className="font-medium">{segment.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* URL da Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem</label>
            <Input
              type="url"
              name="imageUrl"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={handleInputChange}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            disabled={createProductMutation.isPending}
          >
            {createProductMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </div>
    </div>
  );
}
