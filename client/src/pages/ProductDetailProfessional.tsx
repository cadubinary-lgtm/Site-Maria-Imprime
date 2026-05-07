import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetailProfessional() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: product, isLoading: productLoading } =
    trpc.products.getById.useQuery({ id: productId || 0 }, {
      enabled: !!productId,
    });

  const { data: variationTypes = [] } = trpc.variations.getByProduct.useQuery(
    { productId: productId || 0 },
    { enabled: !!productId }
  );

  // Extract material and finish options from variation types
  const materialType = variationTypes.find((v) => v.type === "material");
  const finishType = variationTypes.find((v) => v.type === "acabamento");
  const materials = materialType?.options || [];
  const finishes = finishType?.options || [];

  // Calculate price
  const calculatedPrice = useMemo(() => {
    if (!product) return 0;

    let price = parseFloat(product.price);

    // Add material price
    if (selectedMaterial) {
      const material = materials.find((m) => m.id === parseInt(selectedMaterial));
      if (material) {
        price += parseFloat(material.priceModifier || "0");
      }
    }

    // Add finish price
    if (selectedFinish) {
      const finish = finishes.find((f) => f.id === parseInt(selectedFinish));
      if (finish) {
        price += parseFloat(finish.priceModifier || "0");
      }
    }

    // Calculate by square meter if applicable
    if (product.allowCustomMeasures && product.pricePerSquareMeter && width && height) {
      const widthCm = parseFloat(width);
      const heightCm = parseFloat(height);
      const areaSqM = (widthCm * heightCm) / 10000;
      const sqMPrice = areaSqM * parseFloat(product.pricePerSquareMeter);
      return sqMPrice * quantity;
    }

    return price * quantity;
  }, [product, selectedMaterial, selectedFinish, width, height, quantity, materials, finishes]);

  const handleAddToCart = () => {
    if (!termsAccepted) {
      toast.error("Você precisa aceitar os termos antes de continuar");
      return;
    }

    if (product?.allowCustomMeasures && (!width || !height)) {
      toast.error("Por favor, informe as medidas do produto");
      return;
    }

    toast.success("Produto adicionado ao carrinho!");
    navigate("/confirmacao/1");
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Produto não encontrado</p>
          <Button onClick={() => navigate("/todos-produtos")}>
            Voltar para Produtos
          </Button>
        </div>
      </div>
    );
  }

  // Generate image gallery (using main image + placeholder variations)
  const images = [
    product.imageUrl || "/placeholder.png",
    product.imageUrl || "/placeholder.png",
    product.imageUrl || "/placeholder.png",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-4">
        <div className="container mx-auto">
          <button
            onClick={() => navigate("/todos-produtos")}
            className="text-orange-500 hover:text-orange-600 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Produtos
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {/* Main Image */}
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded border-2 overflow-hidden ${
                      idx === currentImageIndex
                        ? "border-orange-500"
                        : "border-gray-200"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Product Info */}
          <div className="lg:col-span-1">
            <div>
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded mb-4">
                {product.segment.toUpperCase()}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-lg mb-6">{product.description}</p>

              {/* Benefits */}
              {product.benefits && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Benefícios:</h3>
                  <ul className="text-gray-600 space-y-1">
                    {product.benefits.split("\n").map((benefit, idx) => (
                      <li key={idx}>✓ {benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Applications */}
              {product.applications && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Aplicações:</h3>
                  <p className="text-gray-600">{product.applications}</p>
                </div>
              )}

              {/* Technical Info */}
              {product.technicalInfo && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Ficha Técnica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-2">
                      {product.technicalInfo.split("\n").map((info, idx) => (
                        <p key={idx}>{info}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right: Configuration & Checkout */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6">
                {/* Price Display */}
                <div className="mb-6 pb-6 border-b">
                  <p className="text-gray-600 text-sm mb-2">Preço</p>
                  <div className="text-4xl font-bold text-orange-500">
                    R$ {calculatedPrice.toFixed(2)}
                  </div>
                </div>

                {/* Material Selection */}
                {materials.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Material
                    </label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} (+R${parseFloat(material.priceModifier || "0").toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedMaterial && (
                      <p className="text-xs text-gray-500 mt-2">
                        {materials.find((m) => m.id === parseInt(selectedMaterial))?.description || ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Finish Selection */}
                {finishes.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Acabamento
                    </label>
                    <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um acabamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishes.map((finish) => (
                          <SelectItem key={finish.id} value={finish.id.toString()}>
                            {finish.name} (+R${parseFloat(finish.priceModifier || "0").toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom Measures */}
                {product.allowCustomMeasures && (
                  <div className="mb-6 p-4 bg-blue-50 rounded">
                    <h4 className="font-bold text-gray-900 mb-3">Medidas Personalizadas</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Largura (cm)
                        </label>
                        <Input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="Ex: 100"
                          min={product.minWidth ? parseFloat(product.minWidth) : 0}
                          max={product.maxWidth ? parseFloat(product.maxWidth) : undefined}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Altura (cm)
                        </label>
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Ex: 50"
                          min={product.minHeight ? parseFloat(product.minHeight) : 0}
                          max={product.maxHeight ? parseFloat(product.maxHeight) : undefined}
                        />
                      </div>
                    </div>
                    {width && height && (
                      <div className="text-xs text-gray-600">
                        <p>Área: {((parseFloat(width) * parseFloat(height)) / 10000).toFixed(2)} m²</p>
                        <p>Preço/m²: R$ {parseFloat(product.pricePerSquareMeter || "0").toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                {/* Terms */}
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-xs text-gray-600">
                      Confirmo que enviarei arquivo em alta resolução (300 DPI), em modo CMYK, com margens de segurança de 5mm e que aceito os termos de checagem gratuita.
                    </span>
                  </label>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3"
                  size="lg"
                >
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
