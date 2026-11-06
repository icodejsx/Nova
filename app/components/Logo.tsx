import Link from "next/link";

export function Logo({
  markHeight = 26,
  className = "",
}: {
  markHeight?: number;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Nova home"
      className={`inline-flex items-center gap-2 text-base font-semibold tracking-tight rounded-md focus-ring ${className}`}
    >
      <span
        aria-hidden
        style={{ width: markHeight, height: markHeight }}
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg text-[13px] font-bold"
      >
        N
      </span>
      <span>Nova</span>
    </Link>
  );
}
