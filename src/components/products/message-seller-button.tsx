"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MessageSellerButton({
  productId,
  productSlug,
  sellerId,
  productStatus,
}: {
  productId: string;
  productSlug: string;
  sellerId: string;
  productStatus: "available" | "reserved" | "sold" | "hidden";
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "loading" && session?.user?.id === sellerId) {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl px-4 py-3 w-fit">
        This is your listing — buyers will message you here.
      </p>
    );
  }

  if (productStatus === "sold") {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl px-4 py-3 w-fit">
        This item has already been sold.
      </p>
    );
  }

  if (productStatus === "hidden") {
    return (
      <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl px-4 py-3 w-fit">
        This listing is currently hidden by the seller.
      </p>
    );
  }

  const handleClick = async () => {
    if (status === "unauthenticated") {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`/product/${productSlug}`)}`
      );
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Couldn't start the conversation.");
        setIsLoading(false);
        return;
      }

      router.push(`/dashboard/messages/${data.id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-fit">
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isLoading || status === "loading"}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-md shadow-indigo-100"
      >
        <MessageCircle className="h-4 w-4" />
        {isLoading ? "Starting chat..." : "Message Seller"}
      </Button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
