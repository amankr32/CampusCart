"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toggleArchiveProductAction } from "@/lib/actions/store";

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
    const nextValue = !isArchived;

    startTransition(async () => {
      const result = await toggleArchiveProductAction(product.id, nextValue);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsArchived(nextValue);
    });
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-black bg-white">
      <div className="relative h-16 w-16 rounded-md bg-black/5 border-2 border-black overflow-hidden shrink-0">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-black/20">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-black/50">
          {formatPrice(product.priceCents)} &middot; Qty {product.quantity}
        </p>
        {isArchived && (
          <span className="inline-block text-[11px] font-medium bg-black/5 rounded-full px-2 py-0.5 mt-1">
            Unpublished
          </span>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/sell/${product.id}`}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
        <Button
          variant="elevated"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
        >
          {isArchived ? "Publish" : "Unpublish"}
        </Button>
      </div>
    </div>
  );
}
