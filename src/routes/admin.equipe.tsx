import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { TEAM } from "@/lib/admin/mock-data";
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
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: EquipePage,
});

function EquipePage() {
  const [open, setOpen] = React.useState(false);
  const [del, setDel] = React.useState<string | null>(null);
  return (
    <AdminShell title="Equipe e Permissões">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Equipe e Permissões</h2>
            <p className="text-sm text-slate-500">Gerencie quem acessa o painel e o que pode fazer.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" /> Convidar membro
          </Button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Membro</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEAM.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {t.name.slice(0, 1)}
                    </span>
                    <span className="font-medium text-slate-800">{t.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                      {t.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        t.status === "ativo"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => setDel(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              Envie um convite por e-mail com o papel definido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Nome" />
            <Input type="email" placeholder="E-mail" />
            <select className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm">
              <option value="admin">Administrador</option>
              <option value="caixa">Caixa</option>
              <option value="cozinha">Cozinha</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Convite enviado"); setOpen(false); }}>Enviar convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              O membro perderá acesso ao painel imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Acesso removido"); setDel(null); }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
