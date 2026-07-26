import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address } from "@/types";

type State = {
  addresses: Address[];
  selectedId?: string;
  add: (a: Omit<Address, "id">) => Address;
  update: (id: string, patch: Partial<Address>) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
  select: (id: string) => void;
};

export const useAddresses = create<State>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedId: undefined,
      add: (a) => {
        const id = crypto.randomUUID();
        const isFirst = get().addresses.length === 0;
        const address: Address = { ...a, id, isDefault: isFirst || a.isDefault };
        set((s) => ({
          addresses: [
            ...s.addresses.map((x) => (address.isDefault ? { ...x, isDefault: false } : x)),
            address,
          ],
          selectedId: address.isDefault ? id : s.selectedId ?? id,
        }));
        return address;
      },
      update: (id, patch) =>
        set((s) => ({
          addresses: s.addresses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      remove: (id) =>
        set((s) => ({
          addresses: s.addresses.filter((x) => x.id !== id),
          selectedId: s.selectedId === id ? undefined : s.selectedId,
        })),
      setDefault: (id) =>
        set((s) => ({
          addresses: s.addresses.map((x) => ({ ...x, isDefault: x.id === id })),
          selectedId: id,
        })),
      select: (id) => set({ selectedId: id }),
    }),
    { name: "bistro-addresses" },
  ),
);
