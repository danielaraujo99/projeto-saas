import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { products } from "@/data/menu";
import { brl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/admin/session";
import { getDeviceId } from "@/lib/device-id";
import { Bike, Loader2, Minus, Plus, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pedidos/novo")({
  head: () => ({
    meta: [
      { title: "Adicionar pedido — Painel" },
      { name: "description", content: "Registrar pedido manual (telefone/WhatsApp)." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewOrderPage,
});

type Line = { productId: string; name: string; unitPrice: number; quantity: number };

function NewOrderPage() {
  const nav = useNavigate();
  const { data: session } = useAdminSession();
  const [lines, setLines] = React.useState<Line[]>([]);
  const [pickup, setPickup] = React.useState(false);
  const [payment, setPayment] = React.useState<"pix" | "cash" | "credit" | "debit">("pix");
  const [customer, setCustomer] = React.useState({ name: "", phone: "" });
  const [address, setAddress] = React.useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "SP",
    reference: "",
  });
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const deliveryFee = pickup ? 0 : subtotal > 0 ? 6.9 : 0;
  const total = subtotal + deliveryFee;

  function add(p: (typeof products)[number]) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { productId: p.id, name: p.name, unitPrice: p.price, quantity: 1 }];
    });
  }
  function bump(id: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === id ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  async function submit() {
    if (!session) return;
    if (lines.length === 0) return toast.error("Adicione ao menos um item.");
    if (!customer.name.trim()) return toast.error("Informe o nome do cliente.");
    if (!pickup && !address.street.trim()) return toast.error("Informe o endereço de entrega.");
    setBusy(true);
    const shortId = "PED" + Math.floor(100000 + Math.random() * 900000);
    const items = lines.map((l) => ({
      id: crypto.randomUUID(),
      productId: l.productId,
      name: l.name,
      basePrice: l.unitPrice,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      note: note || undefined,
      customizations: [],
    }));
    const paymentPayload =
      payment === "pix"
        ? { kind: "pix" }
        : payment === "cash"
          ? { kind: "cash" }
          : { kind: payment, cardId: "manual", brand: "Manual", last4: "0000" };

    const { data, error } = await supabase
      .from("orders")
      .insert({
        short_id: shortId,
        device_id: `admin-${session.user.id.slice(0, 8)}`,
        restaurant_id: session.restaurantId,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        discount: 0,
        total,
        pickup,
        payment: paymentPayload,
        eta_minutes: pickup ? 20 : 40,
        status: "received",
        payment_confirmed_at: new Date().toISOString(),
        address: pickup
          ? null
          : { id: "manual", kind: "other", ...address, lat: 0, lng: 0 },
      })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Não foi possível salvar o pedido.");
      return;
    }
    toast.success(`Pedido ${shortId} enviado para o Kanban`);
    nav({ to: "/admin/pedidos" });
  }

  return (
    <AdminShell title="Adicionar pedido">
      <div className="mx-auto max-w-6xl grid-cols-[minmax(0,1fr)_360px] gap-6 p-4 sm:p-6 lg:grid">
        {/* Cardápio */}
        <div className="min-w-0">
          <h2 className="mb-3 text-sm font-bold text-slate-700">Cardápio</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{brl(p.price)}</div>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </div>

        {/* Resumo */}
        <aside className="mt-6 space-y-4 lg:mt-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Itens</h3>
            {lines.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum item adicionado.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {lines.map((l) => (
                  <li key={l.productId} className="flex items-center gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{l.name}</div>
                      <div className="text-xs text-slate-500">{brl(l.unitPrice)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bump(l.productId, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{l.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => bump(l.productId, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <Row label="Subtotal" value={brl(subtotal)} />
              <Row label={pickup ? "Retirada" : "Entrega"} value={pickup ? "—" : brl(deliveryFee)} />
              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 font-bold">
                <span>Total</span>
                <span className="tabular-nums">{brl(total)}</span>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Cliente</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Entrega</h3>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Toggle active={!pickup} onClick={() => setPickup(false)} icon={<Bike className="h-4 w-4" />}>
                Entrega
              </Toggle>
              <Toggle active={pickup} onClick={() => setPickup(true)} icon={<ShoppingBag className="h-4 w-4" />}>
                Retirada
              </Toggle>
            </div>
            {!pickup ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Rua</Label>
                  <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div>
                  <Label>UF</Label>
                  <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Referência</Label>
                  <Input value={address.reference} onChange={(e) => setAddress({ ...address, reference: e.target.value })} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Pagamento</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["pix", "cash", "credit", "debit"] as const).map((m) => (
                <Toggle key={m} active={payment === m} onClick={() => setPayment(m)} icon={<Wallet className="h-4 w-4" />}>
                  {m === "pix" ? "Pix" : m === "cash" ? "Dinheiro" : m === "credit" ? "Crédito" : "Débito"}
                </Toggle>
              ))}
            </div>
            <div className="mt-3">
              <Label>Observações</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: sem cebola" />
            </div>
          </div>

          <Button className="h-12 w-full text-base font-semibold" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar pedido para o Kanban
          </Button>
        </aside>
      </div>
    </AdminShell>
  );
}

function Toggle({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="tabular-nums text-slate-800">{value}</span>
    </div>
  );
}
