import type { Restaurant } from "@/types";

// ID do Restaurante Demo como primeiro tenant no banco (registrado na migração).
export const BISTRO_AZUL_ID = "11111111-1111-1111-1111-111111111111";
export const BISTRO_AZUL_SLUG = "demo";

export const restaurant: Restaurant = {
  id: BISTRO_AZUL_ID,
  name: "Restaurante Demo",
  tagline: "Hambúrgueres artesanais e pratos rápidos",
  logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop",
  cover:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1600&h=600&fit=crop",
  rating: 4.8,
  reviewsCount: 1284,
  deliveryMinutes: [30, 45],
  deliveryFee: 6.9,
  minimumOrder: 20,
  isOpen: true,
  categoriesLabel: "Hambúrgueres • Lanches",
  distanceKm: 1.4,
  pickupAddress: {
    street: "Rua das Palmeiras",
    number: "245",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    reference: "Em frente à praça, fachada azul",
  },
};
