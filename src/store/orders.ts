import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/types";

type State = {
  orders: Record<string, Order>;
  create: (order: Omit<Order, "id" | "createdAt" | "status">) => Order;
  advance: (id: string, status: OrderStatus) => void;
  rate: (id: string) => void;
  get: (id: string) => Order | undefined;
};

const STATUS_ORDER: OrderStatus[] = ["received", "preparing", "delivering", "delivered"];

export const useOrders = create<State>()(
  persist(
    (set, get) => ({
      orders: {},
      create: (data) => {
        const id = "PED" + Math.floor(100000 + Math.random() * 900000);
        const order: Order = { ...data, id, createdAt: Date.now(), status: "received" };
        set((s) => ({ orders: { ...s.orders, [id]: order } }));
        // Advance status automatically over time (mock)
        STATUS_ORDER.slice(1).forEach((status, i) => {
          setTimeout(
            () => {
              const current = get().orders[id];
              if (!current) return;
              set((s) => ({ orders: { ...s.orders, [id]: { ...current, status } } }));
            },
            (i + 1) * 15000,
          );
        });
        return order;
      },
      advance: (id, status) =>
        set((s) => {
          const o = s.orders[id];
          if (!o) return s;
          return { orders: { ...s.orders, [id]: { ...o, status } } };
        }),
      rate: (id) =>
        set((s) => {
          const o = s.orders[id];
          if (!o) return s;
          return { orders: { ...s.orders, [id]: { ...o, rated: true } } };
        }),
      get: (id) => get().orders[id],
    }),
    { name: "bistro-orders" },
  ),
);

export const statusLabel: Record<OrderStatus, string> = {
  received: "Pedido recebido",
  preparing: "Em preparo",
  delivering: "Saiu para entrega",
  delivered: "Entregue",
};

export const STATUS_STEPS = STATUS_ORDER;
