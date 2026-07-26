import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = { id: string; name: string; email?: string; phone?: string };

type AuthState = {
  user: AuthUser | null;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (data: { name: string; identifier: string; password: string }) => Promise<{
    ok: boolean;
    message?: string;
  }>;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (identifier, password) => {
        await new Promise((r) => setTimeout(r, 500));
        if (!identifier || password.length < 4)
          return { ok: false, message: "Verifique suas credenciais." };
        set({
          user: {
            id: crypto.randomUUID(),
            name: identifier.split("@")[0] || "Cliente",
            email: identifier.includes("@") ? identifier : undefined,
            phone: identifier.includes("@") ? undefined : identifier,
          },
        });
        return { ok: true };
      },
      signup: async ({ name, identifier, password }) => {
        await new Promise((r) => setTimeout(r, 600));
        if (!name.trim()) return { ok: false, message: "Informe seu nome completo." };
        if (!identifier) return { ok: false, message: "Informe telefone ou e-mail." };
        if (password.length < 6)
          return { ok: false, message: "A senha deve ter ao menos 6 caracteres." };
        set({
          user: {
            id: crypto.randomUUID(),
            name,
            email: identifier.includes("@") ? identifier : undefined,
            phone: identifier.includes("@") ? undefined : identifier,
          },
        });
        return { ok: true };
      },
      logout: () => set({ user: null }),
    }),
    { name: "bistro-auth" },
  ),
);
