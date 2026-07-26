import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
};

export function AdaptiveSheet({
  open,
  onOpenChange,
  title,
  hideTitle,
  children,
  className,
  size = "md",
}: Props) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-hidden p-0 gap-0",
            size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
            className,
          )}
        >
          {hideTitle ? (
            <VisuallyHidden asChild>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogTitle className="sr-only">{title}</DialogTitle>
          )}
          <div className="flex max-h-[90vh] flex-col">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("h-[92vh] overflow-hidden rounded-t-2xl p-0 flex flex-col", className)}
      >
        <VisuallyHidden asChild>
          <SheetTitle>{title}</SheetTitle>
        </VisuallyHidden>
        {children}
      </SheetContent>
    </Sheet>
  );
}
