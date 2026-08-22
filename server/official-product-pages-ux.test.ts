import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const newProduct = readFileSync("client/src/pages/admin/AdminNewProduct.tsx", "utf8");
const products = readFileSync("client/src/pages/admin/AdminProducts.tsx", "utf8");
const deliveryOptions = readFileSync("client/src/components/products/DeliveryOptionsManager.tsx", "utf8");
const productDetail = readFileSync("client/src/pages/ecommerce/ProductDetail.tsx", "utf8");
const router = readFileSync("server/routers.ts", "utf8");

describe("páginas oficiais de produto", () => {
  it("normaliza e apresenta os preços do novo produto no formato brasileiro", () => {
    expect(newProduct).toContain('from "@/lib/product-price-input"');
    expect(newProduct).toContain("finalizeCreatePrice");
    expect(newProduct).toContain("normalizeProductPriceInput(createForm.pixPrice)");
    expect(newProduct).toContain('inputMode="decimal"');
    expect(newProduct).toContain('placeholder="0,00"');
  });

  it("usa o mesmo formato brasileiro na edição rápida de Todos os Produtos", () => {
    expect(products).toContain("setQuickPixPrice(formatProductPriceInput");
    expect(products).toContain("const normalizePrice = (value: string) => normalizeProductPriceInput(value);");
    expect(products).toContain("setQuickCardPrice(formatProductPriceInput(quickCardPrice))");
    expect(products).toContain('inputMode="decimal"');
  });

  it("formata os adicionais de prazo com vírgula e duas casas decimais", () => {
    expect(deliveryOptions).toContain("const [priceInput, setPriceInput] = useState(\"0,00\")");
    expect(deliveryOptions).toContain("parseProductPriceInput(nextValue)");
    expect(deliveryOptions).toContain("formatProductPriceInput(String(option.pricePerM2))");
  });

  it("aceita a sessão administrativa oficial para excluir produtos", () => {
    expect(router).toContain("deleteMultipleProducts: adminAnyProcedure");
    expect(router).toContain("deleteProduct: adminAnyProcedure");
  });

  it("não apresenta alegações técnicas genéricas que possam contrariar o material do produto", () => {
    expect(productDetail).not.toContain("PRODUCT_FEATURES");
    expect(productDetail).not.toContain("Material resistente ao sol e chuva");
    expect(productDetail).not.toContain("Alta resistência");
    expect(productDetail).not.toContain("Uso versátil");
    expect(productDetail).toContain("Ver especificações técnicas");
  });

  it("destaca a frase de dúvidas em rosa e preserva o acesso às especificações", () => {
    expect(productDetail).toContain('className="mb-1 text-sm font-semibold text-pink-600">Dúvidas sobre o produto?</p>');
    expect(productDetail).toContain("Ver especificações técnicas");
    expect(productDetail).toContain('<details className="group">');
  });
});
