export type CustomizationOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type CustomizationGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  required?: boolean;
  options: CustomizationOption[];
};

export type ProductBadge = "popular" | "promo" | "out";

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  badges?: ProductBadge[];
  available?: boolean;
  customizations?: CustomizationGroup[];
};

export type Category = {
  id: string;
  name: string;
};

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  cover: string;
  rating: number;
  reviewsCount: number;
  deliveryMinutes: [number, number];
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  categoriesLabel: string;
  distanceKm: number;
};

export type CartCustomization = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  image?: string;
  basePrice: number;
  quantity: number;
  note?: string;
  customizations: CartCustomization[];
  unitPrice: number;
};

export type Coupon = {
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minOrder?: number;
  description: string;
};

export type AddressKind = "home" | "work" | "other";

export type Address = {
  id: string;
  kind: AddressKind;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
};

export type PaymentMethod =
  | { kind: "pix" }
  | { kind: "cash"; change?: number }
  | { kind: "credit" | "debit"; cardId: string; brand: string; last4: string };

export type OrderStatus = "received" | "preparing" | "delivering" | "delivered";

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  address?: Address;
  pickup: boolean;
  payment: PaymentMethod;
  status: OrderStatus;
  etaMinutes: number;
  rated?: boolean;
};
