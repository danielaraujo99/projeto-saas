import { Star, Clock, Bike, MapPin } from "lucide-react";
import { restaurant } from "@/data/restaurant";
import { brl } from "@/lib/format";

export function RestaurantHeader() {
  const r = restaurant;
  return (
    <header className="relative">
      <div className="relative h-40 w-full overflow-hidden bg-muted sm:h-56 lg:h-64">
        <img src={r.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-10 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:-mt-12 sm:p-6">
          {/* Top row: avatar + identity + status */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)] sm:h-20 sm:w-20">
              <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold leading-tight text-foreground sm:text-2xl">
                    {r.name}
                  </h1>
                  <p className="mt-1 truncate text-sm text-foreground/60">
                    {r.categoriesLabel}
                  </p>
                </div>
                <span
                  className={
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                    (r.isOpen
                      ? "bg-success/12 text-[color:oklch(0.4_0.11_155)]"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (r.isOpen ? "bg-success" : "bg-muted-foreground")
                    }
                  />
                  {r.isOpen ? "Aberto" : "Fechado"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-4 rounded-xl bg-surface/70">
            <StatCell
              icon={<Star className="h-3.5 w-3.5 fill-warning text-warning" strokeWidth={2} />}
              value={r.rating.toFixed(1)}
              label="avaliação"
            />
            <StatCell
              icon={<Clock className="h-3.5 w-3.5 text-foreground/55" strokeWidth={2} />}
              value={`${r.deliveryMinutes[0]}–${r.deliveryMinutes[1]}`}
              label="minutos"
            />
            <StatCell
              icon={<Bike className="h-3.5 w-3.5 text-foreground/55" strokeWidth={2} />}
              value={brl(r.deliveryFee)}
              label="entrega"
            />
            <StatCell
              icon={<MapPin className="h-3.5 w-3.5 text-foreground/55" strokeWidth={2} />}
              value={`${r.distanceKm.toFixed(1)} km`}
              label="distância"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-3.5 text-center [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border/60">
      <div className="flex items-center gap-1.5 text-[15px] font-bold tabular-nums leading-none text-foreground">
        {icon}
        <span className="whitespace-nowrap">{value}</span>
      </div>
      <span className="line-clamp-1 text-[11px] font-medium text-foreground/50">
        {label}
      </span>
    </div>
  );
}
