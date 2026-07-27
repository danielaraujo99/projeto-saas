import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { STOCK_ITEMS, STOCK_MOVEMENTS } from "@/lib/admin/mock-data";
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
import { Plus, ArrowDownCircle, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: EstoquePage,
});

function EstoquePage() {
  const [openItem, setOpenItem] = React.useState(false);
  const [openEntry, setOpenEntry] = React.useState(false);
  const low = STOCK_ITEMS.filter((i) => i.qty < i.min);

  return (
    <AdminShell title="Estoque">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Estoque</h2>
            <p className="text-sm text-slate-500">Controle de insumos e movimentações.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenEntry(true)}>
              <ArrowDownCircle className="h-4 w-4" /> Registrar entrada
            </Button>
            <Button onClick={() => setOpenItem(true)}>
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          </div>
        </div>

        {low.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div className="text-sm">
              <div className="font-semibold text-amber-900">
                {low.length} item(ns) abaixo do estoque mínimo
              </div>
              <div className="text-amber-800">
                {low.map((i) => i.name).join(", ")} — considere repor logo.
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 text-sm font-semibold text-slate-900">
              Itens em estoque
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Un.</th>
                    <th className="px-4 py-3">Qtd atual</th>
                    <th className="px-4 py-3">Mínimo</th>
                    <th className="px-4 py-3">Custo</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {STOCK_ITEMS.map((i) => {
                    const isLow = i.qty < i.min;
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-800">{i.name}</td>
                        <td className="px-4 py-3 text-slate-600">{i.unit}</td>
                        <td className="px-4 py-3">
                          <span className={isLow ? "font-semibold text-rose-600" : "text-slate-800"}>
                            {i.qty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{i.min}</td>
                        <td className="px-4 py-3">R$ {i.cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            onClick={() => setOpenItem(true)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Movimentações recentes</div>
            <ul className="mt-3 space-y-3">
              {STOCK_MOVEMENTS.map((m) => (
                <li key={m.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <span
                    className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                      m.type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {m.type === "entrada" ? "+" : "−"}
                  </span>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-800">{m.item}</div>
                    <div className="text-xs text-slate-500">
                      {m.qty} · {m.when} · {m.user}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Dialog open={openItem} onOpenChange={setOpenItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo item de estoque</DialogTitle>
            <DialogDescription>Cadastre um insumo controlado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Nome do item" />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Unidade (un, kg, L)" />
              <Input type="number" placeholder="Qtd inicial" />
              <Input type="number" placeholder="Mínimo" />
            </div>
            <Input type="number" placeholder="Custo unitário (R$)" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenItem(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Item cadastrado"); setOpenItem(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEntry} onOpenChange={setOpenEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar entrada de estoque</DialogTitle>
            <DialogDescription>Adicione uma compra recebida.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm">
              {STOCK_ITEMS.map((i) => <option key={i.id}>{i.name}</option>)}
            </select>
            <Input type="number" placeholder="Quantidade" />
            <Input placeholder="Observação (opcional)" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEntry(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Entrada registrada"); setOpenEntry(false); }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
