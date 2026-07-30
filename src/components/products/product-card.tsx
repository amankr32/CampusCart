import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin } from "lucide-react";

import { formatPrice, formatRelativeTime, CONDITION_LABELS } from "@/lib/format";
import { StarRating } from "@/components/products/star-rating";
import type { ProductListItem } from "@/db/queries/products";

export function ProductCard({
  product,
  view = "grid",
}: {
  product: ProductListItem;
  view?: "grid" | "list";
}) {
  const coverImage = product.images?.[0];

  if (view === "list") {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="group flex gap-4 rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] p-3"
      >
        <div className="relative h-28 w-28 shrink-0 rounded-lg overflow-hidden bg-black/5">
          {coverImage ? (
            <Image src={coverImage} alt={product.name} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-black/20">
              <ImageOff className="h-6 w-6" />
            </div>
          )}
          {product.status !== "available" && (
            <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--brand-black)] text-white rounded-full px-1.5 py-0.5">
              {product.status === "sold" ? "Sold" : "Reserved"}
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center gap-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-black/50 truncate">{product.tenant.storeName}</p>
          <StarRating rating={product.averageRating} count={product.reviewCount} />
          <div className="flex items-center gap-3 text-[11px] text-black/45 mt-0.5">
            {product.hostel && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {product.hostel}
              </span>
            )}
            <span>{formatRelativeTime(product.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-display font-semibold text-[var(--brand-orange)]">
              {formatPrice(product.priceCents)}
            </span>
            <span className="text-[11px] font-medium text-black/60 bg-black/5 rounded-full px-2 py-0.5">
              {CONDITION_LABELS[product.condition] ?? product.condition}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-black/5">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-black/20">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {product.status !== "available" && (
          <span className="absolute top-2 left-2 text-[11px] font-semibold uppercase tracking-wide bg-[var(--brand-black)] text-white rounded-full px-2 py-0.5">
            {product.status === "sold" ? "Sold" : "Reserved"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <p className="text-xs text-black/50 truncate">{product.tenant.storeName}</p>
        <StarRating rating={product.averageRating} count={product.reviewCount} />
        <div className="flex items-center gap-3 text-[11px] text-black/45">
          {product.hostel && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {product.hostel}
            </span>
          )}
          <span className="shrink-0">{formatRelativeTime(product.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-display font-semibold text-[var(--brand-orange)]">
            {formatPrice(product.priceCents)}
          </span>
          <span className="text-[11px] font-medium text-black/60 bg-black/5 rounded-full px-2 py-0.5">
            {CONDITION_LABELS[product.condition] ?? product.condition}
          </span>
        </div>
      </div>
    </Link>
  );
}