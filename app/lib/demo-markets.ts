import type { MarketData } from "./types";
import { parseUsdc } from "./types";
import { resolveCategory } from "./category";

const CREATOR = "GDEMOCREATORXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

function daysFromNow(days: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + days * 86400);
}

function daysAgo(days: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) - days * 86400);
}

/**
 * Demo markets for local UI when NEXT_PUBLIC_CONTRACT_ID is unset.
 * Phase B: a few invite-only markets (codes shown on create success / gate UI hints for demos).
 */
const RAW: Omit<MarketData, "category">[] = [
  {
    id: "1",
    question: "Will Bitcoin close above $150,000 by December 31, 2026?",
    endTime: daysFromNow(90),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("4200.00"),
    totalNo: parseUsdc("3100.00"),
    creator: CREATOR,
  },
  {
    id: "2",
    question: "Will Stellar network TPS exceed 5,000 sustained this quarter?",
    endTime: daysFromNow(45),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("1800.50"),
    totalNo: parseUsdc("920.25"),
    creator: CREATOR,
  },
  {
    id: "3",
    question: "Will the Fed cut rates at the next FOMC meeting?",
    endTime: daysFromNow(21),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("5500.00"),
    totalNo: parseUsdc("6100.00"),
    creator: CREATOR,
  },
  {
    id: "4",
    question: "Will Arsenal win the Premier League 2025/26?",
    endTime: daysFromNow(200),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("900.00"),
    totalNo: parseUsdc("2100.00"),
    creator: CREATOR,
  },
  {
    id: "5",
    question: "Will OpenAI release GPT-6 before July 2026?",
    endTime: daysFromNow(280),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("3200.00"),
    totalNo: parseUsdc("2800.00"),
    creator: CREATOR,
  },
  {
    id: "6",
    question: "Will USDC circulating supply on Stellar exceed $500M this year?",
    endTime: daysFromNow(120),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("750.00"),
    totalNo: parseUsdc("400.00"),
    creator: CREATOR,
  },
  {
    id: "7",
    question: "Will Ethereum flip Bitcoin in market cap by 2027?",
    endTime: daysFromNow(400),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("1100.00"),
    totalNo: parseUsdc("8900.00"),
    creator: CREATOR,
  },
  {
    id: "8",
    question: "Will GTA VI ship before December 31, 2026?",
    endTime: daysFromNow(100),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("2400.00"),
    totalNo: parseUsdc("1600.00"),
    creator: CREATOR,
  },
  {
    id: "9",
    question: "Will Solana ETF see >$1B AUM within 90 days of launch?",
    endTime: daysFromNow(60),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("1300.00"),
    totalNo: parseUsdc("1700.00"),
    creator: CREATOR,
  },
  {
    id: "10",
    question: "Will Apple announce a foldable iPhone in 2026?",
    endTime: daysFromNow(150),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("600.00"),
    totalNo: parseUsdc("1400.00"),
    creator: CREATOR,
  },
  {
    id: "11",
    question: "Did XLM close above $0.50 on September 1, 2026?",
    endTime: daysAgo(5),
    resolved: true,
    outcome: false,
    totalYes: parseUsdc("500.00"),
    totalNo: parseUsdc("800.00"),
    creator: CREATOR,
  },
  {
    id: "12",
    question: "Did NVIDIA report record data-center revenue last quarter?",
    endTime: daysAgo(10),
    resolved: true,
    outcome: true,
    totalYes: parseUsdc("2200.00"),
    totalNo: parseUsdc("900.00"),
    creator: CREATOR,
  },
  {
    id: "13",
    question: "Will France win the FIFA World Cup 2026?",
    endTime: daysFromNow(2),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("400.00"),
    totalNo: parseUsdc("350.00"),
    creator: CREATOR,
  },
  {
    id: "14",
    question: "Will a US presidential candidate withdraw before Nov 2028?",
    endTime: daysFromNow(700),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("300.00"),
    totalNo: parseUsdc("700.00"),
    creator: CREATOR,
  },
  {
    id: "15",
    question: "Will Spotify hit 300M paid subscribers in 2026?",
    endTime: daysFromNow(180),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("850.00"),
    totalNo: parseUsdc("650.00"),
    creator: CREATOR,
  },
  // Phase B — private / invite-only
  {
    id: "16",
    question: "Internal: Will our Q4 product launch hit the internal deadline?",
    endTime: daysFromNow(40),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("120.00"),
    totalNo: parseUsdc("80.00"),
    creator: CREATOR,
    isPrivate: true,
    inviteCode: "NOVA-TEAM01",
  },
  {
    id: "17",
    question: "Syndicate: Will XLM flip into the top-10 by market cap this year?",
    endTime: daysFromNow(100),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("500.00"),
    totalNo: parseUsdc("450.00"),
    creator: CREATOR,
    isPrivate: true,
    inviteCode: "NOVA-XLM99",
  },
  {
    id: "18",
    question: "Friends: Will we hit 10k Discord members before Mainnet?",
    endTime: daysFromNow(60),
    resolved: false,
    outcome: false,
    totalYes: parseUsdc("90.00"),
    totalNo: parseUsdc("110.00"),
    creator: CREATOR,
    isPrivate: true,
    inviteCode: "NOVA-DISC7",
  },
];

export const DEMO_MARKETS: MarketData[] = RAW.map((m) => ({
  ...m,
  isPrivate: m.isPrivate ?? false,
  category: resolveCategory(m.question),
}));

/** Synthetic odds history for demo charts. */
export function demoHistory(): Record<string, { t: number; yes: number }[]> {
  const out: Record<string, { t: number; yes: number }[]> = {};
  const now = Math.floor(Date.now() / 1000);
  for (const m of DEMO_MARKETS) {
    const yes = Number(m.totalYes);
    const no = Number(m.totalNo);
    const final =
      yes + no === 0 ? 50 : Math.round((yes / (yes + no)) * 100);
    const start = Math.max(20, Math.min(80, final - 12 + (Number(m.id) % 7)));
    const points = [];
    for (let i = 0; i < 8; i++) {
      const t = now - (8 - i) * 3600 * 6;
      const yesPct = Math.round(start + ((final - start) * i) / 7);
      points.push({ t, yes: yesPct });
    }
    out[m.id] = points;
  }
  return out;
}
