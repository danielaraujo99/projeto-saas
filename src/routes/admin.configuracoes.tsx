import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MercadoPagoModal } from "@/components/admin/mercado-pago-modal";
import { getMpConfig } from "@/lib/admin/mercadopago";
import { useAdminSession } from "@/lib/admin/session";
import { Upload, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — MenuAltas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfigPage,
});

type TabId = "restaurante" | "operacao" | "notificacoes" | "integracoes";

const TABS: { id: TabId; label: string }[] = [
  { id: "restaurante", label: "Restaurante" },
  { id: "operacao", label: "Operação" },
  { id: "notificacoes", label: "Notificações" },
  { id: "integracoes", label: "Integrações" },
];

function ConfigPage() {
  const [tab, setTab] = React.useState<TabId>("restaurante");

  return (
    <AdminShell title="Configurações">
      <div className="px-4 py-6 sm:px-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
          <p className="text-sm text-slate-500">Ajustes gerais do restaurante e do painel.</p>
        </div>

        {/* Tabs horizontais no topo */}
        <div className="mb-5 border-b border-slate-200">
          <nav className="-mb-px flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium transition",
                  tab === t.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "restaurante" && <RestauranteTab />}
        {tab === "operacao" && <OperacaoTab />}
        {tab === "notificacoes" && <NotificacoesTab />}
        {tab === "integracoes" && <IntegracoesTab />}
      </div>
    </AdminShell>
  );
}

/* ---------- Restaurante ---------- */
function RestauranteTab() {
  return (
    <Section title="Dados do restaurante" description="Como o cliente vê seu restaurante.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome"><Input defaultValue="Restaurante Demo" /></Field>
        <Field label="Slug (URL pública)"><Input defaultValue="demo" /></Field>
        <Field label="Categoria" hint="Ex.: Hambúrgueres • Lanches">
          <Input defaultValue="Hambúrgueres • Lanches" />
        </Field>
        <Field label="Telefone / WhatsApp"><Input defaultValue="(11) 99999-9999" /></Field>
        <div className="md:col-span-2">
          <Field label="Endereço"><Input defaultValue="Av. Paulista, 1500 — São Paulo" /></Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Descrição">
            <Textarea rows={3} defaultValue="Comida caseira com entrega rápida." />
          </Field>
        </div>
        <Field label="Logo (quadrada, 512x512)">
          <UploadBox label="Enviar logo" />
        </Field>
        <Field label="Imagem de capa (1600x600)">
          <UploadBox label="Enviar capa" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Alterações salvas")}>Salvar</Button>
      </div>
    </Section>
  );
}

/* ---------- Operação ---------- */
const DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

function OperacaoTab() {
  return (
    <div className="space-y-4">
      <Section title="Horário de funcionamento" description="Defina abertura e fechamento por dia.">
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {DAYS.map((d, i) => (
            <div key={d} className="grid grid-cols-[110px_auto_1fr_1fr] items-center gap-3 px-3 py-2.5">
              <div className="text-sm font-medium text-slate-700">{d}</div>
              <Switch defaultChecked={i < 6} />
              <Input type="time" defaultValue="11:00" />
              <Input type="time" defaultValue="23:00" />
            </div>
          ))}
        </div>
        <Toggle label="Fechamento automático fora do horário" defaultChecked />
      </Section>

      <Section title="Entrega e preparo">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Tempo médio de preparo (min)"><Input type="number" defaultValue={25} /></Field>
          <Field label="Tempo médio de entrega (min)"><Input type="number" defaultValue={35} /></Field>
          <Field label="Raio de entrega (km)"><Input type="number" step="0.5" defaultValue={5} /></Field>
          <Field label="Taxa de entrega padrão (R$)"><Input type="number" step="0.5" defaultValue={7.9} /></Field>
          <Field label="Pedido mínimo (R$)"><Input type="number" step="0.5" defaultValue={20} /></Field>
        </div>
        <Toggle label="Aceitar retirada no local" defaultChecked />
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Operação atualizada")}>Salvar</Button>
      </div>
    </div>
  );
}

