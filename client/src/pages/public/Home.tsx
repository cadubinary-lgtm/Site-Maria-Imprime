import { useAdminAuth } from "@/_core/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Zap, Truck, Palette, Headphones, Star } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const SEGMENTS = [
  { name: "Alimentação", icon: "🍔", key: "alimentacao" },
  { name: "Beleza & Saúde", icon: "💄", key: "beleza" },
  { name: "Varejo", icon: "🛍️", key: "varejo" },
  { name: "Serviços", icon: "🔧", key: "servicos" },
];

const STEPS = [
  {
    number: 1,
    title: "Escolha seu segmento",
    description: "Encontre a solução perfeita para seu tipo de negócio entre nossas diversas categorias de produtos",
  },
  {
    number: 2,
    title: "Veja os produtos ideais",
    description: "Personalize conforme suas necessidades, escolha tamanhos, cores, acabamentos e quantidades",
  },
  {
    number: 3,
    title: "Solicite um orçamento",
    description: "Faça seu pedido e receba uma cotação personalizada. Após confirmação, iniciamos a produção",
  },
];

const DIFFERENTIALS = [
  {
    icon: Zap,
    title: "Produção Própria",
    description: "Mais controle, qualidade e agilidade na entrega dos seus produtos",
  },
  {
    icon: Truck,
    title: "Entrega Rápida",
    description: "Enviamos para todo o Brasil com prazos que você define",
  },
  {
    icon: Palette,
    title: "Personalização Total",
    description: "Customize cores, tamanhos, acabamentos e mais conforme sua necessidade",
  },
  {
    icon: Headphones,
    title: "Atendimento Consultivo",
    description: "Equipe especializada pronta para ajudar no seu projeto",
  },
];

const TESTIMONIALS = [
  {
    name: "Inova Epis",
    text: "Recomendamos, materiais de ótima qualidade e sempre muito pontuais nas entregas.",
    source: "Google",
  },
  {
    name: "Baristo Café",
    text: "O produto chegou com cores vibrantes e extremamente precisas, mantendo total fidelidade ao design original. A qualidade de impressão é impecável.",
    source: "Google",
  },
  {
    name: "Mercado Skate Shop",
    text: "Ótimo atendimento, material de qualidade, entrega antes do prazo, acompanhamento da solicitação e todo processo até o rastreamento do pedido por e-mail.",
    source: "Google",
  },
];

function FeaturedProductsSection() {
  const { data: products, isLoading } = trpc.products.getAll.useQuery();

  if (isLoading) {
    return (
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </section>
    );
  }

  // Pega 6 produtos aleatórios
  const featured = products?.slice(0, 6) || [];

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center">Produtos em Destaque</h2>
        <p className="text-center text-gray-600 mb-12">Qualidade e personalização para valorizar sua marca</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product: any) => (
            <Link key={product.id} href={`/catalogo?segment=${product.segment}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">
                    {product.segment === "varejo" && "📦"}
                    {product.segment === "servicos" && "🔧"}
                    {product.segment === "alimentacao" && "🍔"}
                    {product.segment === "beleza" && "💄"}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                  <p className="text-lg font-bold text-orange-500">R$ {parseFloat(product.price).toFixed(2)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/todos-produtos">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
              Ver Todos os Produtos →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  // useAdminAuth não bloqueia renderização da página pública
  const { isAuthenticated } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4 relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)"
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Soluções gráficas para o seu tipo de negócio
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Atendemos diversos segmentos com produtos personalizados que viralizam sua marca e impulsionam suas vendas.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/catalogo">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                    VER SEGMENTOS →
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10">
                  💬 FALAR NO WHATSAPP
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-8 shadow-2xl">
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-gray-700 font-semibold">Produtos Personalizados</p>
                  <p className="text-gray-500 text-sm mt-2">Qualidade e entrega rápida</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Solutions */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Soluções Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "⚡", title: "Produção própria com controle de qualidade" },
              { icon: "👥", title: "Atendimento consultivo especializado" },
              { icon: "🎨", title: "Personalização total dos seus produtos" },
              { icon: "🚚", title: "Entrega rápida em todo o Brasil" },
            ].map((item, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Segments Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Escolha seu Segmento</h2>
          <p className="text-center text-gray-600 mb-12">Clique no segmento para ver os pacotes disponíveis</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SEGMENTS.map((segment) => (
              <Link key={segment.name} href={`/catalogo?segment=${segment.key}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <CardContent className="pt-8 text-center">
                    <div className="text-5xl mb-4">{segment.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900">{segment.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Como Funciona</h2>
          <p className="text-center text-gray-600 mb-12">É simples, rápido e eficiente</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProductsSection />

      {/* Differentials */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Nossos Diferenciais</h2>
          <p className="text-center text-gray-600 mb-12">Por que escolher a nossa gráfica?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFFERENTIALS.map((diff, idx) => {
              const Icon = diff.icon;
              return (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <Icon className="w-10 h-10 text-orange-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{diff.title}</h3>
                    <p className="text-sm text-gray-600">{diff.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-orange-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-3xl font-bold">Mais de 130.000 clientes em todo o Brasil</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">O que nossos clientes dizem</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">Comentário do {testimonial.source}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-lg text-gray-300 mb-8">Explore nosso catálogo e encontre a solução perfeita para seu negócio</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/catalogo">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white">
                Ver Catálogo
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Fazer Login
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
