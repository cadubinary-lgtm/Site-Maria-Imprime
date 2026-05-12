import { describe, it, expect, beforeEach } from "vitest";

/**
 * ========================================
 * TESTES DE PERSISTÊNCIA
 * ========================================
 * Validar:
 * ✓ salvamento correto;
 * ✓ recarregamento dos dados;
 * ✓ edição sem perda;
 * ✓ persistência dos atributos;
 * ✓ persistência dos segmentos;
 * ✓ persistência do carrinho;
 * ✓ persistência dos pedidos.
 */

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  isConfigurable: boolean;
  attributes: ProductAttribute[];
  segments: number[];
}

interface ProductAttribute {
  id: number;
  attributeId: number;
  isRequired: boolean;
  allowMultiple: boolean;
  values: AttributeValue[];
}

interface AttributeValue {
  id: number;
  value: string;
  priceModifier: number;
}

interface CartItem {
  productId: number;
  quantity: number;
  selectedAttributes: Map<number, any>;
  totalPrice: number;
  uploadedFiles: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  url: string;
}

interface Order {
  id: string;
  clientId: number;
  items: CartItem[];
  totalPrice: number;
  status: "pending" | "payment_confirmed" | "production" | "completed";
  uploadedFiles: UploadedFile[];
  createdAt: Date;
  updatedAt: Date;
}

// Simulação de banco de dados em memória
class InMemoryDatabase {
  private products: Map<number, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private carts: Map<number, CartItem[]> = new Map(); // userId -> cartItems
  private orderCounter: number = 0;

  // ========== PRODUTOS ==========
  saveProduct(product: Product): void {
    this.products.set(product.id, { ...product });
  }

  getProduct(productId: number): Product | undefined {
    const product = this.products.get(productId);
    return product ? { ...product } : undefined;
  }

  updateProduct(productId: number, updates: Partial<Product>): void {
    const product = this.products.get(productId);
    if (product) {
      this.products.set(productId, { ...product, ...updates });
    }
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values()).map((p) => ({ ...p }));
  }

  // ========== CARRINHO ==========
  saveCartItem(userId: number, item: CartItem): void {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, []);
    }
    const cart = this.carts.get(userId)!;
    const existingIndex = cart.findIndex((i) => i.productId === item.productId);
    if (existingIndex >= 0) {
      cart[existingIndex] = { ...item };
    } else {
      cart.push({ ...item });
    }
  }

  getCart(userId: number): CartItem[] {
    const cart = this.carts.get(userId);
    return cart ? cart.map((item) => ({ ...item })) : [];
  }

  clearCart(userId: number): void {
    this.carts.delete(userId);
  }

  // ========== PEDIDOS ==========
  saveOrder(order: Order): void {
    this.orders.set(order.id, { ...order });
  }

  getOrder(orderId: string): Order | undefined {
    const order = this.orders.get(orderId);
    return order ? { ...order } : undefined;
  }

  updateOrder(orderId: string, updates: Partial<Order>): void {
    const order = this.orders.get(orderId);
    if (order) {
      this.orders.set(orderId, { ...order, ...updates });
    }
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values()).map((o) => ({ ...o }));
  }

  generateOrderId(): string {
    return `ORD-${++this.orderCounter}`;
  }
}

