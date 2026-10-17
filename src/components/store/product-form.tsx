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
      className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start"
    >
      {/* Left column: photos + safety note */}
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5">
          <Label className="font-bold text-[var(--text-primary)]">Upload Photos</Label>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
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

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
          <p className="text-xs font-bold">Your safety matters</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
            Don&apos;t share personal phone numbers or payment details until you confirm in chat.
          </p>
        </div>
      </div>

      {/* Right column: item details card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 flex flex-col gap-5">
        <h2 className="font-bold text-lg text-[var(--text-primary)] font-display">Item Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-[var(--text-primary)]">Title</Label>
            <Input
              id="name"
              placeholder="e.g. Engineering Mathematics Vol. 2"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId" className="text-xs font-semibold text-[var(--text-primary)]">Category</Label>
            <select
              id="categoryId"
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
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
          <Label htmlFor="description" className="text-xs font-semibold text-[var(--text-primary)]">Description</Label>
          <textarea
            id="description"
            rows={4}
            placeholder="Condition, features and any other details about the item..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priceRupees" className="text-xs font-semibold text-[var(--text-primary)]">Price (₹)</Label>
            <Input
              id="priceRupees"
              type="number"
              min={1}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs"
              {...register("priceRupees", { valueAsNumber: true })}
            />
            {errors.priceRupees && (
              <p className="text-xs text-red-600">{errors.priceRupees.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity" className="text-xs font-semibold text-[var(--text-primary)]">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs"
              {...register("quantity", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="condition" className="text-xs font-semibold text-[var(--text-primary)]">Condition</Label>
            <select
              id="condition"
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Label htmlFor="hostel" className="text-xs font-semibold text-[var(--text-primary)]">Hostel / Location (optional)</Label>
            <Input
              id="hostel"
              placeholder="e.g. Block C, Boys Hostel"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs"
              {...register("hostel")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch" className="text-xs font-semibold text-[var(--text-primary)]">Branch / Course (optional)</Label>
            <Input
              id="branch"
              placeholder="e.g. CSE, ECE, ME"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] text-xs"
              {...register("branch")}
            />
          </div>
        </div>

        {formError && (
          <p className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
            {formError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl px-6 py-2.5 text-xs shadow-xs"
          >
            {isSubmitting
              ? "Saving..."
              : productId
              ? "Save Changes"
              : "Publish Listing"}
          </Button>
        </div>
      </div>
    </form>
  );
}
