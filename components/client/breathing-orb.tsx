export function BreathingOrb({ className }: { className?: string }) {
  return (
    <div
      className={`animate-breathe motion-reduce:animate-none ${className ?? ""}`}
      aria-hidden="true"
      style={{
        width: 120,
        height: 120,
        borderRadius: "9999px",
        background: "radial-gradient(circle at 35% 30%, hsl(var(--sage)), hsl(var(--primary)) 70%)",
      }}
    />
  );
}
