import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = { id: string; name: string; email?: string; phone?: string };

type AuthState = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (email, password) => {
        if (!emailRe.test(email.trim()))
          return { ok: false, message: "Informe um e-mail válido." };
        if (password.length < 4)
          return { ok: false, message: "Senha inválida." };
        set({
          user: {
            id: crypto.randomUUID(),
            name: email.split("@")[0] || "Cliente",
            email: email.trim(),
          },
        });
        return { ok: true };
      },
      signup: async ({ name, email, phone, password }) => {
        if (!name.trim()) return { ok: false, message: "Informe seu nome completo." };
        if (!emailRe.test(email.trim()))
          return { ok: false, message: "Informe um e-mail válido." };
        if (phone && phone.replace(/\D/g, "").length < 10)
          return { ok: false, message: "Telefone inválido." };
        if (password.length < 6)
          return { ok: false, message: "A senha deve ter ao menos 6 caracteres." };
        set({
          user: {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || undefined,
          },
        });
        return { ok: true };
      },
      logout: () => set({ user: null }),
    }),
    { name: "bistro-auth" },
  ),
);

/** True once zustand finished reading the persisted session from storage. */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = React.useState(() => useAuth.persist.hasHydrated());
  React.useEffect(() => {
    if (hydrated) return;
    const unsubFinish = useAuth.persist.onFinishHydration(() => setHydrated(true));
    if (useAuth.persist.hasHydrated()) setHydrated(true);
    return unsubFinish;
  }, [hydrated]);
  return hydrated;
}
