import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Briefcase, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { useAddresses } from "@/store/addresses";
import { EmptyState } from "@/components/empty-state";
import type { AddressKind } from "@/types";

export const Route = createFileRoute("/enderecos")({
  head: () => ({
    meta: [
      { title: "Meus endereços — Bistrô Azul" },
      { name: "description", content: "Gerencie seus endereços de entrega." },
      { property: "og:title", content: "Meus endereços — Bistrô Azul" },
      { property: "og:description", content: "Gerencie seus endereços de entrega." },
    ],
  }),
  component: Page,
});

const kindIcon = (k: AddressKind) => {
  const cls = "h-5 w-5";
  if (k === "home") return <Home className={cls} />;
  if (k === "work") return <Briefcase className={cls} />;
  return <MapPin className={cls} />;
};

const kindLabel: Record<AddressKind, string> = {
  home: "Casa",
  work: "Trabalho",
  other: "Outro",
};

function Page() {
  const list = useAddresses((s) => s.addresses);
  const remove = useAddresses((s) => s.remove);
  const setDefault = useAddresses((s) => s.setDefault);
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/checkout"
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Meus endereços</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <button
          onClick={() => nav({ to: "/enderecos/novo" })}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-4 text-left text-sm font-medium text-primary hover:border-primary"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft">
            <Plus className="h-5 w-5" />
          </div>
          Adicionar novo endereço
        </button>

        {list.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="Nenhum endereço salvo"
            description="Cadastre um endereço para agilizar seus pedidos."
          />
        ) : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  {kindIcon(a.kind)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{a.label || kindLabel[a.kind]}</span>
                    {a.isDefault ? (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Padrão
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm text-foreground">
                    {a.street}, {a.number}
                    {a.complement ? ` — ${a.complement}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.neighborhood} · {a.city}/{a.state}
                  </div>
                  {a.reference ? (
                    <div className="mt-1 text-xs italic text-muted-foreground">
                      Referência: {a.reference}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!a.isDefault ? (
                    <button
                      onClick={() => setDefault(a.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
                      title="Marcar como padrão"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => remove(a.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-destructive"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
