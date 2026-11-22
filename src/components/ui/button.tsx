import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold",
        elevated:
          "border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-xs hover:bg-[var(--border-subtle)]/40 font-semibold",
        outline:
          "border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)]/40 font-medium",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-xs font-semibold",
        brand:
          "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs font-semibold",
        ghost: "hover:bg-[var(--border-subtle)]/40 text-[var(--text-primary)]",
        link: "underline-offset-4 hover:underline text-indigo-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
