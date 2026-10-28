import { useId } from "react";

/**
 * Marca do I.D.I.O.T.A. — cérebro em néon (ciano → violeta) com nós de
 * circuito: inteligência digital ligada à organização do dia a dia.
 */
export function NexusMark({ className = "h-7 w-7" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const half = (
    <>
      <path d="M30.5 11.5C27.5 8.4 21.8 8.2 18.6 11.4C13.6 11.2 10.2 15.3 10.8 20C6.9 22.4 6.2 28.6 9.2 31.6C6.6 35.6 8.2 41.6 12.8 43.4C12.9 48.4 17.4 52.2 22.4 51.4C24.6 54.8 29 55.4 30.5 53.2Z" />
      <path d="M18.6 11.4C19.6 15 23.2 16.6 26.4 15.2" />
      <path d="M10.8 20C14.6 20.4 17.6 23.4 16.6 27.4" />
      <path d="M22.6 21.6C25.4 20.4 28.6 22.2 28.8 25.6" />
      <path d="M9.2 31.6C12.8 30.2 17 31.6 18.4 35.2" />
      <path d="M21.6 30.2C24.8 29.2 27.6 31.8 26.6 35.4" />
      <path d="M12.8 43.4C14.6 39.6 19.6 38.8 22.2 42" />
      <path d="M22.4 51.4C21.6 48 23.4 45.4 26.8 45.2" />
    </>
  );
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`br-g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3dd9ff" />
          <stop offset="0.55" stopColor="#6aa8ff" />
          <stop offset="1" stopColor="#b06bff" />
        </linearGradient>
        <filter id={`br-f-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        fill="none"
        stroke={`url(#br-g-${id})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#br-f-${id})`}
      >
        <g>{half}</g>
        <g transform="matrix(-1 0 0 1 64 0)">{half}</g>
      </g>
      <g filter={`url(#br-f-${id})`}>
        <circle cx="26.4" cy="15.2" r="1.8" fill="#3dd9ff" />
        <circle cx="16.6" cy="27.4" r="1.8" fill="#3dd9ff" />
        <circle cx="26.8" cy="45.2" r="1.8" fill="#9a7bff" />
        <circle cx="37.6" cy="15.2" r="1.8" fill="#6aa8ff" />
        <circle cx="47.4" cy="27.4" r="1.8" fill="#8b7cff" />
        <circle cx="37.2" cy="45.2" r="1.8" fill="#b06bff" />
        <circle cx="32" cy="32" r="2.4" fill="#e8f6ff" />
      </g>
    </svg>
  );
}
