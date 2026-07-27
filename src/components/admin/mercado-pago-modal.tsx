import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getMpConfig, saveMpConfig, type MpConfig } from "@/lib/admin/mercadopago";
import { useAdminSession } from "@/lib/admin/session";

export function MercadoPagoModal({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}) {
  const { data: session } = useAdminSession();
  const restaurantId = session?.restaurantId;
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [cfg, setCfg] = React.useState<MpConfig>({
    restaurant_id: "",
    access_token: "",
    public_key: "",
    device_id: "",
    sandbox: true,
    enabled: false,
  });

  React.useEffect(() => {
    if (!open || !restaurantId) return;
    setLoading(true);
    getMpConfig(restaurantId)
      .then((c) =>
        setCfg(
          c ?? {
            restaurant_id: restaurantId,
            access_token: "",
            public_key: "",
            device_id: "",
            sandbox: true,
            enabled: false,
          },
        ),
      )
      .catch(() => toast.error("Falha ao carregar configuração."))
      .finally(() => setLoading(false));
  }, [open, restaurantId]);

  async function handleSave() {
    if (!restaurantId) return;
    if (!cfg.access_token || !cfg.public_key) {
      toast.error("Preencha o Access Token e a Public Key.");
      return;
    }
    setSaving(true);
    try {
      await saveMpConfig({ ...cfg, restaurant_id: restaurantId });
      toast.success("Mercado Pago configurado com sucesso.");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Falha ao salvar. Rode o SQL 'mercadopago-setup.sql'.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Mercado Pago</DialogTitle>
          <DialogDescription>
            Credenciais das suas aplicações. Encontre em{" "}
            <a
              href="https://www.mercadopago.com.br/developers/panel/app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              developers/panel/app <ExternalLink className="h-3 w-3" />
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid place-items-center py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-slate-800">Ambiente sandbox</div>
                <div className="text-xs text-slate-500">Use para testes antes de produção.</div>
              </div>
              <Switch
                checked={cfg.sandbox}
                onCheckedChange={(v) => setCfg((c) => ({ ...c, sandbox: v }))}
              />
            </div>

            <Field label="Access Token" hint={cfg.sandbox ? "TEST-… (sandbox)" : "APP_USR-… (produção)"}>
              <Input
                value={cfg.access_token}
                onChange={(e) => setCfg((c) => ({ ...c, access_token: e.target.value }))}
                placeholder={cfg.sandbox ? "TEST-1234567890-..." : "APP_USR-1234567890-..."}
                type="password"
              />
            </Field>

            <Field label="Public Key">
              <Input
                value={cfg.public_key}
                onChange={(e) => setCfg((c) => ({ ...c, public_key: e.target.value }))}
                placeholder={cfg.sandbox ? "TEST-abcdef..." : "APP_USR-abcdef..."}
              />
            </Field>

            <Field
              label="Device ID (maquininha Point)"
              hint="Opcional — usado para envio de cobrança direto para a maquininha no PDV."
            >
              <Input
                value={cfg.device_id ?? ""}
                onChange={(e) => setCfg((c) => ({ ...c, device_id: e.target.value }))}
                placeholder="Ex.: PAX_A910__SMARTPOS1234567890"
              />
            </Field>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-slate-800">Ativar Mercado Pago</div>
                <div className="text-xs text-slate-500">
                  Quando ativo, o PDV usa PIX real e maquininha do Mercado Pago.
                </div>
              </div>
              <Switch
                checked={cfg.enabled}
                onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
