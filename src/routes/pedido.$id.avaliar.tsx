import * as React from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { rateOrder } from "@/lib/orders-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

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
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(true);
  const [food, setFood] = React.useState(0);
  const [delivery, setDelivery] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const close = () => {
    setOpen(false);
    // Wait for the closing animation before unmounting the route.
    setTimeout(() => nav({ to: "/pedido/$id", params: { id } }), 180);
  };

  const submit = async () => {
    if (food === 0) return toast.error("Avalie a comida com pelo menos 1 estrela.");
    setSaving(true);
    try {
      await rateOrder(id, { food, delivery, comment: note });
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Obrigado pela sua avaliação!");
      close();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível salvar. Verifique sua conexão e tente novamente.");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : setOpen(true))}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-bold">Avaliar pedido</DialogTitle>
          <DialogDescription>
            Sua opinião ajuda o restaurante a melhorar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
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
              rows={3}
              maxLength={280}
              placeholder="Conte um pouco sobre sua experiência…"
              className="resize-none rounded-2xl border-border bg-card text-sm leading-6"
            />
          </Section>
        </div>

        <div className="flex gap-2 border-t border-border bg-surface/40 px-6 py-4">
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-full"
            onClick={close}
            disabled={saving}
          >
            Pular
          </Button>
          <Button
            className="h-11 flex-1 rounded-full text-sm font-semibold"
            onClick={submit}
            disabled={saving}
          >
            {saving ? "Enviando…" : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-sm font-semibold text-foreground">{title}</h3>
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
          className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-surface"
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
