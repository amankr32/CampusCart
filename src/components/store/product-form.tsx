"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/products/image-uploader";
import { CONDITION_LABELS } from "@/lib/format";
import {
  productSchema,
  PRODUCT_CONDITIONS,
  type ProductInput,
} from "@/lib/validations/store";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/store";

interface Category {
  id: string;
  name: string;
}

export function ProductForm({
  categories,
  productId,
  defaultValues,
}: {
  categories: Category[];
  productId?: string;
  defaultValues?: Partial<ProductInput>;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      priceRupees: 0,
      condition: "good",
      categoryId: "",
      hostel: "",
      branch: "",
      quantity: 1,
      images: [],
      ...defaultValues,
    },
  });

  const images = watch("images");

  const onSubmit = async (values: ProductInput) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = productId
      ? await updateProductAction(productId, values)
      : await createProductAction(values);

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start"
    >
      {/* Left column: photos + safety note */}
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-5">
          <Label>Upload Photos</Label>
          <p className="text-xs text-black/50 mt-1 mb-3">
            Add clear photos of your item (up to 6 photos)
          </p>
          <ImageUploader
            value={images}
            onChange={(urls) => setValue("images", urls, { shouldValidate: true })}
          />
          {errors.images && (
            <p className="text-xs text-red-600 mt-2">{errors.images.message}</p>
          )}
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-medium">Your safety matters</p>
          <p className="text-xs text-black/60 mt-1">
            Don&apos;t share personal info like phone number, address or
            payment details.
          </p>
        </div>
      </div>

      {/* Right column: item details card */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-white p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-lg">Item Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Title</Label>
            <Input
              id="name"
              placeholder="e.g. Engineering Mathematics Vol. 2"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              className="h-11 rounded-lg border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus-visible:border-[var(--brand-orange)]"
              {...register("categoryId")}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={4}
            placeholder="Condition, features and any other details about the item..."
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[var(--brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/15"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priceRupees">Price (₹)</Label>
            <Input
              id="priceRupees"
              type="number"
              min={1}
              {...register("priceRupees", { valueAsNumber: true })}
            />
            {errors.priceRupees && (
              <p className="text-xs text-red-600">{errors.priceRupees.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={1} {...register("quantity", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="condition">Condition</Label>
            <select
              id="condition"
              className="h-11 rounded-lg border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus-visible:border-[var(--brand-orange)]"
              {...register("condition")}
            >
              {PRODUCT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {CONDITION_LABELS[condition]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hostel">Hostel / Location (optional)</Label>
            <Input id="hostel" placeholder="e.g. Block C, Boys Hostel" {...register("hostel")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch">Branch / Course (optional)</Label>
            <Input id="branch" placeholder="e.g. CSE, ECE, ME" {...register("branch")} />
          </div>
        </div>

        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {formError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" variant="brand" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : productId
              ? "Save changes"
              : "Publish listing"}
        </Button>
        </div>
      </div>
    </form>
  );
}
