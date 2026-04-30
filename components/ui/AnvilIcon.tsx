interface AnvilIconProps {
  className?: string;
}

export function AnvilIcon({ className }: AnvilIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 80"
      fill="currentColor"
      className={className}
    >
      {/* Horn (left tapered point) */}
      <polygon points="2,44 36,32 36,54" />
      {/* Top face / table */}
      <rect x="30" y="18" width="64" height="22" rx="3" />
      {/* Small raised step (heel) */}
      <rect x="84" y="14" width="10" height="12" rx="2" />
      {/* Waist (narrowing body) */}
      <path d="M38,40 L38,54 C38,62 62,62 62,54 L62,40 Z" />
      {/* Base */}
      <rect x="30" y="54" width="40" height="12" rx="2" />
      {/* Foot (wider) */}
      <rect x="24" y="64" width="52" height="10" rx="3" />
    </svg>
  );
}
