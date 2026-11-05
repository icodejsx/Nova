import type { Category } from "./category";

const TOKEN_BASE =
  "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color";

export type ThumbKind = "token" | "logo" | "flag";

export interface MarketImage {
  src: string;
  kind: ThumbKind;
}

const token = (symbol: string): MarketImage => ({
  src: `${TOKEN_BASE}/${symbol}.svg`,
  kind: "token",
});

const flag = (code: string): MarketImage => ({
  src: `https://flagcdn.com/w160/${code}.png`,
  kind: "flag",
});

const logo = (domain: string): MarketImage => ({
  src: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  kind: "logo",
});

/**
 * Markets are created on-chain with only a question and an end time, so there is
 * no stored image. Each question is matched against the subjects below and the
 * *earliest mention wins* — in "Will Ethereum flip Bitcoin", Ethereum is the
 * subject even though Bitcoin also appears.
 */
const SUBJECTS: [RegExp, MarketImage][] = [
  // ── Tokens ──
  [/\bbitcoin\b|\bbtc\b/i, token("btc")],
  [/\bethereum\b|\beth\b|\bether\b/i, token("eth")],
  [/\bavalanche\b|\bavax\b/i, token("avax")],
  [/\bsolana\b|\bsol\b/i, token("sol")],
  [/\bcardano\b|\bada\b/i, token("ada")],
  [/\bdogecoin\b|\bdoge\b/i, token("doge")],
  [/\bripple\b|\bxrp\b/i, token("xrp")],
  [/\bpolkadot\b/i, token("dot")],
  [/\bchainlink\b/i, token("link")],
  [/\bpolygon\b|\bmatic\b/i, token("matic")],
  [/\blitecoin\b|\bltc\b/i, token("ltc")],
  [/\bmonero\b|\bxmr\b/i, token("xmr")],
  [/\btron\b|\btrx\b/i, token("trx")],
  [/\bstellar\b|\bxlm\b/i, token("xlm")],
  [/\btether\b|\busdt\b/i, token("usdt")],
  [/\busdc\b|\bstablecoin\b|\bstable coin\b/i, token("usdc")],
  [/\bbnb\b/i, token("bnb")],

  // ── Football clubs ──
  [/\breal madrid\b/i, logo("realmadrid.com")],
  [/\bbarcelona\b|\bbarca\b/i, logo("fcbarcelona.com")],
  [/\barsenal\b/i, logo("arsenal.com")],
  [/\bmanchester united\b|\bman united\b|\bman utd\b/i, logo("manutd.com")],
  [/\bmanchester city\b|\bman city\b/i, logo("mancity.com")],
  [/\bliverpool\b/i, logo("liverpoolfc.com")],
  [/\bchelsea\b/i, logo("chelseafc.com")],
  [/\btottenham\b|\bspurs\b/i, logo("tottenhamhotspur.com")],
  [/\bbayern\b/i, logo("fcbayern.com")],
  [/\bjuventus\b/i, logo("juventus.com")],
  [/\binter milan\b|\bac milan\b/i, logo("acmilan.com")],
  [/\bpsg\b|\bparis saint\b/i, logo("psg.fr")],

  // ── Players resolve to the country they play for ──
  [/\bmbappe\b|\bmbappé\b/i, flag("fr")],
  [/\bmessi\b/i, flag("ar")],
  [/\bronaldo\b/i, flag("pt")],
  [/\bneymar\b/i, flag("br")],
  [/\bhaaland\b/i, flag("no")],
  [/\bsalah\b/i, flag("eg")],
  [/\bosimhen\b/i, flag("ng")],

  // ── Leagues and competitions ──
  [/\bpremier league\b|\bepl\b/i, logo("premierleague.com")],
  [/\bchampions league\b|\buefa\b|\beuropa league\b/i, logo("uefa.com")],
  [/\bworld cup\b|\bfifa\b/i, logo("fifa.com")],
  [/\bla liga\b/i, logo("laliga.com")],
  [/\bnba\b/i, logo("nba.com")],
  [/\bboston celtics\b|\bceltics\b/i, logo("nba.com/celtics")],
  [/\bnfl\b|\bsuper bowl\b/i, logo("nfl.com")],
  [/\bolympics?\b|\bolympic\b/i, logo("olympics.com")],
  [/\bformula 1\b|\bf1\b|\bgrand prix\b/i, logo("formula1.com")],

  // ── Companies and institutions ──
  [/\bapple\b|\biphone\b|\bsiri\b/i, logo("apple.com")],
  [/\bopenai\b|\bchatgpt\b|\bgpt-?\d?\b/i, logo("openai.com")],
  [/\bnvidia\b/i, logo("nvidia.com")],
  [/\bsamsung\b/i, logo("samsung.com")],
  [/\btesla\b/i, logo("tesla.com")],
  [/\bnetflix\b/i, logo("netflix.com")],
  [/\bamazon\b/i, logo("amazon.com")],
  [/\bgoogle\b|\bgemini\b|\balphabet\b/i, logo("google.com")],
  [/\bmicrosoft\b|\bcopilot\b/i, logo("microsoft.com")],
  [/\bspacex\b|\bstarship\b/i, logo("spacex.com")],
  [/\bmeta\b|\bfacebook\b|\binstagram\b/i, logo("meta.com")],
  [/\banthropic\b|\bclaude\b/i, logo("anthropic.com")],
  [/\bcoinbase\b/i, logo("coinbase.com")],
  [/\bbinance\b/i, logo("binance.com")],
  [/\bspotify\b/i, logo("spotify.com")],
  [/\btiktok\b/i, logo("tiktok.com")],
  [/\btwitter\b/i, logo("x.com")],
  [/\bdisney\b/i, logo("disney.com")],
  [/\buber\b/i, logo("uber.com")],
  // The optional "US" prefix is consumed here so this wins over the US flag
  [/\b(?:us\s+)?federal reserve\b|\bthe fed\b|\bfomc\b/i, logo("federalreserve.gov")],
  [/\bdangote\b/i, logo("dangote.com")],
  [/\bbank of england\b/i, logo("bankofengland.co.uk")],
  [/\bs&p(?: 500)?\b|\bstandard & poor/i, logo("spglobal.com")],
  [/\bgold\b/i, logo("gold.org")],
  [/\brockstar\b|\bgta(?: vi| 6)?\b/i, logo("rockstargames.com")],
  [/\bdemocrat(?:s|ic)?\b/i, logo("democrats.org")],
  [/\brepublican(?:s)?\b|\bgop\b/i, logo("gop.com")],

  // ── Countries ──
  [/\bargentina\b/i, flag("ar")],
  [/\bfrance\b|\bfrench\b/i, flag("fr")],
  [/\bbrazil\b/i, flag("br")],
  [/\bengland\b/i, flag("gb-eng")],
  [/\bscotland\b/i, flag("gb-sct")],
  [/\bunited kingdom\b|\bbritain\b|\bbritish\b|\buk\b/i, flag("gb")],
  [/\bunited states\b|\bamerica\b|\bamerican\b|\bus\b|\busa\b/i, flag("us")],
  [/\bgermany\b|\bgerman\b/i, flag("de")],
  [/\bspain\b|\bspanish\b/i, flag("es")],
  [/\bitaly\b|\bitalian\b/i, flag("it")],
  [/\bportugal\b/i, flag("pt")],
  [/\bnetherlands\b|\bdutch\b/i, flag("nl")],
  [/\bnigeria\b|\bnigerian\b/i, flag("ng")],
  [/\bjapan\b|\bjapanese\b/i, flag("jp")],
  [/\bchina\b|\bchinese\b/i, flag("cn")],
  [/\bindia\b|\bindian\b/i, flag("in")],
  [/\bcanada\b/i, flag("ca")],
  [/\bmexico\b/i, flag("mx")],
  [/\brussia\b|\brussian\b/i, flag("ru")],
  [/\bukraine\b/i, flag("ua")],
  [/\bisrael\b/i, flag("il")],
  [/\biran\b/i, flag("ir")],
  [/\bsouth korea\b|\bkorea\b/i, flag("kr")],
  [/\baustralia\b/i, flag("au")],
  [/\bsouth africa\b/i, flag("za")],
  [/\bkenya\b/i, flag("ke")],
  [/\bghana\b/i, flag("gh")],
  [/\begypt\b/i, flag("eg")],
];

export function resolveMarketImage(question: string): MarketImage | null {
  let best: MarketImage | null = null;
  let bestIndex = Infinity;

  for (const [pattern, image] of SUBJECTS) {
    const index = question.search(pattern);
    if (index !== -1 && index < bestIndex) {
      bestIndex = index;
      best = image;
    }
  }

  return best;
}

/**
 * Stable hue derived from the market address so a market without a recognised
 * subject still gets its own consistent colour on every render and reload.
 */
export function addressHue(address: string): number {
  let hash = 0;
  for (let i = 2; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) % 360;
  }
  return hash;
}

export function fallbackGradient(address: string): string {
  const hue = addressHue(address);
  return `linear-gradient(135deg, hsl(${hue} 55% 32%), hsl(${
    (hue + 45) % 360
  } 60% 18%))`;
}

export const CATEGORY_GLYPH: Record<Category, string> = {
  Crypto: "₿",
  Finance: "$",
  Sports: "⚽",
  Politics: "🏛",
  Technology: "⌘",
  "Pop Culture": "★",
  Other: "◆",
};
