import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { AdaptiveSheet } from "@/components/adaptive-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/auth";
import { LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess?: () => void;
};

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function AuthGate({ open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const login = useAuth((s) => s.login);
  const signup = useAuth((s) => s.signup);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "login"
        ? await login(email, password)
        : await signup({ name, email, phone: phone || undefined, password });
    setLoading(false);
    if (!res.ok) {
      setError(res.message ?? "Não foi possível continuar.");
      return;
    }
    toast.success(mode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!");
    onOpenChange(false);
    onSuccess ? onSuccess() : navigate({ to: "/checkout" });
  };

  return (
    <AdaptiveSheet open={open} onOpenChange={onOpenChange} title="Entrar" hideTitle>
      <div className="flex flex-col overflow-y-auto px-6 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === "login" ? "Entre para continuar" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Precisamos identificar você para finalizar o pedido.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-full bg-surface p-1 text-sm font-semibold">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={
                mode === m
                  ? "rounded-full bg-background py-2 text-foreground shadow-[var(--shadow-card)]"
                  : "rounded-full py-2 text-muted-foreground"
              }
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <Input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </div>
          {mode === "signup" ? (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Telefone <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                maxLength={16}
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            size="lg"
            className="mt-2 h-12 w-full rounded-full text-base font-semibold"
            disabled={loading}
          >
            <LogIn className="h-4 w-4" />
            {loading
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : "Criar conta e continuar"}
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Ao continuar você concorda com os Termos de uso e Política de privacidade.
          </p>
        </form>
      </div>
    </AdaptiveSheet>
  );
}
