/** Circular YES/NO probability gauge for the featured market. */
export function ProbabilityOrbit({
  yesPercent,
  size = 196,
}: {
  yesPercent: number;
  size?: number;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const yesLen = (yesPercent / 100) * c;
  const noLen = c - yesLen;
  const noPercent = 100 - yesPercent;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${yesPercent}% chance yes`}
      >
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(61,186,126,0.12), transparent 65%)",
          }}
        />
        <svg width={size} height={size} className="relative -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r + 6}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#3dba7e"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${yesLen} ${c}`}
            className="transition-[stroke-dasharray] duration-500 ease-out"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e25555"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${noLen} ${c}`}
            strokeDashoffset={-yesLen}
            className="transition-[stroke-dasharray] duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-nums text-5xl font-semibold tracking-tight text-yes leading-none">
            {yesPercent}
            <span className="text-2xl text-yes/75">%</span>
          </span>
          <span className="mt-2 font-mono-nums text-[10px] uppercase tracking-wide text-muted">
            chance yes
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-yes">
          <span className="h-2 w-2 rounded-full bg-yes" />
          Yes {yesPercent}¢
        </span>
        <span className="inline-flex items-center gap-1.5 text-no">
          <span className="h-2 w-2 rounded-full bg-no" />
          No {noPercent}¢
        </span>
      </div>
    </div>
  );
}
