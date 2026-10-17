"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageSquare, Loader2 } from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

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
      <div className="p-4 rounded-2xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-xs text-[var(--brand-primary)] font-semibold w-full text-center">
        This is your listing — buyers will message you directly here.
      </div>
    );
  }

  if (productStatus === "sold") {
    return (
      <div className="p-4 rounded-2xl bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-semibold w-full text-center">
        This item has already been marked as sold.
      </div>
    );
  }

  if (productStatus === "hidden") {
    return (
      <div className="p-4 rounded-2xl bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-semibold w-full text-center">
        This listing is currently hidden by the seller.
      </div>
    );
  }

  const handleClick = async () => {
    if (status === "unauthenticated") {
      toast.info("Sign in required", {
        description: "Please sign in with your student account to message sellers.",
      });
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
        toast.error("Could not open chat", { description: data.error });
        setIsLoading(false);
        return;
      }

      toast.success("Connecting with seller...");
      router.push(`/dashboard/messages/${data.id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      toast.error("Connection error");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        size="lg"
        onClick={handleClick}
        disabled={isLoading || status === "loading"}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-extrabold text-sm sm:text-base px-8 py-3.5 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening Chat Thread...
          </>
        ) : (
          <>
            <MessageSquare className="h-5 w-5 fill-white/20" />
            Message Seller
          </>
        )}
      </Button>
      {error && <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>}
    </div>
  );
}
