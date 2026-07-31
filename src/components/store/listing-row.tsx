"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { updateProductStatusAction } from "@/lib/actions/store";

interface ListingRowProduct {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  images: string[];
  isArchived: boolean;
  quantity: number;
}

export function ListingRow({ product }: { product: ListingRowProduct }) {
  const [isArchived, setIsArchived] = useState(product.isArchived);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    const nextStatus = isArchived ? "available" : "hidden";

    startTransition(async () => {
      const result = await updateProductStatusAction(product.id, nextStatus);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsArchived(!isArchived);
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
      <div className="relative h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{product.name}</p>
        <p className="text-sm text-slate-500">
          {formatPrice(product.priceCents)} &middot; Qty {product.quantity}
        </p>
        {isArchived && (
          <span className="inline-block text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 mt-1">
            Hidden
          </span>
        )}
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/sell/${product.id}`}>
          <Button variant="ghost" size="sm" className="rounded-xl">
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="rounded-xl"
        >
          {isArchived ? "Publish" : "Unpublish"}
        </Button>
      </div>
    </div>
  );
}
