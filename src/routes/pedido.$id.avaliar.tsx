import * as React from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { useOrders } from "@/store/orders";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedido/$id/avaliar")({
  head: () => ({
    meta: [
      { title: "Avaliar pedido — Bistrô Azul" },
      { name: "description", content: "Deixe sua avaliação sobre o pedido." },
      { property: "og:title", content: "Avaliar pedido — Bistrô Azul" },
      { property: "og:description", content: "Deixe sua avaliação sobre o pedido." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = useParams({ from: "/pedido/$id/avaliar" });
  const rate = useOrders((s) => s.rate);
  const nav = useNavigate();
  const [food, setFood] = React.useState(0);
  const [delivery, setDelivery] = React.useState(0);
  const [note, setNote] = React.useState("");

  const submit = () => {
    if (food === 0) return toast.error("Avalie a comida com pelo menos 1 estrela.");
    rate(id);
    toast.success("Obrigado pela sua avaliação!");
    nav({ to: "/pedido/$id", params: { id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/pedido/$id"
            params={{ id }}
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Avaliar pedido</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Sua opinião ajuda o restaurante a melhorar.
        </p>

        <Section title="Como foi a comida?">
          <Stars value={food} onChange={setFood} />
        </Section>
        <Section title="Como foi a entrega?">
          <Stars value={delivery} onChange={setDelivery} />
        </Section>

        <Section title="Deixe um comentário (opcional)">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Conte um pouco sobre sua experiência…"
          />
        </Section>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="h-12 flex-1 rounded-full"
            onClick={() => nav({ to: "/pedido/$id", params: { id } })}
          >
            Pular
          </Button>
          <Button
            className="h-12 flex-1 rounded-full text-base font-semibold"
            onClick={submit}
          >
            Enviar avaliação
          </Button>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              n <= value ? "fill-warning text-warning" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
