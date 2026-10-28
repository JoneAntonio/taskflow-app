import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "h-10 w-full nx-panel rounded-xl border px-3.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition-colors",
            "border-[var(--color-border)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]",
            error && "border-[var(--color-danger)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
