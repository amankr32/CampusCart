"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, ChevronLeft, ChevronRight, Sparkles } from "@/components/ui/material-symbol";
import { CONDITION_LABELS } from "@/lib/format";

interface ProductImageGalleryProps {
  images?: string[];
  productName: string;
  condition: string;
  status: "available" | "reserved" | "sold" | "hidden";
}

const CONDITION_BADGES: Record<string, { label: string; icon: string }> = {
  like_new: { label: "Like New", icon: "✨" },
  new: { label: "Brand New", icon: "🌟" },
  good: { label: "Good Condition", icon: "📖" },
  fair: { label: "Fair Condition", icon: "⚡" },
  worn: { label: "Pre-loved", icon: "📦" },
};

export function ProductImageGallery({
  images = [],
  productName,
  condition,
  status,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = Array.isArray(images) && images.length > 0 ? images : [];
  const currentImage = validImages[selectedIndex];
  const conditionMeta = CONDITION_BADGES[condition] || {
    label: CONDITION_LABELS[condition] || condition,
    icon: "✨",
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Preview Container */}
      <div className="relative aspect-4/3 sm:aspect-square w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden shadow-sm group">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={`${productName} — photo ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-contain sm:object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-2">
            <ImageOff className="h-16 w-16 stroke-1" />
            <span className="text-xs font-medium">No photo available</span>
          </div>
        )}

        {/* Floating Frosted Glass Condition Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-sm">
            <span>{conditionMeta.icon}</span>
            <span>{conditionMeta.label}</span>
          </span>
        </div>

        {/* Status Ribbon (if not available) */}
        {status !== "available" && (
          <span className="absolute top-4 right-4 z-10 text-xs font-extrabold uppercase tracking-wider bg-rose-600 text-white rounded-xl px-3 py-1 shadow-md">
            {status === "sold" ? "Sold Out" : "Reserved"}
          </span>
        )}

        {/* Left / Right Carousel Navigation Controls */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/65 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/65 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Index Pill */}
        {validImages.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-black/60 backdrop-blur-md text-white/90 border border-white/10 shadow-xs">
              {selectedIndex + 1} / {validImages.length}
            </span>
          </div>
        )}
      </div>

      {/* Mini Thumbnails Strip */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {validImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={img + idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "border-[var(--brand-primary)] ring-2 ring-indigo-500/30 scale-102 shadow-xs"
                    : "border-[var(--border-subtle)] opacity-70 hover:opacity-100 hover:border-[var(--brand-primary)]/50"
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
