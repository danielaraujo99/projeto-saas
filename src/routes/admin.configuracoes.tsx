import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — MenuAltas" }, { name: "robots", content: "noindex" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const [tab, setTab] = React.useState<"restaurante" | "operacao" | "notificacoes" | "integracoes">(
    "restaurante",
  );

  return (
    <AdminShell title="Configurações">
      <div className="px-4 py-6 sm:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-sm text-slate-500">Ajustes gerais do restaurante e do painel.</p>

        <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex flex-row overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-sm lg:flex-col lg:p-2">
            {[
              { id: "restaurante", label: "Restaurante" },
              { id: "operacao", label: "Operação" },
              { id: "notificacoes", label: "Notificações" },
              { id: "integracoes", label: "Integrações" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-left font-medium transition ${
                  tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="space-y-4">
            {tab === "restaurante" && (
              <Section title="Dados do restaurante">
                <Field label="Nome"><Input defaultValue="Restaurante Demo" /></Field>
                <Field label="Slug (URL pública)"><Input defaultValue="demo" /></Field>
                <Field label="Endereço"><Input defaultValue="Av. Paulista, 1500 — São Paulo" /></Field>
                <Field label="Descrição"><Textarea rows={3} defaultValue="Comida caseira com entrega rápida." /></Field>
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Alterações salvas")}>Salvar</Button>
                </div>
              </Section>
            )}
            {tab === "operacao" && (
              <Section title="Horário e entrega">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Abre"><Input type="time" defaultValue="11:00" /></Field>
                  <Field label="Fecha"><Input type="time" defaultValue="23:00" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tempo médio de entrega (min)"><Input type="number" defaultValue={35} /></Field>
                  <Field label="Taxa de entrega padrão (R$)"><Input type="number" defaultValue={7.9} /></Field>
                </div>
                <Toggle label="Aceitar retirada no local" defaultChecked />
                <Toggle label="Pedido mínimo obrigatório" />
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Configurações atualizadas")}>Salvar</Button>
                </div>
              </Section>
            )}
            {tab === "notificacoes" && (
              <Section title="Notificações">
                <Toggle label="Novo pedido" defaultChecked />
                <Toggle label="Pedido cancelado" defaultChecked />
                <Toggle label="Estoque baixo" defaultChecked />
                <Toggle label="Avaliação recebida" />
                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Preferências salvas")}>Salvar</Button>
                </div>
              </Section>
            )}
            {tab === "integracoes" && (
              <Section title="Integrações">
                <IntegrationRow name="WhatsApp Business" status="conectado" />
                <IntegrationRow name="iFood" status="conectado" />
                <IntegrationRow name="Rappi" status="pendente" />
                <IntegrationRow name="Google Meu Negócio" status="não conectado" />
              </Section>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
      <span className="text-sm text-slate-700">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function IntegrationRow({ name, status }: { name: string; status: string }) {
  const color =
    status === "conectado"
      ? "bg-emerald-50 text-emerald-700"
      : status === "pendente"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
      <div className="text-sm font-medium text-slate-800">{name}</div>
      <div className="flex items-center gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>
        <Button size="sm" variant="outline">
          {status === "conectado" ? "Gerenciar" : "Conectar"}
        </Button>
      </div>
    </div>
  );
}
