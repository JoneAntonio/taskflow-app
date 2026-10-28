import { useId } from "react";

/** Marca do JAFLOW Nexus: um núcleo hexagonal com três nós em órbita. */
export function NexusMark({ className = "h-7 w-7" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={`nx-g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" />
          <stop offset="1" stopColor="var(--color-secondary)" />
        </linearGradient>
      </defs>
      <path
        d="M16 3.5 26.8 9.75v12.5L16 28.5 5.2 22.25V9.75Z"
        fill="none"
        stroke={`url(#nx-g-${id})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 10.5 20.8 13.25v5.5L16 21.5l-4.8-2.75v-5.5Z"
        fill={`url(#nx-g-${id})`}
        opacity="0.95"
      />
      <circle cx="16" cy="3.5" r="1.7" fill="var(--color-accent)" />
      <circle cx="26.8" cy="22.25" r="1.7" fill="var(--color-secondary)" />
      <circle cx="5.2" cy="22.25" r="1.7" fill="color-mix(in oklab, var(--color-accent) 50%, var(--color-secondary))" />
    </svg>
  );
}
