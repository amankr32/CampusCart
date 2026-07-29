import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff, MapPin, Store } from "lucide-react";

import { getProductBySlug, getProductReviews, getUserReviewForProduct } from "@/db/queries/products";
import { hasCompletedOrder } from "@/db/queries/orders";
import { auth } from "@/auth";
import { formatPrice, CONDITION_LABELS } from "@/lib/format";
import { StarRating } from "@/components/products/star-rating";
import { MessageSellerButton } from "@/components/products/message-seller-button";
import { ReviewForm } from "@/components/products/review-form";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Listing not found — Campus Cart" };
  }

  return {
    title: `${product.name} — Campus Cart`,
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
  const coverImage = product.images?.[0];

  return (
    <div className="max-w-(--breakpoint-lg) mx-auto w-full px-4 lg:px-12 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-lg border-2 border-black bg-black/5 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-black/20">
              <ImageOff className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          {product.category && (
            <Link
              href={`/browse?category=${product.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wide text-black/50 hover:text-black w-fit"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="font-display font-bold text-3xl leading-tight">
            {product.name}
          </h1>

          <StarRating
            rating={product.averageRating}
            count={product.reviewCount}
            size="md"
          />

          <p className="font-display font-bold text-3xl flex items-center gap-2">
            {formatPrice(product.priceCents)}
            {product.status !== "available" && (
              <span className="text-xs font-semibold uppercase tracking-wide bg-black text-white rounded-full px-2 py-1">
                {product.status === "sold" ? "Sold" : "Reserved"}
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium bg-black/5 rounded-full px-3 py-1">
              {CONDITION_LABELS[product.condition] ?? product.condition}
            </span>
            {product.hostel && (
              <span className="flex items-center gap-1 text-xs font-medium bg-black/5 rounded-full px-3 py-1">
                <MapPin className="h-3 w-3" />
                {product.hostel}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-black/70 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          <Link
            href={`/store/${product.tenant.slug}`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-black bg-white hover:bg-black/5 transition-colors w-fit"
          >
            <span className="flex items-center justify-center h-9 w-9 rounded-full bg-[var(--brand-yellow)] border-2 border-black">
              <Store className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-black/50">Sold by</span>
              <span className="font-medium">{product.tenant.storeName}</span>
            </span>
          </Link>

          <MessageSellerButton
            productId={product.id}
            productSlug={product.slug}
            sellerId={product.tenant.ownerId}
            productStatus={product.status}
          />
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 max-w-2xl" id="reviews">
        <h2 className="font-display font-bold text-2xl mb-6">
          Reviews {product.reviewCount > 0 && `(${product.reviewCount})`}
        </h2>

        {canReview && !alreadyReviewed && (
          <div className="mb-6">
            <ReviewForm productId={product.id} />
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-black/50">
            No reviews yet — be the first to buy and review this listing.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg border-2 border-black bg-white"
              >
                <StarRating rating={review.rating} showCount={false} />
                {review.description && (
                  <p className="text-black/70 text-sm mt-2">
                    {review.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
