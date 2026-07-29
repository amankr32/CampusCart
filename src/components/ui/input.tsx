import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm placeholder:text-black/40 outline-none transition-colors focus-visible:border-[var(--brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
