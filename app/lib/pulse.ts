import type { Category } from "./category";

export type PulseKind = "news" | "market";

export interface PulseItem {
  id: string;
  kind: PulseKind;
  title: string;
  source: string;
  url?: string;
  category: Category;
  publishedAt: number;
  relatedMarketId?: string;
  relatedLabel?: string;
}
