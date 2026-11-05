import Link from "next/link";

export function Logo({
  markHeight = 28,
  className = "",
}: {
  markHeight?: number;
  className?: string;
}) {
  const size = markHeight;
  return (
    <Link
      href="/"
      aria-label="Nova home"
      className={`inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight rounded-md focus-ring ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="16" cy="16" r="15" fill="#0f0f0f" stroke="#2a2a2a" />
        <path
          d="M16 7L17.6 13.4L24 15L17.6 16.6L16 23L14.4 16.6L8 15L14.4 13.4L16 7Z"
          fill="#FDDA24"
        />
      </svg>
      <span>
        No<span className="text-accent">va</span>
      </span>
    </Link>
  );
}
