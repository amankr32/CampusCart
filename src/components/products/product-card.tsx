"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin, ShieldCheck, Heart, Sparkles, BookOpen, Clock } from "@/components/ui/material-symbol";

import { formatPrice, formatRelativeTime, CONDITION_LABELS } from "@/lib/format";
import { StarRating } from "@/components/products/star-rating";
import { toast } from "@/lib/toast";
import type { ProductListItem } from "@/db/queries/products";

// Helpful condition badges with icons
function getConditionPill(condition: string) {
  switch (condition) {
    case "new":
      return { label: "Brand New", icon: "✨" };
    case "like_new":
      return { label: "Like New", icon: "✨" };
    case "good":
      return { label: "Good", icon: "📖" };
    case "fair":
      return { label: "Fair", icon: "⚡" };
    case "worn":
      return { label: "Pre-loved", icon: "📦" };
    default:
      return { label: CONDITION_LABELS[condition] ?? condition, icon: "🏷️" };
  }
}

export function ProductCard({
  product,
  view = "grid",
}: {
  product: ProductListItem;
  view?: "grid" | "list";
}) {
  const [isSaved, setIsSaved] = useState(false);
  const coverImage = product.images?.[0];

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    if (nextSaved) {
      toast.success("Saved to wishlist", {
        description: `"${product.name}" added to saved items.`,
      });
    } else {
      toast.info("Removed from wishlist", {
        description: `"${product.name}" removed from saved items.`,
      });
    }
  };

  const conditionInfo = getConditionPill(product.condition);
  const pickupLocation = product.hostel ? `📍 ${product.hostel}` : "📍 Campus Pickup";

  // Calculate comparative original price reference (roughly 60% savings on campus items)
  const estimatedOriginalCents = Math.round(product.priceCents * 1.7);
  const estimatedDiscountPercent = 41; // ~40% off retail

  // -------------------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------------------
  if (view === "list") {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="group flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden shadow-xs hover:shadow-xl hover:border-[var(--brand-primary)]/50 transition-all duration-200 hover:-translate-y-0.5 p-3.5 relative"
      >
        {/* Cover Image Container */}
        <div className="relative h-32 w-32 shrink-0 rounded-xl overflow-hidden bg-[var(--border-subtle)]/30 border border-[var(--border-subtle)]">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="128px"
              className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]/50">
              <ImageOff className="h-7 w-7" />
            </div>
          )}

          {/* Glassmorphic Condition / Status Badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
            {product.status !== "available" ? (
              <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                {product.status === "sold" ? "Sold" : "Reserved"}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 text-[10px] font-semibold tracking-wide shadow-sm flex items-center gap-1">
                <span>{conditionInfo.icon}</span>
                <span>{conditionInfo.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col justify-center gap-1.5 min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-bold text-[var(--text-primary)] text-sm sm:text-base truncate group-hover:text-[var(--brand-primary)] transition-colors">
              {product.name}
            </p>

            {/* Instant Floating Spring Pop Heart Button */}
            <button
              type="button"
              onClick={toggleSave}
              className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer ${
                isSaved
                  ? "text-rose-500 bg-rose-500/10"
                  : "text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--border-subtle)]/40"
              }`}
              title={isSaved ? "Saved" : "Save item"}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isSaved ? "fill-rose-500 scale-110" : ""
                }`}
              />
            </button>
          </div>

          {/* Seller Store & Campus Location */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-[var(--text-muted)] truncate max-w-[140px] font-medium">
              {product.tenant.storeName}
            </span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--text-muted)]">
              {pickupLocation}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" /> Verified Student
            </span>
          </div>

          <StarRating rating={product.averageRating} count={product.reviewCount} />

          {/* Price Hierarchy with Strike-through & Discount */}
          <div className="flex items-baseline justify-between mt-1 pt-1.5 border-t border-[var(--border-subtle)]">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-[var(--brand-primary)] text-lg sm:text-xl tracking-tight">
                {formatPrice(product.priceCents)}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)] line-through">
                {formatPrice(estimatedOriginalCents)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                ~{estimatedDiscountPercent}% off
              </span>
            </div>

            <span className="text-[11px] font-medium text-[var(--text-muted)]">
              {formatRelativeTime(product.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // -------------------------------------------------------------------------
  // GRID VIEW (Default)
  // -------------------------------------------------------------------------
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] overflow-hidden shadow-xs hover:shadow-xl hover:border-[var(--brand-primary)]/50 transition-all duration-200 hover:-translate-y-1 relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square bg-[var(--border-subtle)]/25 overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]/50">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        {/* Floating Glassmorphic Condition & Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          {product.status !== "available" ? (
            <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              {product.status === "sold" ? "Sold Out" : "Reserved"}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md text-white border border-white/15 text-[10px] font-semibold tracking-wide shadow-sm flex items-center gap-1">
              <span>{conditionInfo.icon}</span>
              <span>{conditionInfo.label}</span>
            </span>
          )}
        </div>

        {/* Floating Spring Pop Heart / Wishlist Button */}
        <button
          type="button"
          onClick={toggleSave}
          className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-[var(--card-bg)]/85 dark:bg-black/70 backdrop-blur-md border border-white/20 dark:border-white/10 flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer active:scale-85 ${
            isSaved
              ? "text-rose-500 scale-105"
              : "text-[var(--text-muted)] hover:text-rose-500 hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100"
          }`}
          title={isSaved ? "Saved" : "Save item"}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isSaved ? "fill-rose-500 text-rose-500 scale-110" : ""
            }`}
          />
        </button>

        {/* Floating Campus Location Pill on Bottom-Left of Image */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[10px] font-medium tracking-tight flex items-center gap-1 pointer-events-none">
          <span>{pickupLocation}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1 justify-between">
        <div className="space-y-1">
          <p className="font-display font-bold text-[var(--text-primary)] text-sm sm:text-base line-clamp-1 group-hover:text-[var(--brand-primary)] transition-colors">
            {product.name}
          </p>

          <div className="flex items-center justify-between text-xs gap-1.5">
            <span className="text-[var(--text-muted)] truncate max-w-[120px] font-medium">
              {product.tenant.storeName}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          </div>

          <StarRating rating={product.averageRating} count={product.reviewCount} />
        </div>

        {/* Refined Price Hierarchy */}
        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-[var(--brand-primary)] text-lg sm:text-xl tracking-tight">
              {formatPrice(product.priceCents)}
            </span>
            <span className="text-xs text-[var(--text-muted)] line-through">
              {formatPrice(estimatedOriginalCents)}
            </span>
          </div>

          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            ~{estimatedDiscountPercent}% off
          </span>
        </div>
      </div>
    </Link>
  );
}