/**
 * Prints demo market seed list. On-chain seeding uses Freighter + registry after deploy.
 * Run: npm run seed
 */
import { DEMO_MARKETS } from "../app/lib/demo-markets";
import { formatUsdc } from "../app/lib/types";
import { getYesPercent } from "../app/lib/odds";

console.log(`Nova demo seed — ${DEMO_MARKETS.length} markets\n`);

for (const m of DEMO_MARKETS) {
  const yes = getYesPercent(m.totalYes, m.totalNo);
  const vol = formatUsdc(m.totalYes + m.totalNo, 2);
  console.log(
    `#${m.id.padStart(2, " ")}  ${m.category.padEnd(12)}  ${yes}% YES  ${vol} USDC  ${m.resolved ? "SETTLED" : "LIVE"}`
  );
  console.log(`     ${m.question}\n`);
}

console.log(
  "After Testnet deploy: loop create_market via admin Freighter key, then bet seed liquidity."
);
