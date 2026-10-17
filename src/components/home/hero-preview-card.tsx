"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin, Zap, Flame, ArrowUpRight, BookOpen } from "@/components/ui/material-symbol";
import type { ProductListItem } from "@/db/queries/products";
import { formatPrice } from "@/lib/format";

interface HeroPreviewCardProps {
  product?: ProductListItem | null;
}

export function HeroPreviewCard({ product }: HeroPreviewCardProps) {
  // If no product in DB, use high-fidelity default preview item
  const title = product?.name || "Higher Engineering Mathematics — B.S. Grewal";
  const price = product ? formatPrice(product.priceCents) : "₹350";
  const originalPrice = "₹850";
  const savings = "59% OFF";
  const storeName = product?.tenant?.storeName || "Aman's Campus Store";
  const sellerHostel = "Hostel 3 (Block B)";
  const imageUrl = product?.images?.[0] || null;
  const href = product ? `/product/${product.slug}` : "/browse?category=books";

  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none group">
      {/* Ambient background glow */}
      <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Main Tilted Glassmorphism Card */}
      <div className="relative rounded-3xl bg-[var(--card-bg)]/95 backdrop-blur-xl border-2 border-[var(--border-subtle)] shadow-2xl p-5 sm:p-6 transition-all duration-500 lg:rotate-2 lg:group-hover:rotate-0 lg:group-hover:-translate-y-1">
        {/* Top Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide">
            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
            <span>Trending on Campus</span>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
            <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">{sellerHostel}</span>
          </div>
        </div>

        {/* Product Image Preview with Floating Badges */}
        <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-[var(--border-subtle)]/30 border border-[var(--border-subtle)] overflow-hidden mb-4">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-indigo-400/80 p-6 text-center">
              <BookOpen className="w-14 h-14 stroke-1 mb-2 text-indigo-500" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                B.Tech 1st Year Syllabus Reference
              </span>
            </div>
          )}

          {/* Condition floating glass pill */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-sm">
            <span>✨ Like New</span>
          </div>

          {/* Savings floating pill */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
            {savings}
          </div>
        </div>

        {/* Title & Price Info */}
        <div className="space-y-1.5 mb-4">
          <Link
            href={href}
            className="block font-display font-bold text-lg sm:text-xl text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors line-clamp-1"
          >
            {title}
          </Link>

          <div className="flex items-baseline gap-2.5">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--brand-primary)] tracking-tight">
              {price}
            </span>
            <span className="text-sm font-medium text-[var(--text-muted)] line-through">
              {originalPrice}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              Save ₹500
            </span>
          </div>
        </div>

        {/* Seller Trust Bar */}
        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              AK
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {storeName}
                </p>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Verified Student</span>
                <span>•</span>
                <span className="font-bold">⭐ 94/100 Trust</span>
              </p>
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Floating Micro-badge: Response Speed */}
      <div className="hidden sm:inline-flex items-center gap-2 absolute -bottom-3 -left-3 px-3.5 py-1.5 rounded-full bg-[var(--card-bg)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-lg text-[11px] font-semibold text-[var(--text-primary)] z-10 animate-bounce duration-1000">
        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>Typically hands off within 30 mins</span>
      </div>
    </div>
  );
}
