"use client";

import { useState } from "react";
import type { Category } from "@/app/lib/category";
import {
  CATEGORY_GLYPH,
  fallbackGradient,
  resolveMarketImage,
} from "@/app/lib/marketImage";

export function MarketThumb({
  address,
  question,
  category,
  size = 44,
  rounded = "rounded-lg",
}: {
  address: string;
  question: string;
  category: Category;
  size?: number;
  rounded?: string;
}) {
  const image = resolveMarketImage(question);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showImage = image !== null && !broken;

  if (!showImage) {
    return (
      <div
        className={`shrink-0 ${rounded} overflow-hidden border border-white/10 flex items-center justify-center`}
        style={{
          width: size,
          height: size,
          background: fallbackGradient(address),
        }}
      >
        <span
          aria-hidden
          className="text-white/85 drop-shadow"
          style={{ fontSize: size * 0.4, lineHeight: 1 }}
        >
          {CATEGORY_GLYPH[category]}
        </span>
      </div>
    );
  }

  // Flags read better edge-to-edge; token and brand marks need breathing room.
  const isFlag = image.kind === "flag";

  return (
    <div
      className={`relative shrink-0 ${rounded} overflow-hidden border border-white/10 bg-white/5`}
      style={{ width: size, height: size }}
    >
      {!loaded && <div className="absolute inset-0 animate-shimmer" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setBroken(true)}
        className={`w-full h-full transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${isFlag ? "object-cover" : "object-contain p-1.5"}`}
      />
    </div>
  );
}
