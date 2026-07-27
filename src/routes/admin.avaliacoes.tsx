import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { REVIEWS } from "@/lib/admin/mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: AvaliacoesPage,
});

function AvaliacoesPage() {
  const [reply, setReply] = React.useState<(typeof REVIEWS)[number] | null>(null);
  const avg = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: REVIEWS.filter((r) => r.rating === s).length,
  }));

  return (
    <AdminShell title="Avaliações">
      <div className="px-4 py-6 sm:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Avaliações</h2>
        <p className="text-sm text-slate-500">Acompanhe o que os clientes acham do seu restaurante.</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <div className="text-5xl font-bold text-slate-900">{avg}</div>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i <= Math.round(+avg) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </div>
            <div className="mt-1 text-xs text-slate-500">{REVIEWS.length} avaliações</div>
            <div className="mt-4 space-y-1.5">
              {dist.map((d) => (
                <div key={d.stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-500">{d.stars}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(d.count / REVIEWS.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-600">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {REVIEWS.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{r.customer}</div>
                    <div className="mt-0.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{r.when}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{r.comment}</p>
                <div className="mt-3 flex items-center gap-2">
                  {r.replied ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Respondida
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReply(r)}>
                      Responder
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!reply} onOpenChange={(v) => !v && setReply(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder {reply?.customer}</DialogTitle>
            <DialogDescription>Uma resposta cordial fideliza o cliente.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} placeholder="Escreva sua resposta…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReply(null)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Resposta enviada"); setReply(null); }}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
