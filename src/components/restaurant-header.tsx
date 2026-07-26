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
        <div className="-mt-8 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:-mt-10 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)] sm:h-20 sm:w-20">
              <img src={r.logo} alt={r.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    (r.isOpen
                      ? "bg-success/15 text-[color:oklch(0.35_0.1_155)]"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (r.isOpen ? "bg-success" : "bg-muted-foreground")
                    }
                  />
                  {r.isOpen ? "Aberto agora" : "Fechado"}
                </span>
              </div>
              <h1 className="mt-1.5 truncate text-xl font-bold text-foreground sm:text-2xl">
                {r.name}
              </h1>
              <p className="mt-0.5 truncate text-sm text-foreground/60">{r.categoriesLabel}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-xl border border-border bg-surface">
            <StatCell
              icon={<Star className="h-4 w-4 fill-warning text-warning" strokeWidth={2} />}
              value={r.rating.toFixed(1)}
              label={`${r.reviewsCount}+`}
            />
            <StatCell
              icon={<Clock className="h-4 w-4 text-foreground/70" strokeWidth={2} />}
              value={`${r.deliveryMinutes[0]}–${r.deliveryMinutes[1]}`}
              label="min"
            />
            <StatCell
              icon={<Bike className="h-4 w-4 text-foreground/70" strokeWidth={2} />}
              value={brl(r.deliveryFee)}
              label="entrega"
            />
            <StatCell
              icon={<MapPin className="h-4 w-4 text-foreground/70" strokeWidth={2} />}
              value={`${r.distanceKm.toFixed(1)} km`}
              label="daqui"
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
    <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-center [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border">
      <div className="flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
        {icon}
        <span>{value}</span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/50">
        {label}
      </span>
    </div>
  );
}
