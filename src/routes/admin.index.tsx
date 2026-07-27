import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SmoothArea, Sparkline } from "@/components/admin/charts";
import {
  METRICS,
  REVENUE_7D,
  ORDER_STATUS_BREAKDOWN,
  HEATMAP,
  HEATMAP_COLS,
  HEATMAP_ROWS,
  TOP_PRODUCTS,
  PAYMENT_METHODS,
  COMPARISON,
} from "@/lib/admin/mock-data";
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  Receipt,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — MenuAltas" },
      { name: "description", content: "Visão geral do seu restaurante." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dollar: DollarSign,
  bag: ShoppingBag,
  receipt: Receipt,
  clock: Clock,
};

function DashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <div className="px-4 py-6 sm:px-8">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-500">Visão geral do seu restaurante</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-500" />
            15/05/2025 — 21/05/2025
          </button>
        </div>

        {/* Metric cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((m) => {
            const Icon = ICONS[m.icon];
            const positive = m.inverse ? m.delta < 0 : m.delta > 0;
            const sparkData = m.spark.map((p) => ({ i: p.i, v: p.v }));
            return (
              <div
                key={m.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">{m.label}</div>
                    <div className="mt-1.5 text-2xl font-bold text-slate-900">{m.value}</div>
                  </div>
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl ${m.tint}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {positive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                  )}
                  <span
                    className={positive ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}
                  >
                    {m.delta > 0 ? "+" : ""}
                    {m.delta}
                    {"deltaSuffix" in m ? m.deltaSuffix : "%"}
                  </span>
                  <span className="text-slate-500">vs período anterior</span>
                </div>
                <div className="mt-3">
                  <Sparkline data={sparkData} color={m.color} height={44} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Middle row: Faturamento full width */}
        <div className="mt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Faturamento no período</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">R$ 8.652,50</div>
              </div>
              <select className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <option>Últimos 7 dias</option>
                <option>Últimos 30 dias</option>
                <option>Este mês</option>
              </select>
            </div>
            <div className="mt-4">
              <SmoothArea
                data={REVENUE_7D.map((r) => ({ x: r.date, y: r.value }))}
                color="#0f172a"
                height={260}
                yFormatter={(v) => `R$ ${v.toLocaleString("pt-BR")}`}
              />
            </div>
          </div>
        </div>

        {/* Row: Pedidos por status + Horário de pico — side by side, same height */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Pedidos por status</div>
            <div className="mt-4 space-y-3.5">
              {ORDER_STATUS_BREAKDOWN.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-slate-700">{s.label}</span>
                    </div>
                    <span className="text-slate-500">
                      {s.count} ({s.pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct * 3}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-600">Total</span>
              <span className="font-bold text-slate-900">128</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Horário de pico</div>
              <button className="text-xs font-medium text-blue-600 hover:underline">
                Ver relatório
              </button>
            </div>
            <div className="mt-4 grid grid-cols-[42px_1fr] gap-2">
              <div className="flex flex-col justify-between py-0.5 text-[10px] text-slate-500">
                {HEATMAP_ROWS.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </div>
              <div>
                <div className="grid grid-cols-7 gap-1">
                  {HEATMAP.map((row, ri) =>
                    row.map((v, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        className="h-6 rounded"
                        style={{
                          background: `rgba(15,23,42,${0.05 + v * 0.85})`,
                        }}
                        title={`${HEATMAP_COLS[ci]} — intensidade ${(v * 100).toFixed(0)}%`}
                      />
                    )),
                  )}
                </div>
                <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-slate-500">
                  {HEATMAP_COLS.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: 3 cards */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Produtos mais vendidos</div>
              <button className="text-xs font-medium text-blue-600 hover:underline">Ver todos</button>
            </div>
            <ul className="mt-3 space-y-2">
              {TOP_PRODUCTS.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-50">
                  <span className="w-4 text-center text-xs font-semibold text-slate-500">{i + 1}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg">
                    {p.emoji}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-slate-800">{p.name}</span>
                  <span className="text-xs text-slate-500">{p.sales} vendas</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Formas de pagamento</div>
              <button className="text-xs font-medium text-blue-600 hover:underline">Ver relatório</button>
            </div>
            <ul className="mt-3 space-y-2.5">
              {PAYMENT_METHODS.map((p) => (
                <li key={p.name} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 text-slate-800">{p.name}</span>
                  <span className="w-10 text-right text-slate-600">{p.pct}%</span>
                  <span className="w-24 text-right font-medium text-slate-900">
                    R$ {p.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Comparativo com período anterior</div>
              <button className="text-xs font-medium text-blue-600 hover:underline">Ver relatório</button>
            </div>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {COMPARISON.map((c) => {
                  const positive = c.inverse ? c.delta < 0 : c.delta > 0;
                  return (
                    <tr key={c.label} className="border-t border-slate-100 first:border-0">
                      <td className="py-2.5 text-slate-700">{c.label}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={
                            positive
                              ? "inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
                              : "inline-flex items-center gap-1 text-xs font-semibold text-rose-600"
                          }
                        >
                          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {c.delta > 0 ? "+" : ""}
                          {c.delta}
                          {c.inverse ? " min" : "%"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">{c.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