/* ---------- Notificações ---------- */
function NotificacoesTab() {
  const events = [
    { id: "new_order", label: "Novo pedido" },
    { id: "canceled", label: "Pedido cancelado" },
    { id: "low_stock", label: "Estoque baixo" },
    { id: "review", label: "Nova avaliação" },
  ];
  return (
    <Section title="Eventos e canais" description="Escolha o que dispara notificação e por onde.">
      <div className="overflow-hidden rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Evento</th>
              <th className="px-3 py-2">Som no painel</th>
              <th className="px-3 py-2">E-mail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-3 font-medium text-slate-700">{e.label}</td>
                <td className="px-3 py-3"><Switch defaultChecked /></td>
                <td className="px-3 py-3"><Switch /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button onClick={() => toast.success("Preferências salvas")}>Salvar</Button>
      </div>
    </Section>
  );
}

/* ---------- Integrações ---------- */
function IntegracoesTab() {
  const { data: session } = useAdminSession();
  const [openMp, setOpenMp] = React.useState(false);
  const [mpEnabled, setMpEnabled] = React.useState<boolean | null>(null);

  const refresh = React.useCallback(() => {
    if (!session?.restaurantId) return;
    getMpConfig(session.restaurantId)
      .then((c) => setMpEnabled(!!c?.enabled))
      .catch(() => setMpEnabled(false));
  }, [session?.restaurantId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <Section
        title="Integrações"
        description="Conecte gateways de pagamento e outros serviços."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <IntegrationCard
            name="Mercado Pago"
            logo={
              <img
                src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.94/mercadopago/logo-large.png"
                alt="Mercado Pago"
                className="h-6 w-auto"
                loading="lazy"
              />
            }
            description="Aceite PIX (QR automático) e cartão via maquininha Point."
            status={mpEnabled === null ? "carregando…" : mpEnabled ? "conectado" : "não conectado"}
            onConfigure={() => setOpenMp(true)}
          />
          <IntegrationCard
            name="WhatsApp Business"
            logo={<Placeholder label="WA" className="bg-emerald-500" />}
            description="Confirmações e status de pedido pelo WhatsApp."
            status="em breve"
            disabled
          />
          <IntegrationCard
            name="iFood"
            logo={<Placeholder label="iF" className="bg-rose-500" />}
            description="Importe pedidos direto do iFood."
            status="em breve"
            disabled
          />
        </div>
      </Section>

      <MercadoPagoModal open={openMp} onOpenChange={setOpenMp} onSaved={refresh} />
    </>
  );
}

/* ---------- Bits ---------- */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {description ? <div className="text-xs text-slate-500">{description}</div> : null}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-[11px] font-normal text-slate-400">{hint}</span> : null}
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

function UploadBox({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-50"
    >
      <Upload className="h-4 w-4" /> {label}
    </button>
  );
}

function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md text-xs font-bold text-white",
        className,
      )}
    >
      {label}
    </div>
  );
}

function IntegrationCard({
  name,
  logo,
  description,
  status,
  onConfigure,
  disabled,
}: {
  name: string;
  logo: React.ReactNode;
  description: string;
  status: string;
  onConfigure?: () => void;
  disabled?: boolean;
}) {
  const tone =
    status === "conectado"
      ? "bg-emerald-50 text-emerald-700"
      : status === "não conectado"
        ? "bg-slate-100 text-slate-600"
        : status === "em breve"
          ? "bg-slate-100 text-slate-500"
          : "bg-amber-50 text-amber-700";
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {logo}
          <div>
            <div className="text-sm font-bold text-slate-900">{name}</div>
            <span
              className={cn(
                "mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                tone,
              )}
            >
              {status === "conectado" ? <CheckCircle2 className="h-3 w-3" /> : null}
              {status}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
      <div className="flex justify-end">
        <Button size="sm" variant={status === "conectado" ? "outline" : "default"} onClick={onConfigure} disabled={disabled}>
          {status === "conectado" ? "Gerenciar" : "Configurar"}
        </Button>
      </div>
    </div>
  );
}
