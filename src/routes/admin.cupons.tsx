import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Plus, Ticket } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: CuponsPage,
});

function CuponsPage() {
  return (
    <AdminShell title="Cupons e Promoções">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cupons e Promoções</h2>
            <p className="text-sm text-slate-500">Ofereça descontos para atrair e fidelizar clientes.</p>
          </div>
          <Button onClick={() => toast.info("Em breve.")}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        </div>

        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-800">Sem cupons ativos</div>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Crie cupons percentuais ou de valor fixo para clientes.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
