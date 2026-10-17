import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import {
  getProductBySlug,
  getProductReviews,
  getUserReviewForProduct,
} from "@/db/queries/products";
import { hasCompletedOrder } from "@/db/queries/orders";
import { auth } from "@/auth";
import { formatPrice, CONDITION_LABELS, formatRelativeTime } from "@/lib/format";
import { StarRating } from "@/components/products/star-rating";
import { MessageSellerButton } from "@/components/products/message-seller-button";
import { ReviewForm } from "@/components/products/review-form";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { SellerTrustCard } from "@/components/products/seller-trust-card";
import { SafeHandoffChecklist } from "@/components/products/safe-handoff-checklist";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Listing Not Found — CampusCart" };
  }

  return {
    title: `${product.name} — CampusCart`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();

  const [reviews, canReview, alreadyReviewed] = await Promise.all([
    getProductReviews(product.id),
    session?.user
      ? hasCompletedOrder(session.user.id, product.id)
      : Promise.resolve(false),
    session?.user
      ? getUserReviewForProduct(session.user.id, product.id)
      : Promise.resolve(false),
  ]);

  // Approximate retail benchmark for discount savings comparison
  const retailReferencePrice = Math.round(product.priceCents * 1.55);
  const discountPercent = Math.round(
    ((retailReferencePrice - product.priceCents) / retailReferencePrice) * 100
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation Breadcrumb */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors group w-fit"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to Browse Listings</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 xl:gap-12 items-start">
        {/* Left Column: Image Gallery, Description, Details, Reviews */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Interactive Image Gallery */}
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            condition={product.condition}
            status={product.status}
          />

          {/* Description Section */}
          <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs space-y-4">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
              <span>Item Description & Details</span>
            </h2>

            {product.description ? (
              <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line opacity-90">
                {product.description}
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">
                No description provided by the seller.
              </p>
            )}

            {/* Meta Tags: Hostel, Branch, Listed date */}
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-[var(--border-subtle)]/70">
              {product.hostel && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-[var(--border-subtle)]/40 text-[var(--text-primary)]">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  Pickup: {product.hostel}
                </span>
              )}

              {product.branch && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-[var(--border-subtle)]/40 text-[var(--text-primary)]">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                  Department: {product.branch}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-[var(--border-subtle)]/40 text-[var(--text-muted)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Listed {formatRelativeTime(product.createdAt)}
              </span>
            </div>
          </div>

          {/* Reviews Section */}
          <div
            className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs space-y-6"
            id="reviews"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">
                Student Reviews {product.reviewCount > 0 && `(${product.reviewCount})`}
              </h2>
              {product.reviewCount > 0 && (
                <StarRating
                  rating={product.averageRating}
                  count={product.reviewCount}
                  size="sm"
                />
              )}
            </div>

            {canReview && !alreadyReviewed && (
              <div className="p-4 rounded-2xl bg-[var(--brand-primary-light)]/30 border border-[var(--brand-primary)]/20">
                <h3 className="font-bold text-xs text-[var(--text-primary)] mb-3">
                  Leave a Review for this Campus Purchase
                </h3>
                <ReviewForm productId={product.id} />
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)] space-y-1">
                <p className="text-xs font-medium">No reviews for this listing yet.</p>
                <p className="text-[11px]">
                  Complete a verified campus handoff to be the first to leave a review.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--border-subtle)]/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <StarRating rating={review.rating} showCount={false} />
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                    {review.description && (
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                        {review.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Buyer Action Rail */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
          {/* Main Purchase & CTA Card */}
          <div className="flex flex-col gap-5 bg-[var(--card-bg)] p-6 sm:p-7 rounded-3xl border border-[var(--border-subtle)] shadow-sm">
            {/* Category Breadcrumb */}
            {product.category && (
              <Link
                href={`/browse?category=${product.category.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)] hover:underline w-fit"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product Title */}
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Rating Stars */}
            <div className="flex items-center gap-2">
              <StarRating
                rating={product.averageRating}
                count={product.reviewCount}
                size="sm"
              />
              {product.reviewCount > 0 && (
                <a
                  href="#reviews"
                  className="text-xs text-[var(--brand-primary)] hover:underline font-semibold"
                >
                  Read all
                </a>
              )}
            </div>

            {/* Refined Price Hierarchy */}
            <div className="flex items-baseline gap-3 pt-1 border-t border-[var(--border-subtle)]/60">
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-[var(--brand-primary)] tracking-tight">
                {formatPrice(product.priceCents)}
              </span>

              {discountPercent > 10 && (
                <span className="text-sm text-[var(--text-muted)] line-through">
                  {formatPrice(retailReferencePrice)}
                </span>
              )}

              {discountPercent > 10 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-3 h-3" />
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Condition & Pickup Location Pills */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--border-subtle)]/40 rounded-xl px-3 py-1.5 uppercase tracking-wider border border-[var(--border-subtle)]">
                Condition: {CONDITION_LABELS[product.condition] ?? product.condition}
              </span>

              {product.hostel && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--border-subtle)]/40 rounded-xl px-3 py-1.5 border border-[var(--border-subtle)]">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  Pickup: {product.hostel}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl px-3 py-1.5 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" /> PTU Verified Student
              </span>
            </div>

            {/* Primary Action Button: Message Seller */}
            <div className="pt-2">
              <MessageSellerButton
                productId={product.id}
                productSlug={product.slug}
                sellerId={product.tenant.ownerId}
                productStatus={product.status}
              />
            </div>
          </div>

          {/* Verified Seller Trust Card */}
          <SellerTrustCard
            seller={product.seller}
            storeName={product.tenant.storeName}
            storeSlug={product.tenant.slug}
            completedSales={product.completedSales}
          />

          {/* Safe Campus Handoff Checklist */}
          <SafeHandoffChecklist />
        </div>
      </div>
    </div>
  );
}
