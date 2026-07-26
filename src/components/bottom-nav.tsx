import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ClipboardList, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/conta", label: "Conta", icon: User2 },
] as const;

// Routes where the bottom nav should NOT appear (full-screen flows).
const HIDDEN_PREFIXES = ["/carrinho", "/checkout", "/pagamento", "/pedido", "/enderecos", "/auth"];

function useShouldShowNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function BottomNav() {
  const show = useShouldShowNav();
  if (!show) return null;
  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
          {ITEMS.map((it) => (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                activeOptions={{ exact: it.to === "/" }}
                className="group flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium text-foreground/55 transition-colors data-[status=active]:text-primary"
              >
                <it.icon className="h-5 w-5 transition-transform group-data-[status=active]:scale-110" />
                <span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop: top nav */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 top-0 z-40 hidden border-b border-border bg-background/90 backdrop-blur md:block"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-2">
          <Link to="/" className="mr-4 text-sm font-extrabold tracking-tight text-primary">
            Bistrô Azul
          </Link>
          {ITEMS.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.to === "/" }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/60 hover:text-foreground",
                "data-[status=active]:bg-primary-soft data-[status=active]:text-primary",
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

/** Spacer to add bottom padding on pages that show the bottom nav. */
export function BottomNavSpacer() {
  const show = useShouldShowNav();
  if (!show) return null;
  return <div className="h-16 md:h-0" aria-hidden />;
}
