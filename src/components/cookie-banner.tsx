import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "bistro-cookie-consent";
const LOG_KEY = "bistro-cookie-consent-log";

type Consent = {
  necessary: true;
  analytics: boolean;
  decidedAt: string;
  version: 1;
};

type LogEntry = Consent & { action: "accept-all" | "reject-optional" | "customize" };

const HIDDEN_PREFIXES = ["/admin"];

function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent, action: LogEntry["action"]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    const prev = JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as LogEntry[];
    prev.push({ ...c, action });
    // keep last 20 entries
    localStorage.setItem(LOG_KEY, JSON.stringify(prev.slice(-20)));
  } catch {
    /* ignore */
  }
}

export function CookieBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hiddenByRoute = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (hiddenByRoute) return;
    const c = readConsent();
    setOpen(!c);
  }, [hiddenByRoute]);

  if (!open || hiddenByRoute) return null;

  const decide = (analytics: boolean, action: LogEntry["action"]) => {
    writeConsent(
      { necessary: true, analytics, decidedAt: new Date().toISOString(), version: 1 },
      action,
    );
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+72px)] md:pb-4"
    >
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-elevated)] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">Este site usa cookies</div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => decide(false, "reject-optional")}
                className="grid h-8 w-8 place-items-center rounded-full text-foreground/50 hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/70">
              Usamos cookies necessários para o funcionamento do carrinho e cookies opcionais de análise para
              melhorar a experiência. Saiba mais na{" "}
              <Link to="/privacidade" className="text-primary underline">
                Política de Privacidade
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => decide(true, "accept-all")}
                className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Aceitar todos
              </button>
              <button
                type="button"
                onClick={() => decide(false, "reject-optional")}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-surface"
              >
                Apenas necessários
              </button>
              <Link
                to="/privacidade"
                className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-foreground/70 hover:text-foreground"
              >
                Configurações
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
