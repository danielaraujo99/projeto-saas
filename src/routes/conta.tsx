import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, CreditCard, LogOut, MapPin, Trash2, User2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useAddresses } from "@/store/addresses";
import { useCards } from "@/store/cards";
import { AuthGate } from "@/components/auth-gate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Bistrô Azul" },
      { name: "description", content: "Dados pessoais, endereços e formas de pagamento salvas." },
      { property: "og:title", content: "Minha conta — Bistrô Azul" },
      { property: "og:description", content: "Dados pessoais, endereços e formas de pagamento salvas." },
    ],
  }),
  component: Page,
});

function Page() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const addresses = useAddresses((s) => s.addresses);
  const cards = useCards((s) => s.cards);
  const removeCard = useCards((s) => s.remove);
  const nav = useNavigate();
  const [authOpen, setAuthOpen] = React.useState(!user);
  const [pendingRemove, setPendingRemove] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthOpen(!user);
  }, [user]);

  const removingCard = pendingRemove ? cards.find((c) => c.id === pendingRemove) : null;


  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur md:static md:border-0">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold">Conta</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:px-6">
        {/* Profile */}
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
            <User2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-foreground">
              {user?.name ?? "Entre na sua conta"}
            </div>
            <div className="truncate text-xs text-foreground/60">
              {user?.email ?? user?.phone ?? "Acesse para salvar endereços e pedidos"}
            </div>
          </div>
        </section>

        <Row
          icon={<MapPin className="h-5 w-5" />}
          title="Endereços salvos"
          hint={`${addresses.length} ${addresses.length === 1 ? "endereço" : "endereços"}`}
          to="/enderecos"
        />

        <SectionCard title="Formas de pagamento salvas">
          {cards.length === 0 ? (
            <div className="px-5 py-6 text-sm text-foreground/55">
              Você ainda não tem cartões salvos. Adicione durante o checkout.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {cards.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {c.brand} •••• {c.last4}
                    </div>
                    <div className="text-[11px] uppercase text-foreground/50">
                      {c.kind === "credit" ? "Crédito" : "Débito"} · {c.holder}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingRemove(c.id)}
                    aria-label={`Remover cartão final ${c.last4}`}
                    className="grid h-9 w-9 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>


        {user ? (
          <button
            onClick={() => {
              logout();
              toast.success("Sessão encerrada");
              nav({ to: "/" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold text-destructive shadow-[var(--shadow-card)]"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        ) : null}
      </main>

      <AuthGate
        open={authOpen}
        onOpenChange={(o) => {
          setAuthOpen(o);
          if (!o && !user) nav({ to: "/" });
        }}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-5 py-3 text-sm font-semibold text-foreground">
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({
  icon,
  title,
  hint,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {hint ? <div className="text-xs text-foreground/55">{hint}</div> : null}
      </div>
      <ChevronRight className="h-4 w-4 text-foreground/40" />
    </Link>
  );
}
