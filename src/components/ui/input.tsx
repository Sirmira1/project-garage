import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-[color:var(--border)] bg-asphalt px-3 py-1 text-sm text-paper transition-colors placeholder:text-steel-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:text-paper",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
