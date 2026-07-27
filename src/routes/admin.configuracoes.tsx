import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  getRestaurant,
  updateRestaurantInfo,
  updateRestaurantSettings,
  type OperationSettings,
} from "@/lib/admin/restaurant";
import { CheckCircle2, Loader2 } from "lucide-react";
import mpLogo from "@/assets/mercado-pago.webp.asset.json";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — MenuAltas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfigPage,
});

type TabId = "restaurante" | "operacao" | "notificacoes" | "impressao" | "integracoes";

const TABS: { id: TabId; label: string }[] = [
  { id: "restaurante", label: "Restaurante" },
  { id: "operacao", label: "Operação" },
  { id: "notificacoes", label: "Notificações" },
  { id: "impressao", label: "Impressão" },
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
        {tab === "impressao" && <ImpressaoTab />}
        {tab === "integracoes" && <IntegracoesTab />}
      </div>
    </AdminShell>
  );
}

/* ---------- Restaurante ---------- */
function RestauranteTab() {
  const { data: session } = useAdminSession();
  const restaurantId = session?.restaurantId;
  const qc = useQueryClient();
  const { data: rest, isLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId!),
    enabled: !!restaurantId,
  });

  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    category: "",
    phone: "",
    address: "",
    description: "",
    logo_url: "",
    cover_url: "",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (rest) {
      setForm({
        name: rest.name ?? "",
        slug: rest.slug ?? "",
        category: rest.category ?? "",
        phone: rest.phone ?? "",
        address: rest.address ?? "",
        description: rest.description ?? "",
        logo_url: rest.logo_url ?? "",
        cover_url: rest.cover_url ?? "",
      });
    }
  }, [rest]);

  async function save() {
    if (!restaurantId) return;
    if (!form.name || !form.slug) {
      toast.error("Nome e slug são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await updateRestaurantInfo(restaurantId, form);
      await qc.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      await qc.invalidateQueries({ queryKey: ["admin-session"] });
      toast.success("Restaurante atualizado.");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Falha ao salvar. Rode o SQL 'restaurant-settings.sql' no seu Supabase.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingBlock />;

  return (
    <Section title="Dados do restaurante" description="Como o cliente vê seu restaurante.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Slug (URL pública)" hint={form.slug ? `menualtas.app/${form.slug}` : undefined}>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </Field>
        <Field label="Categoria" hint="Ex.: Hambúrgueres • Lanches">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="Telefone / WhatsApp">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Endereço">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Descrição">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <Field label="URL do logo (quadrado, 512x512)">
          <Input
            placeholder="https://…"
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          />
        </Field>
        <Field label="URL da capa (1600x600)">
          <Input
            placeholder="https://…"
            value={form.cover_url}
            onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </Button>
      </div>
    </Section>
  );
}

/* ---------- Operação ---------- */
const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;

const defaultSettings: OperationSettings = {
  hours: DAYS.map((d, i) => ({ day: d, open: i < 6, from: "11:00", to: "23:00" })),
  auto_close: true,
  prep_time_min: 25,
  delivery_time_min: 35,
  delivery_radius_km: 5,
  delivery_fee: 7.9,
  min_order: 20,
  accept_pickup: true,
};

function OperacaoTab() {
  const { data: session } = useAdminSession();
  const restaurantId = session?.restaurantId;
  const qc = useQueryClient();
  const { data: rest, isLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId!),
    enabled: !!restaurantId,
  });

  const [cfg, setCfg] = React.useState<OperationSettings>(defaultSettings);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (rest) {
      const merged = { ...defaultSettings, ...(rest.settings ?? {}) };
      if (!merged.hours || merged.hours.length !== 7) merged.hours = defaultSettings.hours;
      setCfg(merged);
    }
  }, [rest]);

  async function save() {
    if (!restaurantId) return;
    setSaving(true);
    try {
      await updateRestaurantSettings(restaurantId, cfg);
      await qc.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      toast.success("Operação atualizada.");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Falha ao salvar. Rode o SQL 'restaurant-settings.sql' no seu Supabase.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <Section title="Horário de funcionamento" description="Defina abertura e fechamento por dia.">
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {(cfg.hours ?? []).map((h, i) => (
            <div
              key={h.day}
              className="grid grid-cols-[110px_auto_1fr_1fr] items-center gap-3 px-3 py-2.5"
            >
              <div className="text-sm font-medium text-slate-700">{h.day}</div>
              <Switch
                checked={h.open}
                onCheckedChange={(v) => {
                  const hours = [...(cfg.hours ?? [])];
                  hours[i] = { ...hours[i], open: v };
                  setCfg({ ...cfg, hours });
                }}
              />
              <Input
                type="time"
                value={h.from}
                onChange={(e) => {
                  const hours = [...(cfg.hours ?? [])];
                  hours[i] = { ...hours[i], from: e.target.value };
                  setCfg({ ...cfg, hours });
                }}
              />
              <Input
                type="time"
                value={h.to}
                onChange={(e) => {
                  const hours = [...(cfg.hours ?? [])];
                  hours[i] = { ...hours[i], to: e.target.value };
                  setCfg({ ...cfg, hours });
                }}
              />
            </div>
          ))}
        </div>
        <Toggle
          label="Fechamento automático fora do horário"
          checked={!!cfg.auto_close}
          onChange={(v) => setCfg({ ...cfg, auto_close: v })}
        />
      </Section>

      <Section title="Entrega e preparo">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <NumField
            label="Tempo médio de preparo (min)"
            value={cfg.prep_time_min ?? 0}
            onChange={(v) => setCfg({ ...cfg, prep_time_min: v })}
          />
          <NumField
            label="Tempo médio de entrega (min)"
            value={cfg.delivery_time_min ?? 0}
            onChange={(v) => setCfg({ ...cfg, delivery_time_min: v })}
          />
          <NumField
            label="Raio de entrega (km)"
            step={0.5}
            value={cfg.delivery_radius_km ?? 0}
            onChange={(v) => setCfg({ ...cfg, delivery_radius_km: v })}
          />
          <NumField
            label="Taxa de entrega (R$)"
            step={0.5}
            value={cfg.delivery_fee ?? 0}
            onChange={(v) => setCfg({ ...cfg, delivery_fee: v })}
          />
          <NumField
            label="Pedido mínimo (R$)"
            step={0.5}
            value={cfg.min_order ?? 0}
            onChange={(v) => setCfg({ ...cfg, min_order: v })}
          />
        </div>
        <Toggle
          label="Aceitar retirada no local"
          checked={!!cfg.accept_pickup}
          onChange={(v) => setCfg({ ...cfg, accept_pickup: v })}
        />
      </Section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </Button>
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

/* ---------- Impressão ---------- */
function ImpressaoTab() {
  const { data: session } = useAdminSession();
  const rid = session?.restaurantId;
  const [cfg, setCfg] = React.useState<import("@/lib/admin/printing").PrintSettings>(
    { ...require("@/lib/admin/printing").DEFAULT_PRINT },
  );
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!rid) return;
    import("@/lib/admin/printing").then(({ loadPrintSettings }) =>
      loadPrintSettings(rid).then((s) => {
        setCfg(s);
        setLoading(false);
      }),
    );
  }, [rid]);

  async function save() {
    if (!rid) return;
    setSaving(true);
    try {
      const { savePrintSettings } = await import("@/lib/admin/printing");
      await savePrintSettings(rid, cfg);
      toast.success("Preferências de impressão salvas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Coluna esquerda: configuração */}
      <div className="space-y-4">
        <Section
          title="Impressão via navegador (KDS)"
          description="A impressão automática sai direto na Cozinha (KDS) pela impressora térmica conectada àquele computador/cliente."
        >
          <Toggle
            label="Ativar impressão via navegador"
            checked={cfg.enabled}
            onChange={(v) => setCfg({ ...cfg, enabled: v })}
          />
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
            Para impressão 100% silenciosa (sem diálogo do navegador), é necessário instalar o
            agente local <b>MenuAltas Print Bridge</b> no computador conectado à impressora
            térmica. Sem ele, o navegador exibirá a caixa de confirmação padrão a cada impressão.
          </div>
        </Section>

        <Section title="Vias">
          <Toggle
            label="Imprimir comanda da cozinha"
            checked={cfg.kitchen}
            onChange={(v) => setCfg({ ...cfg, kitchen: v })}
          />
          <Toggle
            label="Imprimir comanda de entrega"
            checked={cfg.delivery}
            onChange={(v) => setCfg({ ...cfg, delivery: v })}
          />
        </Section>

        <Section title="Exibição">
          <Toggle
            label="Mostrar logo"
            checked={cfg.show_logo}
            onChange={(v) => setCfg({ ...cfg, show_logo: v })}
          />
          <Toggle
            label="Mostrar QR Code (cliente)"
            checked={cfg.show_qr}
            onChange={(v) => setCfg({ ...cfg, show_qr: v })}
          />
          <Toggle
            label="Mostrar valores na cozinha"
            checked={cfg.show_prices_kitchen}
            onChange={(v) => setCfg({ ...cfg, show_prices_kitchen: v })}
          />
        </Section>

        <Section title="Papel e tipografia">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tamanho do papel">
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={cfg.paper}
                onChange={(e) =>
                  setCfg({ ...cfg, paper: e.target.value as "58mm" | "80mm" })
                }
              >
                <option value="58mm">58mm (térmica pequena)</option>
                <option value="80mm">80mm</option>
              </select>
            </Field>
            <Field label="Tamanho da fonte">
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={cfg.font}
                onChange={(e) =>
                  setCfg({ ...cfg, font: e.target.value as "small" | "medium" | "large" })
                }
              >
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </select>
            </Field>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </div>
      </div>

      {/* Coluna direita: preview */}
      <div className="space-y-4">
        <Section
          title="Pré-visualização"
          description="Atualiza em tempo real conforme você altera as opções."
        >
          <div className="flex flex-wrap gap-4">
            <ReceiptPreview variant="kitchen" cfg={cfg} />
            <ReceiptPreview variant="delivery" cfg={cfg} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function ReceiptPreview({
  variant,
  cfg,
}: {
  variant: "kitchen" | "delivery";
  cfg: import("@/lib/admin/printing").PrintSettings;
}) {
  const [html, setHtml] = React.useState("");
  React.useEffect(() => {
    import("@/lib/admin/printing").then(({ buildReceiptHtml }) => {
      const sample = {
        short_id: "PED123456",
        items: [
          {
            name: "X-Burger",
            qty: 2,
            price: 32,
            addOns: [{ name: "Bacon", price: 4 }],
            notes: "Sem cebola",
          },
          { name: "Batata frita", qty: 1, price: 18 },
          { name: "Coca-Cola 350ml", qty: 2, price: 8 },
        ],
        subtotal: 96,
        delivery_fee: 8,
        total: 104,
        payment: "pix",
        address: {
          street: "Rua das Flores",
          number: "123",
          district: "Centro",
          recipient: "Maria Silva",
        },
        pickup: false,
      };
      setHtml(buildReceiptHtml({ order: sample, variant, settings: cfg }));
    });
  }, [variant, cfg]);
  const label = variant === "kitchen" ? "Via Cozinha" : "Via Entrega/Cliente";
  const width = cfg.paper === "58mm" ? 220 : 300;
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-inner"
        style={{ width }}
      >
        <iframe
          title={label}
          srcDoc={html}
          style={{ width: "100%", height: 460, border: 0, background: "white" }}
        />
      </div>
    </div>
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
      <Section title="Integrações" description="Conecte gateways de pagamento.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <IntegrationCard
            name="Mercado Pago"
            logo={
              <div className="grid h-12 w-20 place-items-center rounded-lg bg-white ring-1 ring-slate-100">
                <img
                  src={mpLogo.url}
                  alt="Mercado Pago"
                  className="max-h-9 w-auto"
                  loading="lazy"
                />
              </div>
            }
            description="Aceite PIX (QR automático) e cartão via maquininha Point."
            status={mpEnabled === null ? "carregando…" : mpEnabled ? "conectado" : "não conectado"}
            onConfigure={() => setOpenMp(true)}
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

function NumField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
      <span className="text-sm text-slate-700">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="grid h-40 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

function IntegrationCard({
  name,
  logo,
  description,
  status,
  onConfigure,
}: {
  name: string;
  logo: React.ReactNode;
  description: string;
  status: string;
  onConfigure?: () => void;
}) {
  const tone =
    status === "conectado"
      ? "bg-emerald-50 text-emerald-700"
      : status === "não conectado"
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-50 text-amber-700";
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
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
      <p className="text-xs text-slate-500">{description}</p>
      <div className="flex justify-end">
        <Button size="sm" variant={status === "conectado" ? "outline" : "default"} onClick={onConfigure}>
          {status === "conectado" ? "Gerenciar" : "Configurar"}
        </Button>
      </div>
    </div>
  );
}
