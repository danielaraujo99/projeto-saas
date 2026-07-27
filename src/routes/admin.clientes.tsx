import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CUSTOMERS } from "@/lib/admin/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<(typeof CUSTOMERS)[number] | null>(null);
  const list = CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell title="Clientes">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
            <p className="text-sm text-slate-500">Base de contatos e histórico de consumo.</p>
          </div>
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
          <Kpi label="Total de clientes" value="482" />
          <Kpi label="Novos no mês" value="34" />
          <Kpi label="Ticket médio" value="R$ 67,59" />
          <Kpi label="Recorrentes" value="61%" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Total gasto</th>
                <th className="px-4 py-3">Último</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {c.name.slice(0, 1)}
                    </span>
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 font-semibold">
                    R$ {c.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>Perfil e resumo de consumo.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" /> {selected.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" /> {selected.name.toLowerCase().replace(/\s/g, ".")}@email.com
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Kpi label="Pedidos" value={String(selected.orders)} small />
                <Kpi label="Gastos" value={`R$ ${selected.spent.toFixed(0)}`} small />
                <Kpi label="Último" value={selected.last} small />
              </div>
              <Button className="mt-2 w-full">Enviar promoção</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Kpi({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={small ? "mt-0.5 text-base font-bold" : "mt-1 text-xl font-bold text-slate-900"}>
        {value}
      </div>
    </div>
  );
}
