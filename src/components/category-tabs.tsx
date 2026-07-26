import * as React from "react";
import { categories } from "@/data/menu";
import { cn } from "@/lib/utils";

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function CategoryTabs({ activeId, onSelect }: Props) {
  const scroller = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-cat="${activeId}"]`);
    el?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [activeId]);

  return (
    <div
      ref={scroller}
      className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-1 sm:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            data-cat={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                : "bg-surface text-muted-foreground hover:bg-primary-soft hover:text-primary",
            )}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
