"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ImageOff,
  MapPin,
  ShieldCheck,
  Heart,
  Sparkles,
  BookOpen,
  Laptop,
  Bike,
  BedDouble,
  PenTool,
  Dumbbell,
  Tag,
} from "@/components/ui/material-symbol";

import { formatPrice, formatRelativeTime, CONDITION_LABELS } from "@/lib/format";
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

function getCategoryIcon(slug?: string) {
  switch (slug) {
    case "books":
      return { Icon: BookOpen, bg: "bg-rose-50 text-rose-600 border-rose-200" };
    case "electronics":
      return { Icon: Laptop, bg: "bg-blue-50 text-blue-600 border-blue-200" };
    case "transport":
      return { Icon: Bike, bg: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    case "hostel":
      return { Icon: BedDouble, bg: "bg-amber-50 text-amber-600 border-amber-200" };
    case "stationery":
      return { Icon: PenTool, bg: "bg-purple-50 text-purple-600 border-purple-200" };
    default:
      return { Icon: BookOpen, bg: "bg-blue-50 text-blue-600 border-blue-200" };
  }
}

export function ProductCard({
  product,
  view = "grid",
  isFeatured = false,
}: {
  product: ProductListItem;
  view?: "grid" | "list";
  isFeatured?: boolean;
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
  const pickupLocation = product.hostel || "Central Library";
  const { Icon: CatIcon, bg: catBg } = getCategoryIcon(product.category?.slug);
  const sellerHandle = `@${product.tenant.storeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "student"}`;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 gap-4"
    >
      {/* Figma FEATURED Pill Tag */}
      {isFeatured && (
        <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
          FEATURED
        </div>
      )}

      {/* Card Header: Icon/Image + Title + Handle + Verified Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Category Icon or Thumbnail */}
          {coverImage ? (
            <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <Image
                src={coverImage}
                alt={product.name}
                fill
                sizes="44px"
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className={`flex items-center justify-center h-11 w-11 rounded-xl border shrink-0 ${catBg}`}>
              <CatIcon className="h-5 w-5" strokeWidth={2} />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              <span>{sellerHandle}</span>
              <span className="mx-1.5">&bull;</span>
              <span>{product.category?.name ?? "Campus Gear"}</span>
            </p>
          </div>
        </div>

        {/* Verified Badge / Save Heart */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Verified</span>
          </span>

          <button
            type="button"
            onClick={toggleSave}
            className={`p-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer ${
              isSaved
                ? "text-rose-500 bg-rose-50"
                : "text-slate-300 hover:text-rose-500 hover:bg-slate-50"
            }`}
            title={isSaved ? "Saved" : "Save item"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isSaved ? "fill-rose-500 scale-110" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Two Key Metrics (Figma 2-Column Stats: Condition & Location) */}
      <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="text-sm">{conditionInfo.icon}</span>
          <span className="truncate font-medium">{conditionInfo.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate font-medium">{pickupLocation}</span>
        </div>
      </div>

      {/* Tags Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {product.branch && (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 text-[10px] font-semibold">
            {product.branch}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold">
          IKGPTU Roll Verified
        </span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
          0% Commission
        </span>
      </div>

      {/* Description Snippet (Figma 2-line snippet) */}
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
        {product.description ||
          "Direct student listing available for physical on-campus inspection and instant handoff."}
      </p>

      {/* Card Footer: Price on Left, More Details on Right */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <span className="font-display font-black text-xl text-slate-900 tracking-tight">
            {formatPrice(product.priceCents)}
          </span>
        </div>

        <span className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
          More Details
        </span>
      </div>
    </Link>
  );
}