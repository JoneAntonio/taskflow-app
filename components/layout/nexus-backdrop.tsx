/**
 * Campo orbital do JAFLOW Nexus — o mesmo fundo do ecrã de início de sessão
 * (núcleo luminoso, órbitas animadas e grelha técnica), partilhado pelo login
 * e por todas as páginas da app.
 */
export function OrbitField({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-orbit`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3dd9ff" />
          <stop offset="1" stopColor="#8b7cff" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3dd9ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3dd9ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="300" r="120" fill={`url(#${id}-core)`} />
      {[110, 170, 235, 290].map((r, i) => (
        <g
          key={r}
          className="nx-orbit"
          style={{ transformOrigin: "300px 300px", animation: `nx-spin ${40 + i * 18}s linear infinite${i % 2 ? " reverse" : ""}` }}
        >
          <circle
            cx="300"
            cy="300"
            r={r}
            fill="none"
            stroke={`url(#${id}-orbit)`}
            strokeOpacity={0.35 - i * 0.06}
            strokeDasharray={i % 2 ? "2 6" : "none"}
          />
          <circle
            cx={300 + r}
            cy="300"
            r={i === 0 ? 4 : 3}
            fill={i % 2 ? "#8b7cff" : "#3dd9ff"}
            style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
          />
        </g>
      ))}
    </svg>
  );
}

/** Fundo fixo de página inteira: campo orbital à direita (a grelha vem do body::before). */
export function NexusBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      <OrbitField
        id="app-bg"
        className="absolute right-[-260px] top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-60 sm:right-[-200px] sm:h-[720px] sm:w-[720px] lg:right-[-120px] lg:opacity-80"
      />
    </div>
  );
}
