import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { COUPONS } from "@/lib/admin/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: CuponsPage,
});

function CuponsPage() {
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState<string | null>(null);
  return (
    <AdminShell title="Cupons e Promoções">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cupons e Promoções</h2>
            <p className="text-sm text-slate-500">Ofereça descontos para atrair e fidelizar clientes.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COUPONS.map((c) => (
            <div key={c.code} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <code className="truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-900">
                      {c.code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        toast.success("Copiado");
                      }}
                      className="shrink-0 text-slate-400 hover:text-slate-700"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-1.5 text-xl font-bold text-slate-900">
                    {c.type === "%" ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`}
                  </div>
                  <div className="text-[11px] text-slate-500">expira em {c.expires}</div>
                </div>
                <Switch defaultChecked={c.active} />
              </div>
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Uso</span>
                  <span className="tabular-nums">
                    {c.uses}/{c.limit}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.uses / c.limit) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 flex-1 px-2 text-xs" onClick={() => setOpen(true)}>
                  <Pencil className="h-3 w-3" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDel(c.code)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cupom</DialogTitle>
            <DialogDescription>Configure código, tipo e limites.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Código (ex.: PROMO10)" />
            <div className="grid grid-cols-2 gap-3">
              <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm">
                <option>Percentual (%)</option>
                <option>Valor fixo (R$)</option>
              </select>
              <Input type="number" placeholder="Valor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Limite de usos" />
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Cupom salvo"); setOpen(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom {del}?</AlertDialogTitle>
            <AlertDialogDescription>Clientes não poderão mais utilizá-lo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Cupom excluído"); setDel(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
