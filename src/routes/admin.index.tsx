import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClipboardList, Plus, ChefHat, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel — Bistrô" },
      { name: "description", content: "Visão geral do seu restaurante." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-2 text-lg font-bold text-slate-900">
            Indicadores em breve
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Faturamento, ticket médio, produtos mais vendidos e horários de pico
            chegam na próxima fase.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <QuickCard
            to="/admin/pedidos"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Pedidos"
            desc="Acompanhe o Kanban de pedidos em tempo real."
          />
          <QuickCard
            to="/admin/pedidos/novo"
            icon={<Plus className="h-5 w-5" />}
            title="Adicionar pedido"
            desc="Registre um pedido feito por telefone ou WhatsApp."
          />
          <QuickCard
            to="/admin/cozinha"
            icon={<ChefHat className="h-5 w-5" />}
            title="Cozinha (KDS)"
            desc="Tela dedicada para o preparo dos pedidos."
          />
        </div>
      </div>
    </AdminShell>
  );
}

function QuickCard({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-bold text-slate-900 group-hover:text-primary">{title}</div>
      <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
