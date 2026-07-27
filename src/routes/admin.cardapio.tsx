import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Plus, Tag, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: CardapioPage,
});

function CardapioPage() {
  return (
    <AdminShell title="Cardápio">
      <div className="px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Cardápio</h2>
            <p className="text-sm text-slate-500">Gerencie categorias e produtos.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Em breve.")}>
              <Tag className="h-4 w-4" /> Nova categoria
            </Button>
            <Button onClick={() => toast.info("Em breve.")}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </div>
        </div>

        <EmptyBlock
          icon={<UtensilsCrossed className="h-6 w-6" />}
          title="Sem itens cadastrados"
          hint="Adicione categorias e produtos para começar a receber pedidos."
        />
      </div>
    </AdminShell>
  );
}

function EmptyBlock({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600">{icon}</div>
      <div className="mt-3 text-sm font-semibold text-slate-800">{title}</div>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>
    </div>
  );
}
