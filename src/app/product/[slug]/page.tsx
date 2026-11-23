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
} from "@/components/ui/material-symbol";

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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back Navigation Breadcrumb (FlipEarn pill style) */}
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all shadow-2xs group w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>Go to Previous Page</span>
      </Link>

      {/* Top Header Overview Card (Figma step_52_media_0.png) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2.5 min-w-0">
          {product.category && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block">
              {product.category.name}
            </span>
          )}
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              @{product.seller.username || "student"}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {product.hostel || "Campus Library / Meetup"}
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              IKGPTU Verified Student
            </span>
          </div>
        </div>

        <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Asking Price
          </span>
          <span className="font-display font-black text-3xl sm:text-4xl text-blue-600 tracking-tight">
            {formatPrice(product.priceCents)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Direct Campus Handoff &bull; 0% Fee
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 xl:gap-10 items-start">
        {/* Left Column: Image Gallery, Specs, Description, Reviews */}
        <div className="flex flex-col gap-8 min-w-0">
          {/* Interactive Image Gallery */}
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            condition={product.condition}
            status={product.status}
          />

          {/* Quick Specs Grid (Figma Specs Card) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Condition</span>
              <p className="font-bold text-slate-900 text-xs truncate">
                {CONDITION_LABELS[product.condition] ?? product.condition}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Department</span>
              <p className="font-bold text-slate-900 text-xs truncate">
                {product.branch || "General Campus"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pickup Spot</span>
              <p className="font-bold text-slate-900 text-xs truncate">
                {product.hostel || "Central Library"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Listed Date</span>
              <p className="font-bold text-slate-900 text-xs truncate">
                {formatRelativeTime(product.createdAt)}
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-slate-900">
              Item Description &amp; Notes
            </h2>

            {product.description ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No extra description provided by the seller.
              </p>
            )}
          </div>

          {/* Reviews Section */}
          <div
            className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6"
            id="reviews"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-slate-900">
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
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60">
                <h3 className="font-bold text-xs text-slate-900 mb-3">
                  Leave a Review for this Campus Purchase
                </h3>
                <ReviewForm productId={product.id} />
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <p className="text-xs font-medium">No reviews for this listing yet.</p>
                <p className="text-[11px]">
                  Complete a verified campus handoff to leave a review.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <StarRating rating={review.rating} showCount={false} />
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                    {review.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
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
          {/* Action Box with Message Seller CTA */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Campus Availability
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                ● Available Now
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Message the seller directly to negotiate, ask questions, or arrange a convenient campus meetup spot.
            </p>

            <MessageSellerButton
              productId={product.id}
              productSlug={product.slug}
              sellerId={product.tenant.ownerId}
              productStatus={product.status}
            />
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
