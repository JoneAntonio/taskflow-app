import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(120deg,var(--color-accent),color-mix(in_oklab,var(--color-accent)_55%,var(--color-secondary)))] text-[var(--color-accent-ink)] font-semibold shadow-[var(--glow)] hover:brightness-110 active:scale-[0.98]",
  secondary:
    "bg-[var(--color-surface-alt)] text-[var(--color-ink)] hover:bg-[var(--color-border)]",
  outline:
    "border border-[var(--color-border)] bg-[var(--color-surface)]/40 text-[var(--color-ink)] hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-surface-alt)]",
  ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
  danger: "bg-[var(--color-danger)] text-white hover:brightness-95",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center whitespace-nowrap font-medium transition-[background,box-shadow,border-color,filter,transform] duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
