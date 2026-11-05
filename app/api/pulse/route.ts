import { NextResponse } from "next/server";
import { inferCategory } from "@/app/lib/category";
import { DEMO_MARKETS } from "@/app/lib/demo-markets";
import { getYesPercent } from "@/app/lib/odds";
import type { PulseItem } from "@/app/lib/pulse";

const FEEDS: { source: string; url: string }[] = [
  { source: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  {
    source: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    source: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
];

const CACHE_MS = 5 * 60_000;
let cached: { at: number; items: PulseItem[] } | null = null;

function decodeXml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function tag(block: string, name: string): string {
  const cdata = block.match(
    new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${name}>`, "i")
  );
  if (cdata?.[1]) return decodeXml(cdata[1]);
  const plain = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return plain?.[1] ? decodeXml(plain[1]) : "";
}

function parseRss(xml: string, source: string): PulseItem[] {
  const out: PulseItem[] = [];
  const re = /<item\b[\s\S]*?<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && out.length < 8) {
    const block = m[0];
    const title = tag(block, "title");
    if (!title) continue;
    const link = tag(block, "link") || tag(block, "guid");
    const pub = tag(block, "pubDate");
    const publishedAt = pub ? Date.parse(pub) || Date.now() : Date.now();
    out.push({
      id: `news-${source}-${out.length}-${publishedAt}`,
      kind: "news",
      title,
      source,
      url: link || undefined,
      category: inferCategory(title),
      publishedAt,
    });
  }
  return out;
}

async function fetchFeed(source: string, url: string): Promise<PulseItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        "User-Agent": "NovaPulse/1.0 (+https://nova.markets)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml, source);
  } catch {
    return [];
  }
}

function marketSignals(): PulseItem[] {
  const now = Date.now();
  const nowSec = BigInt(Math.floor(now / 1000));
  const items: PulseItem[] = [];

  for (const m of DEMO_MARKETS.slice(0, 10)) {
    const yes = getYesPercent(m.totalYes, m.totalNo);
    const short =
      m.question.length > 72 ? `${m.question.slice(0, 69)}…` : m.question;

    if (m.resolved) {
      items.push({
        id: `mkt-settled-${m.id}`,
        kind: "market",
        title: `Settled · ${m.outcome ? "YES" : "NO"} won — ${short}`,
        source: "Nova",
        category: m.category,
        publishedAt: now - Number(m.id) * 90_000,
        relatedMarketId: m.id,
        relatedLabel: "View market",
      });
      continue;
    }

    if (m.endTime - nowSec < BigInt(86400 * 3) && m.endTime > nowSec) {
      items.push({
        id: `mkt-closing-${m.id}`,
        kind: "market",
        title: `Closing soon · ${yes}% YES — ${short}`,
        source: "Nova",
        category: m.category,
        publishedAt: now - Number(m.id) * 60_000,
        relatedMarketId: m.id,
        relatedLabel: "Trade",
      });
    } else {
      items.push({
        id: `mkt-odds-${m.id}`,
        kind: "market",
        title: `Odds update · ${yes}% chance yes — ${short}`,
        source: "Nova",
        category: m.category,
        publishedAt: now - Number(m.id) * 45_000,
        relatedMarketId: m.id,
        relatedLabel: "Trade",
      });
    }
  }

  return items.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 8);
}

function attachRelatedMarkets(news: PulseItem[]): PulseItem[] {
  const open = DEMO_MARKETS.filter((m) => !m.resolved);
  return news.map((item) => {
    const hit = open.find(
      (m) =>
        m.category === item.category ||
        item.title
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 4)
          .some((w) => m.question.toLowerCase().includes(w))
    );
    if (!hit) return item;
    return {
      ...item,
      relatedMarketId: hit.id,
      relatedLabel: "Related market",
    };
  });
}

async function buildPulse(): Promise<PulseItem[]> {
  const feeds = await Promise.all(FEEDS.map((f) => fetchFeed(f.source, f.url)));
  const news = attachRelatedMarkets(
    feeds
      .flat()
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, 16)
  );
  const markets = marketSignals();

  // Interleave: news, market, news, market…
  const merged: PulseItem[] = [];
  const n = Math.max(news.length, markets.length);
  for (let i = 0; i < n; i++) {
    if (news[i]) merged.push(news[i]);
    if (markets[i]) merged.push(markets[i]);
  }
  return merged.slice(0, 24);
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    return NextResponse.json(
      { items: cached.items, cached: true, updatedAt: cached.at },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  const items = await buildPulse();
  cached = { at: now, items };

  return NextResponse.json(
    { items, cached: false, updatedAt: now },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
