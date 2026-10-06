import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      tone: {
        mute: "bg-elevated text-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        cyan: "bg-cyan-dim text-cyan",
        amber: "bg-amber-dim text-amber",
        hazard: "bg-hazard-dim text-hazard",
        ok: "bg-ok-dim text-ok",
      },
    },
    defaultVariants: { tone: "mute" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
