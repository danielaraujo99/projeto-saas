import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/custom-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveSheet } from "@/components/adaptive-sheet";
import {
  Eye,
  EyeOff,
  Loader2,
  Store,
  Check,
  AlertTriangle,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import cadastroBg from "@/assets/cadastro-bg.mp4.asset.json";

export const Route = createFileRoute("/admin/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta do restaurante — MenuAltas" },
      { name: "description", content: "Cadastre seu restaurante em minutos e comece a receber pedidos, organizar mesas e gerenciar o cardápio em um só painel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

const CATEGORIES = [
  { id: "hamburgueria", label: "Hamburgueria", emoji: "🍔" },
  { id: "pizzaria", label: "Pizzaria", emoji: "🍕" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "adega", label: "Adega", emoji: "🍷" },
  { id: "distribuidora", label: "Distribuidora", emoji: "🍺" },
  { id: "marmitas", label: "Marmitas", emoji: "🍱" },
  { id: "outros", label: "Outros", emoji: "🍽️" },
] as const;

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function passwordStrength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return { score: s, label: ["Fraca", "Fraca", "Média", "Boa", "Forte"][s] };
}

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; slug: string }
  | { kind: "taken"; slug: string }
  | { kind: "invalid" };

function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [restaurantName, setRestaurantName] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [show2, setShow2] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const strength = passwordStrength(password);

  // slug: auto-derived from name; user can edit
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [slugState, setSlugState] = React.useState<SlugState>({ kind: "idle" });

  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(restaurantName));
  }, [restaurantName, slugTouched]);

  // debounced availability check
  React.useEffect(() => {
    const clean = slugify(slug);
    if (!clean) {
      setSlugState(slug ? { kind: "invalid" } : { kind: "idle" });
      return;
    }
    setSlugState({ kind: "checking" });
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_slug_available", { _slug: clean });
      if (cancelled) return;
      if (error) {
        setSlugState({ kind: "idle" });
        return;
      }
      setSlugState(data ? { kind: "available", slug: clean } : { kind: "taken", slug: clean });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [slug]);

  const cleanSlug = slugify(slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category) {
      setError("Escolha a categoria do restaurante.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("As senhas não coincidem.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }
    if (!cleanSlug) {
      setError("Escolha um link público válido.");
      return;
    }
    if (slugState.kind === "taken") {
      setError("Este link já está em uso. Escolha outro.");
      return;
    }
    setBusy(true);

    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    if (signErr || !data.user) {
      setBusy(false);
      setError(
        signErr?.message === "User already registered"
          ? "Este e-mail já está cadastrado."
          : (signErr?.message ?? "Falha ao criar conta."),
      );
      return;
    }
    if (!data.session) {
      const s = await supabase.auth.signInWithPassword({ email, password });
      if (s.error) {
        setBusy(false);
        toast.info("Verifique seu e-mail para confirmar o cadastro antes de continuar.");
        nav({ to: "/admin/login", search: {} });
        return;
      }
    }

    const { error: rpcErr } = await supabase.rpc("create_restaurant_with_slug", {
      _name: restaurantName,
      _slug: cleanSlug,
      _category: category,
      _phone: phone,
    });
    setBusy(false);
    if (rpcErr) {
      if (rpcErr.message?.includes("slug_taken")) {
        setError("Este link foi ocupado enquanto você preenchia. Escolha outro.");
        setSlugState({ kind: "taken", slug: cleanSlug });
        return;
      }
      setError("Sua conta foi criada, mas não conseguimos criar o restaurante. Entre e tente novamente.");
      return;
    }
    toast.success(`Restaurante criado! Seu link: menualtas.com.br/${cleanSlug}`);
    nav({ to: "/admin", replace: true });
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={cadastroBg.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/45 to-black/70" aria-hidden />
        <div className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">MenuAltas</span>
        </div>
        <div className="relative max-w-md space-y-4">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/85 backdrop-blur">
            Setup em 3 minutos · sem cartão de crédito
          </span>
          <h2 className="text-4xl font-black leading-tight">
            A fatia sai quente. O pedido já caiu no KDS.
          </h2>
          <p className="text-white/85">
            Do primeiro clique ao primeiro pedido impresso na cozinha: monte o cardápio, ligue o delivery e abra as mesas hoje. Sem instalação, sem taxa por pedido, sem enrolação.
          </p>
          <ul className="space-y-2 text-white/85">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Cardápio digital com QR Code por mesa
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Impressão automática cozinha + balcão
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Fechamento de caixa em 1 clique
            </li>
          </ul>
        </div>
        <p className="relative text-sm text-white/60">© MenuAltas · Painel para restaurantes</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
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
              <Label>Categoria do restaurante</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                      )}
                    >
                      <span aria-hidden>{c.emoji}</span> {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Link público do cardápio</Label>
              <div className="flex items-stretch overflow-hidden rounded-md border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-200">
                <span className="grid place-items-center bg-slate-50 px-3 text-xs text-slate-500">
                  menualtas.com.br/
                </span>
                <input
                  id="slug"
                  className="flex-1 bg-white px-2 py-2 text-sm outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  placeholder="cantina-do-ze"
                />
                <span className="grid w-9 place-items-center bg-white pr-2">
                  {slugState.kind === "checking" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : slugState.kind === "available" ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : slugState.kind === "taken" || slugState.kind === "invalid" ? (
                    <X className="h-4 w-4 text-rose-600" />
                  ) : null}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {slugState.kind === "available" && (
                  <span className="text-emerald-600">Disponível — este será o endereço público do seu cardápio.</span>
                )}
                {slugState.kind === "taken" && (
                  <span className="text-rose-600">Já está em uso. Escolha outro para não conflitar com um restaurante existente.</span>
                )}
                {slugState.kind === "invalid" && (
                  <span className="text-rose-600">Use apenas letras, números e hífen.</span>
                )}
                {(slugState.kind === "idle" || slugState.kind === "checking") && (
                  <>Gerado a partir do nome. Você pode editar antes de criar a conta.</>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
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
                  aria-label={show ? "Ocultar" : "Mostrar"}
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

            <div className="space-y-1.5">
              <Label htmlFor="password2">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="password2"
                  type={show2 ? "text" : "password"}
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShow2((s) => !s)}
                  aria-label={show2 ? "Ocultar" : "Mostrar"}
                >
                  {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password2 && password && password !== password2 ? (
                <p className="text-[11px] text-rose-600">As senhas não coincidem.</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Seu celular pessoal (WhatsApp) com DDD</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={16}
                required
              />
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Importante: use o SEU número pessoal, não o do restaurante.</p>
                  <p className="mt-0.5 text-amber-900/80">
                    Precisamos falar diretamente com quem contratou o MenuAltas — atualizações, suporte e cobranças vão para este WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Contas de caixa e cozinha não se cadastram por aqui — são convidadas pelo
              administrador dentro do painel, em Equipe e Permissões.
            </p>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button
              type="submit"
              className="h-11 w-full font-semibold"
              disabled={busy || slugState.kind === "taken" || slugState.kind === "checking"}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link to="/admin/login" search={{}} className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