describe("Persistence Layer", () => {
  let db: InMemoryDatabase;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  describe("Salvamento e Recarregamento de Produtos", () => {
    it("deve salvar produto corretamente", () => {
      const product: Product = {
        id: 1,
        name: "Cartão de Visita",
        price: 50,
        description: "Cartão profissional",
        isConfigurable: true,
        attributes: [
          {
            id: 1,
            attributeId: 1,
            isRequired: true,
            allowMultiple: false,
            values: [
              { id: 101, value: "Couchê 300g", priceModifier: 0 },
              { id: 102, value: "Supremo 250g", priceModifier: 10 },
            ],
          },
        ],
        segments: [1, 2],
      };

      db.saveProduct(product);
      const retrieved = db.getProduct(1);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Cartão de Visita");
      expect(retrieved?.attributes.length).toBe(1);
    });

    it("deve manter dados intactos após recarregamento", () => {
      const product: Product = {
        id: 1,
        name: "Banner",
        price: 100,
        description: "Banner grande",
        isConfigurable: true,
        attributes: [],
        segments: [3],
      };

      db.saveProduct(product);
      const retrieved = db.getProduct(1);

      expect(retrieved?.price).toBe(100);
      expect(retrieved?.description).toBe("Banner grande");
      expect(retrieved?.segments).toEqual([3]);
    });

    it("deve editar produto sem perda de dados", () => {
      const product: Product = {
        id: 1,
        name: "Cartão Original",
        price: 50,
        description: "Descrição original",
        isConfigurable: true,
        attributes: [],
        segments: [1],
      };

      db.saveProduct(product);
      db.updateProduct(1, { name: "Cartão Atualizado", price: 60 });

      const updated = db.getProduct(1);
      expect(updated?.name).toBe("Cartão Atualizado");
      expect(updated?.price).toBe(60);
      expect(updated?.description).toBe("Descrição original"); // Mantém dados não alterados
    });

    it("deve persistir múltiplos produtos", () => {
      const product1: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [],
        segments: [1],
      };

      const product2: Product = {
        id: 2,
        name: "Banner",
        price: 100,
        description: "",
        isConfigurable: true,
        attributes: [],
        segments: [2],
      };

      db.saveProduct(product1);
      db.saveProduct(product2);

      const all = db.getAllProducts();
      expect(all.length).toBe(2);
      expect(all.find((p) => p.id === 1)?.name).toBe("Cartão");
      expect(all.find((p) => p.id === 2)?.name).toBe("Banner");
    });
  });

  describe("Persistência de Atributos", () => {
    it("deve persistir atributos vinculados ao produto", () => {
      const product: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [
          {
            id: 1,
            attributeId: 1,
            isRequired: true,
            allowMultiple: false,
            values: [
              { id: 101, value: "Couchê 300g", priceModifier: 0 },
              { id: 102, value: "Supremo 250g", priceModifier: 10 },
            ],
          },
          {
            id: 2,
            attributeId: 2,
            isRequired: false,
            allowMultiple: true,
            values: [
              { id: 201, value: "Laminação Fosca", priceModifier: 15 },
              { id: 202, value: "Laminação Brilho", priceModifier: 20 },
            ],
          },
        ],
        segments: [1],
      };

      db.saveProduct(product);
      const retrieved = db.getProduct(1);

      expect(retrieved?.attributes.length).toBe(2);
      expect(retrieved?.attributes[0].isRequired).toBe(true);
      expect(retrieved?.attributes[1].allowMultiple).toBe(true);
      expect(retrieved?.attributes[0].values.length).toBe(2);
    });

    it("deve manter valores de atributos após recarregamento", () => {
      const product: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [
          {
            id: 1,
            attributeId: 1,
            isRequired: true,
            allowMultiple: false,
            values: [
              { id: 101, value: "Couchê 300g", priceModifier: 0 },
              { id: 102, value: "Supremo 250g", priceModifier: 10 },
            ],
          },
        ],
        segments: [1],
      };

      db.saveProduct(product);
      const retrieved = db.getProduct(1);

      const firstValue = retrieved?.attributes[0].values[0];
      expect(firstValue?.value).toBe("Couchê 300g");
      expect(firstValue?.priceModifier).toBe(0);
    });
  });

  describe("Persistência de Segmentos", () => {
    it("deve persistir múltiplos segmentos por produto", () => {
      const product: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [],
        segments: [1, 2, 3],
      };

      db.saveProduct(product);
      const retrieved = db.getProduct(1);

      expect(retrieved?.segments).toEqual([1, 2, 3]);
    });

    it("deve permitir editar segmentos sem perda", () => {
      const product: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [],
        segments: [1],
      };

      db.saveProduct(product);
      db.updateProduct(1, { segments: [1, 2, 3] });

      const updated = db.getProduct(1);
      expect(updated?.segments).toEqual([1, 2, 3]);
    });
  });

  describe("Persistência do Carrinho", () => {
    it("deve salvar item no carrinho", () => {
      const cartItem: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map([[1, 101]]),
        totalPrice: 100,
        uploadedFiles: [],
      };

      db.saveCartItem(1, cartItem);
      const cart = db.getCart(1);

      expect(cart.length).toBe(1);
      expect(cart[0].productId).toBe(1);
      expect(cart[0].quantity).toBe(1000);
    });

    it("deve manter múltiplos itens no carrinho", () => {
      const item1: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map(),
        totalPrice: 100,
        uploadedFiles: [],
      };

      const item2: CartItem = {
        productId: 2,
        quantity: 500,
        selectedAttributes: new Map(),
        totalPrice: 150,
        uploadedFiles: [],
      };

      db.saveCartItem(1, item1);
      db.saveCartItem(1, item2);

      const cart = db.getCart(1);
      expect(cart.length).toBe(2);
    });

    it("deve atualizar item existente no carrinho", () => {
      const item: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map(),
        totalPrice: 100,
        uploadedFiles: [],
      };

      db.saveCartItem(1, item);
      const updatedItem: CartItem = {
        productId: 1,
        quantity: 2000,
        selectedAttributes: new Map(),
        totalPrice: 200,
        uploadedFiles: [],
      };

      db.saveCartItem(1, updatedItem);

      const cart = db.getCart(1);
      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(2000);
      expect(cart[0].totalPrice).toBe(200);
    });

    it("deve limpar carrinho", () => {
      const item: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map(),
        totalPrice: 100,
        uploadedFiles: [],
      };

      db.saveCartItem(1, item);
      db.clearCart(1);

      const cart = db.getCart(1);
      expect(cart.length).toBe(0);
    });

    it("deve manter carrinho de usuários diferentes isolados", () => {
      const item1: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map(),
        totalPrice: 100,
        uploadedFiles: [],
      };

      const item2: CartItem = {
        productId: 2,
        quantity: 500,
        selectedAttributes: new Map(),
        totalPrice: 150,
        uploadedFiles: [],
      };

      db.saveCartItem(1, item1);
      db.saveCartItem(2, item2);

      const cart1 = db.getCart(1);
      const cart2 = db.getCart(2);

      expect(cart1.length).toBe(1);
      expect(cart2.length).toBe(1);
      expect(cart1[0].productId).toBe(1);
      expect(cart2[0].productId).toBe(2);
    });
  });

  describe("Persistência de Pedidos", () => {
    it("deve salvar pedido completo", () => {
      const order: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [
          {
            productId: 1,
            quantity: 1000,
            selectedAttributes: new Map([[1, 101]]),
            totalPrice: 100,
            uploadedFiles: [],
          },
        ],
        totalPrice: 100,
        status: "pending",
        uploadedFiles: [
          {
            id: "file1",
            name: "design.pdf",
            status: "approved",
            url: "https://storage.example.com/file1.pdf",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order);
      const retrieved = db.getOrder(order.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.clientId).toBe(1);
      expect(retrieved?.items.length).toBe(1);
      expect(retrieved?.uploadedFiles.length).toBe(1);
    });

    it("deve manter dados intactos após recarregamento de pedido", () => {
      const order: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [
          {
            productId: 1,
            quantity: 1000,
            selectedAttributes: new Map([[1, 101]]),
            totalPrice: 100,
            uploadedFiles: [],
          },
        ],
        totalPrice: 100,
        status: "pending",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order);
      const retrieved = db.getOrder(order.id);

      expect(retrieved?.totalPrice).toBe(100);
      expect(retrieved?.status).toBe("pending");
      expect(retrieved?.items[0].quantity).toBe(1000);
    });

    it("deve atualizar status do pedido sem perda de dados", () => {
      const order: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [
          {
            productId: 1,
            quantity: 1000,
            selectedAttributes: new Map(),
            totalPrice: 100,
            uploadedFiles: [],
          },
        ],
        totalPrice: 100,
        status: "pending",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order);
      db.updateOrder(order.id, { status: "payment_confirmed" });

      const updated = db.getOrder(order.id);
      expect(updated?.status).toBe("payment_confirmed");
      expect(updated?.totalPrice).toBe(100); // Mantém dados não alterados
      expect(updated?.items.length).toBe(1);
    });

    it("deve persistir histórico de pedidos", () => {
      const order1: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [],
        totalPrice: 100,
        status: "pending",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const order2: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [],
        totalPrice: 150,
        status: "pending",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order1);
      db.saveOrder(order2);

      const all = db.getAllOrders();
      expect(all.length).toBe(2);
    });

    it("deve manter atributos selecionados após reabertura de pedido", () => {
      const order: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [
          {
            productId: 1,
            quantity: 1000,
            selectedAttributes: new Map([[1, 101], [2, 201]]),
            totalPrice: 100,
            uploadedFiles: [],
          },
        ],
        totalPrice: 100,
        status: "completed",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order);
      const reopened = db.getOrder(order.id);

      expect(reopened?.items[0].selectedAttributes.get(1)).toBe(101);
      expect(reopened?.items[0].selectedAttributes.get(2)).toBe(201);
    });
  });

  describe("Fluxo Completo de Persistência", () => {
    it("deve manter dados do produto → carrinho → pedido", () => {
      // 1. Salvar produto
      const product: Product = {
        id: 1,
        name: "Cartão",
        price: 50,
        description: "",
        isConfigurable: true,
        attributes: [
          {
            id: 1,
            attributeId: 1,
            isRequired: true,
            allowMultiple: false,
            values: [{ id: 101, value: "Couchê 300g", priceModifier: 0 }],
          },
        ],
        segments: [1],
      };

      db.saveProduct(product);

      // 2. Adicionar ao carrinho
      const cartItem: CartItem = {
        productId: 1,
        quantity: 1000,
        selectedAttributes: new Map([[1, 101]]),
        totalPrice: 100,
        uploadedFiles: [],
      };

      db.saveCartItem(1, cartItem);

      // 3. Criar pedido
      const order: Order = {
        id: db.generateOrderId(),
        clientId: 1,
        items: [cartItem],
        totalPrice: 100,
        status: "pending",
        uploadedFiles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      db.saveOrder(order);

      // 4. Verificar integridade
      const retrievedProduct = db.getProduct(1);
      const retrievedCart = db.getCart(1);
      const retrievedOrder = db.getOrder(order.id);

      expect(retrievedProduct?.name).toBe("Cartão");
      expect(retrievedCart[0].productId).toBe(1);
      expect(retrievedOrder?.totalPrice).toBe(100);
    });
  });
});
