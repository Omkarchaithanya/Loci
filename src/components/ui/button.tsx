import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-cyan text-primary-foreground shadow-[0_0_0_1px_rgba(79,214,232,0.4)] hover:opacity-90 active:scale-[0.98]",
        secondary:
          "bg-elevated text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)]",
        ghost: "bg-transparent text-fg hover:bg-elevated",
        danger:
          "bg-hazard-dim text-hazard shadow-[0_0_0_1px_rgba(224,90,79,0.35)] hover:opacity-90",
        ok: "bg-ok-dim text-ok shadow-[0_0_0_1px_rgba(93,186,138,0.35)] hover:opacity-90",
        amber:
          "bg-amber-dim text-amber shadow-[0_0_0_1px_rgba(224,160,84,0.35)] hover:opacity-90",
      },
      size: {
        sm: "h-9 rounded-sm px-3 text-xs",
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-5 text-sm",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
