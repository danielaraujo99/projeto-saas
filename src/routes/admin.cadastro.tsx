import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Store, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastrar restaurante — Bistrô Painel" },
      { name: "description", content: "Crie sua conta e comece a operar o painel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function passwordStrength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: s, label: ["Fraca", "Fraca", "Média", "Boa", "Forte"][s] };
}

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [restaurantName, setRestaurantName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const strength = passwordStrength(password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    if (error || !data.user) {
      setBusy(false);
      setError(error?.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : (error?.message ?? "Falha ao criar conta."));
      return;
    }

    // Se a confirmação de e-mail estiver ativa, session=null e não conseguimos criar o restaurante
    // pela RPC (exige auth.uid). Nesse caso, faz sign-in para prosseguir.
    if (!data.session) {
      const s = await supabase.auth.signInWithPassword({ email, password });
      if (s.error) {
        setBusy(false);
        toast.info("Verifique seu e-mail para confirmar o cadastro antes de continuar.");
        nav({ to: "/admin/login" });
        return;
      }
    }

    const { error: rpcErr } = await supabase.rpc(
      "create_restaurant_for_current_user",
      { _name: restaurantName },
    );
    setBusy(false);
    if (rpcErr) {
      setError("Sua conta foi criada, mas não conseguimos criar o restaurante. Entre e tente novamente.");
      return;
    }
    toast.success("Restaurante criado! Bem-vindo ao painel.");
    nav({ to: "/admin", replace: true });
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-blue-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">Bistrô Painel</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-black leading-tight">
            Comece a operar seu restaurante em minutos.
          </h2>
          <ul className="space-y-2 text-white/80">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Pedidos em tempo real
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Cozinha (KDS) dedicada
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Cardápio, cupons e financeiro
            </li>
          </ul>
        </div>
        <p className="text-sm text-white/60">© Bistrô · Painel para restaurantes</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-slate-900">Criar conta do restaurante</h1>
          <p className="mt-1 text-sm text-slate-500">
            Você entra como administrador. Convide caixa e cozinha depois, dentro do painel.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rname">Nome do restaurante</Label>
              <Input
                id="rname"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ex.: Cantina do Zé"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          i < strength.score
                            ? strength.score >= 3
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                            : "bg-slate-200",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">{strength.label}</span>
                </div>
              ) : null}
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Contas de caixa e cozinha não se cadastram por aqui — são convidadas pelo
              administrador dentro do painel, em Equipe e Permissões.
            </p>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" className="h-11 w-full font-semibold" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link to="/admin/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
