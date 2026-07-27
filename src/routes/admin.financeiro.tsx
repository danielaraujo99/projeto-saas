import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AP, AR, REVENUE_7D } from "@/lib/admin/mock-data";
import { SmoothArea } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const [tab, setTab] = React.useState<"visao" | "ap" | "ar" | "fluxo">("visao");
  const [openNew, setOpenNew] = React.useState<null | "ap" | "ar">(null);
  const [del, setDel] = React.useState<string | null>(null);

  const totalAp = AP.filter((a) => a.status === "aberto").reduce((s, a) => s + a.value, 0);
  const totalAr = AR.filter((a) => a.status === "aberto").reduce((s, a) => s + a.value, 0);

  return (
    <AdminShell title="Financeiro">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
            <p className="text-sm text-slate-500">Visão geral, contas e fluxo de caixa.</p>
          </div>
        </div>

        <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
          {(["visao", "ap", "ar", "fluxo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "visao" ? "Visão geral" : t === "ap" ? "A pagar" : t === "ar" ? "A receber" : "Fluxo de caixa"}
            </button>
          ))}
        </div>

        {tab === "visao" && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Kpi label="Faturamento" value="R$ 8.652,50" color="emerald" />
              <Kpi label="Despesas" value="R$ 3.489,00" color="rose" />
              <Kpi label="A receber" value={`R$ ${totalAr.toFixed(2)}`} color="blue" />
              <Kpi label="A pagar" value={`R$ ${totalAp.toFixed(2)}`} color="amber" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Faturamento — últimos 7 dias</div>
              <div className="mt-3">
                <SmoothArea
                  data={REVENUE_7D.map((r) => ({ x: r.date, y: r.value }))}
                  color="#10b981"
                  yFormatter={(v) => `R$ ${v.toLocaleString("pt-BR")}`}
                />
              </div>
            </div>
          </div>
        )}

        {(tab === "ap" || tab === "ar") && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div className="text-sm font-semibold text-slate-900">
                {tab === "ap" ? "Contas a pagar" : "Contas a receber"}
              </div>
              <Button size="sm" onClick={() => setOpenNew(tab)}>
                <Plus className="h-4 w-4" /> Nova conta
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tab === "ap" ? AP : AR).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.desc}</td>
                    <td className="px-4 py-3 text-slate-600">{r.due}</td>
                    <td className="px-4 py-3 font-semibold">R$ {r.value.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          r.status === "pago"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => setDel(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "fluxo" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Fluxo de caixa — 7 dias</div>
            <div className="mt-3">
              <SmoothArea
                data={REVENUE_7D.map((r) => ({ x: r.date, y: r.value - 400 - Math.random() * 200 }))}
                color="#3b82f6"
                yFormatter={(v) => `R$ ${v.toFixed(0)}`}
              />
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Dia</th>
                  <th className="py-2 text-right">Entradas</th>
                  <th className="py-2 text-right">Saídas</th>
                  <th className="py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {REVENUE_7D.map((r) => (
                  <tr key={r.date}>
                    <td className="py-2.5 text-slate-700">{r.date}</td>
                    <td className="py-2.5 text-right text-emerald-600">
                      + R$ {r.value.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right text-rose-600">
                      − R$ {(r.value * 0.35).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      R$ {(r.value * 0.65).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!openNew} onOpenChange={(v) => !v && setOpenNew(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openNew === "ap" ? "Nova conta a pagar" : "Nova conta a receber"}</DialogTitle>
            <DialogDescription>Registre um lançamento financeiro.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Descrição" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Valor" />
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(null)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Lançamento salvo"); setOpenNew(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Excluído"); setDel(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      <div className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${map[color]}`}>
        últimos 7 dias
      </div>
    </div>
  );
}
