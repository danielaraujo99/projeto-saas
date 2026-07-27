import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownCircle, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: EstoquePage,
});

function EstoquePage() {
  return (
    <AdminShell title="Estoque">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Estoque</h2>
            <p className="text-sm text-slate-500">Controle de insumos e movimentações.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Em breve.")}>
              <ArrowDownCircle className="h-4 w-4" /> Registrar entrada
            </Button>
            <Button onClick={() => toast.info("Em breve.")}>
              <Plus className="h-4 w-4" /> Novo item
            </Button>
          </div>
        </div>

        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Boxes className="h-6 w-6" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-800">Nenhum item em estoque</div>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Cadastre insumos para controlar entradas, saídas e alertas de baixo estoque.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
