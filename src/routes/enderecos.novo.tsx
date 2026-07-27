import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Briefcase, MapPin } from "lucide-react";
import { useAddresses } from "@/store/addresses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AddressKind, Address } from "@/types";
import { ClientOnly } from "@/components/client-only";
import { toast } from "sonner";

export const Route = createFileRoute("/enderecos/novo")({
  head: () => ({
    meta: [
      { title: "Novo endereço — Restaurante Demo" },
      { name: "description", content: "Cadastre um novo endereço de entrega." },
      { property: "og:title", content: "Novo endereço — Restaurante Demo" },
      { property: "og:description", content: "Cadastre um novo endereço de entrega." },
    ],
  }),
  component: Page,
});

const MapPickerLazy = React.lazy(() =>
  import("@/components/map-picker").then((m) => ({ default: m.MapPicker })),
);

function Page() {
  const add = useAddresses((s) => s.add);
  const nav = useNavigate();
  const [step, setStep] = React.useState<"map" | "form">("map");
  const [confirmed, setConfirmed] = React.useState<{
    lat: number;
    lng: number;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null>(null);

  const [number, setNumber] = React.useState("");
  const [complement, setComplement] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [kind, setKind] = React.useState<AddressKind>("home");
  const [label, setLabel] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const save = () => {
    if (!confirmed) return;
    if (!number.trim()) return setError("Informe o número do endereço.");
    const addr: Omit<Address, "id"> = {
      kind,
      label: label.trim() || undefined,
      street: confirmed.street || "Endereço",
      number: number.trim(),
      complement: complement.trim() || undefined,
      neighborhood: confirmed.neighborhood || "—",
      city: confirmed.city || "—",
      state: confirmed.state || "",
      reference: reference.trim() || undefined,
      lat: confirmed.lat,
      lng: confirmed.lng,
    };
    add(addr);
    toast.success("Endereço salvo");
    nav({ to: "/checkout" });
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/enderecos"
          aria-label="Voltar"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">
          {step === "map" ? "Onde você está?" : "Detalhes do endereço"}
        </h1>
      </header>

      {step === "map" ? (
        <ClientOnly fallback={<div className="flex-1 bg-surface" />}>
          <React.Suspense fallback={<div className="flex-1 bg-surface" />}>
            <MapPickerLazy
              onConfirm={(r) => {
                setConfirmed({
                  lat: r.lat,
                  lng: r.lng,
                  street: r.street || "",
                  neighborhood: r.neighborhood || "",
                  city: r.city || "",
                  state: r.state || "",
                });
                setStep("form");
              }}
            />
          </React.Suspense>
        </ClientOnly>
      ) : confirmed ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="rounded-xl bg-surface p-3 text-sm">
              <div className="font-semibold">
                {confirmed.street || "Endereço aproximado"}
              </div>
              <div className="text-xs text-muted-foreground">
                {confirmed.neighborhood} · {confirmed.city}/{confirmed.state}
              </div>
              <button
                onClick={() => setStep("map")}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Ajustar no mapa
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Rua</label>
              <Input
                value={confirmed.street}
                onChange={(e) => setConfirmed({ ...confirmed, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="mb-1 block text-sm font-medium">Número</label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Complemento</label>
                <Input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco…"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bairro</label>
              <Input
                value={confirmed.neighborhood}
                onChange={(e) => setConfirmed({ ...confirmed, neighborhood: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ponto de referência</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Próximo à padaria"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { k: "home" as const, icon: Home, label: "Casa" },
                    { k: "work" as const, icon: Briefcase, label: "Trabalho" },
                    { k: "other" as const, icon: MapPin, label: "Outro" },
                  ]
                ).map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setKind(o.k)}
                    className={
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition-colors " +
                      (kind === o.k
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border hover:bg-surface")
                    }
                  >
                    <o.icon className="h-5 w-5" />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {kind === "other" ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Nome do endereço</label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Casa da mãe"
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              size="lg"
              className="h-12 w-full rounded-full text-base font-semibold"
              onClick={save}
            >
              Salvar endereço
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
