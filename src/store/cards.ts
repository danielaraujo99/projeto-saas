import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedCard = {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  kind: "credit" | "debit";
};

type CardsState = {
  cards: SavedCard[];
  add: (c: Omit<SavedCard, "id">) => SavedCard;
  remove: (id: string) => void;
};

export const useCards = create<CardsState>()(
  persist(
    (set, get) => ({
      cards: [],
      add: (c) => {
        const card: SavedCard = { ...c, id: crypto.randomUUID() };
        set({ cards: [card, ...get().cards] });
        return card;
      },
      remove: (id) => set({ cards: get().cards.filter((c) => c.id !== id) }),
    }),
    { name: "bistro-cards" },
  ),
);
