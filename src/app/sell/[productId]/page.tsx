import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getProductById } from "@/db/queries/products";
import { getTopLevelCategories } from "@/db/queries/categories";
import { ProductForm } from "@/components/store/product-form";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);
  const product = await getProductById(productId);

  // Ownership check: a seller can only edit their own listings.
  if (!tenant || !product || product.tenantId !== tenant.id) {
    notFound();
  }

  const categories = await getTopLevelCategories();

  return (
    <div className="max-w-(--breakpoint-sm) mx-auto w-full px-4 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-black/50 hover:text-black"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mt-3">Edit listing</h1>
      </div>

      <ProductForm
        categories={categories}
        productId={product.id}
        defaultValues={{
          name: product.name,
          description: product.description ?? "",
          priceRupees: product.priceCents / 100,
          condition: product.condition,
          categoryId: product.categoryId ?? "",
          hostel: product.hostel ?? "",
          branch: product.branch ?? "",
          quantity: product.quantity,
          images: product.images,
        }}
      />
    </div>
  );
}
