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
  productStatus: "available" | "reserved" | "sold";
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "loading" && session?.user?.id === sellerId) {
    return (
      <p className="text-sm text-black/50 border-2 border-dashed border-black/20 rounded-md px-4 py-3 w-fit">
        This is your listing — buyers will message you here.
      </p>
    );
  }

  if (productStatus === "sold") {
    return (
      <p className="text-sm text-black/50 border-2 border-dashed border-black/20 rounded-md px-4 py-3 w-fit">
        This item has already been sold.
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
        variant="brand"
        size="lg"
        onClick={handleClick}
        disabled={isLoading || status === "loading"}
      >
        <MessageCircle className="h-4 w-4" />
        {isLoading ? "Starting chat..." : "Message Seller"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
