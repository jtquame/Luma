export function BrandArch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 90V40C10 18 32 4 60 4C88 4 110 18 110 40V90"
        stroke="hsl(var(--accent))"
        strokeWidth="1.5"
      />
      <path
        d="M0 90V46C0 20 26 2 60 2C94 2 120 20 120 46V90"
        stroke="hsl(var(--accent))"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M60 0L61.6 5.6L67 4L63.6 8.6L69 10L63.4 11.4L67 16L61.4 13.6L60 19L58.6 13.6L53 16L56.6 11.4L51 10L56.4 8.6L53 4L58.4 5.6L60 0Z"
        fill="hsl(var(--accent))"
      />
    </svg>
  );
}
