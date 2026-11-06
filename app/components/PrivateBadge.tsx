/** Small lock badge for invite-only markets. */
export function PrivateBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border border-accent/30 text-accent ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      Private
    </span>
  );
}
