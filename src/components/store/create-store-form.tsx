"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createStoreSchema,
  type CreateStoreInput,
} from "@/lib/validations/store";
import { createStoreAction } from "@/lib/actions/store";

export function CreateStoreForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStoreInput>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: { storeName: "" },
  });

  const onSubmit = async (values: CreateStoreInput) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createStoreAction(values);

    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="storeName">Store name</Label>
        <Input
          id="storeName"
          placeholder="e.g. Gurpreet's Book Corner"
          {...register("storeName")}
        />
        {errors.storeName && (
          <p className="text-xs text-red-600">{errors.storeName.message}</p>
        )}
      </div>

      {formError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {formError}
        </p>
      )}

      <Button type="submit" variant="brand" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Setting up your store..." : "Create my store"}
      </Button>
    </form>
  );
}
