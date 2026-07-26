import type { Category, CustomizationGroup, Product } from "@/types";

export const categories: Category[] = [
  { id: "destaques", name: "Destaques" },
  { id: "hamburgueres", name: "Hambúrgueres" },
  { id: "acompanhamentos", name: "Acompanhamentos" },
  { id: "bebidas", name: "Bebidas" },
  { id: "sobremesas", name: "Sobremesas" },
];

const burgerGroups: CustomizationGroup[] = [
  {
    id: "ponto",
    name: "Ponto da carne",
    min: 1,
    max: 1,
    required: true,
    options: [
      { id: "malpassado", name: "Mal passado", priceDelta: 0 },
      { id: "aoponto", name: "Ao ponto", priceDelta: 0 },
      { id: "bempassado", name: "Bem passado", priceDelta: 0 },
    ],
  },
  {
    id: "adicionais",
    name: "Adicionais (até 3)",
    min: 0,
    max: 3,
    options: [
      { id: "bacon", name: "Bacon crocante", priceDelta: 4.5 },
      { id: "cheddar", name: "Cheddar extra", priceDelta: 3.5 },
      { id: "ovo", name: "Ovo", priceDelta: 2.5 },
      { id: "cebola", name: "Cebola caramelizada", priceDelta: 3 },
      { id: "picles", name: "Picles", priceDelta: 1.5 },
    ],
  },
];

const drinkSize: CustomizationGroup[] = [
  {
    id: "tamanho",
    name: "Tamanho",
    min: 1,
    max: 1,
    required: true,
    options: [
      { id: "300", name: "300 ml", priceDelta: 0 },
      { id: "500", name: "500 ml", priceDelta: 2 },
      { id: "700", name: "700 ml", priceDelta: 4 },
    ],
  },
];

export const products: Product[] = [
  {
    id: "p_azul",
    categoryId: "destaques",
    name: "Burger Azul da Casa",
    description:
      "180g de blend bovino, queijo prato, cebola caramelizada, molho da casa e pão brioche.",
    price: 34.9,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
    badges: ["popular"],
    customizations: burgerGroups,
  },
  {
    id: "p_duplo",
    categoryId: "destaques",
    name: "Duplo Cheddar",
    description: "Dois blends 120g, cheddar cremoso duplo, bacon e cebola crispy.",
    price: 39.9,
    originalPrice: 44.9,
    image:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop",
    badges: ["promo"],
    customizations: burgerGroups,
  },
  {
    id: "p_classic",
    categoryId: "hamburgueres",
    name: "Classic Burger",
    description: "Blend 150g, queijo prato, alface, tomate e maionese da casa.",
    price: 26.9,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=600&fit=crop",
    customizations: burgerGroups,
  },
  {
    id: "p_bacon",
    categoryId: "hamburgueres",
    name: "Bacon Lover",
    description: "Blend 150g, cheddar, bacon crocante em dobro e barbecue defumado.",
    price: 32.9,
    image:
      "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800&h=600&fit=crop",
    customizations: burgerGroups,
  },
  {
    id: "p_veggie",
    categoryId: "hamburgueres",
    name: "Veggie Grelhado",
    description: "Hambúrguer de grão-de-bico e beterraba, queijo coalho e rúcula.",
    price: 28.9,
    image:
      "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&h=600&fit=crop",
    customizations: burgerGroups,
  },
  {
    id: "p_fritas",
    categoryId: "acompanhamentos",
    name: "Fritas Rústicas",
    description: "Porção generosa de batatas rústicas com sal grosso e alecrim.",
    price: 18.9,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=600&fit=crop",
  },
  {
    id: "p_onion",
    categoryId: "acompanhamentos",
    name: "Onion Rings",
    description: "Anéis de cebola empanados servidos com molho da casa.",
    price: 19.9,
    image:
      "https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&h=600&fit=crop",
  },
  {
    id: "p_nuggets",
    categoryId: "acompanhamentos",
    name: "Nuggets 8un.",
    description: "8 unidades de nuggets crocantes com molho barbecue.",
    price: 22.9,
    available: false,
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop",
  },
  {
    id: "p_coca",
    categoryId: "bebidas",
    name: "Coca-Cola",
    description: "Refrigerante gelado servido em copo.",
    price: 7.9,
    image:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop",
    customizations: drinkSize,
  },
  {
    id: "p_suco",
    categoryId: "bebidas",
    name: "Suco Natural de Laranja",
    description: "Feito na hora com laranjas selecionadas.",
    price: 9.9,
    image:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&h=600&fit=crop",
    customizations: drinkSize,
  },
  {
    id: "p_agua",
    categoryId: "bebidas",
    name: "Água Mineral",
    description: "Sem gás, 500ml.",
    price: 4.9,
    image:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop",
  },
  {
    id: "p_brownie",
    categoryId: "sobremesas",
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate 70% quente com bola de sorvete de creme.",
    price: 16.9,
    badges: ["popular"],
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=600&fit=crop",
  },
  {
    id: "p_pudim",
    categoryId: "sobremesas",
    name: "Pudim de Leite",
    description: "Fatia generosa com calda de caramelo caseira.",
    price: 12.9,
    image:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&h=600&fit=crop",
  },
];

export const productById = (id: string) => products.find((p) => p.id === id);
export const productsByCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId);
