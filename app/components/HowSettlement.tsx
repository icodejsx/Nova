import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Pick a market",
    text: "Browse open YES/NO questions across crypto, sports, politics, and more.",
  },
  {
    n: "02",
    title: "Bet with USDC",
    text: "Connect Freighter and stake on an outcome while the market is live.",
  },
  {
    n: "03",
    title: "Creator resolves",
    text: "After close, the market creator posts the final YES or NO on-chain.",
  },
  {
    n: "04",
    title: "Winners claim",
    text: "Winning stakes share the losing pool, minus a 2% fee.",
  },
];

export function HowSettlement() {
  return (
    <section className="border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="font-mono-nums text-[10px] uppercase tracking-wider text-accent mb-1.5">
              Protocol
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              How settlement works
            </h2>
            <p className="text-xs text-muted mt-1 max-w-md">
              Simple pool odds on Stellar. No order book — stakes set the price.
            </p>
          </div>
          <Link
            href="/create"
            className="text-xs px-3.5 py-2 rounded-lg bg-accent text-accent-fg font-semibold hover:bg-accent-hover transition-colors focus-ring"
          >
            Create a market
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step) => (
            <div key={step.n} className="panel rounded-xl p-4">
              <div className="font-mono-nums text-[11px] text-accent mb-3">
                {step.n}
              </div>
              <h3 className="text-sm font-medium mb-1.5">{step.title}</h3>
              <p className="text-[12px] leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
