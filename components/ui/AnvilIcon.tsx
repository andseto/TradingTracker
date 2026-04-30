interface AnvilIconProps {
  className?: string;
}

export function AnvilIcon({ className }: AnvilIconProps) {
  return (
    <img
      src="/anvil.png"
      alt="anvil"
      className={className}
    />
  );
}
