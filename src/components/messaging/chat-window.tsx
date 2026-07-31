"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  ImagePlus,
  Loader2,
  Send,
  Smile,
  Star,
  Store,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import {
  cancelOrderAction,
  confirmReceiptAction,
  markAsSoldAction,
} from "@/lib/actions/orders";
import { submitBuyerReviewAction } from "@/lib/actions/reviews";

const POLL_INTERVAL_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const TYPING_STOP_DELAY_MS = 2000;
const QUICK_EMOJIS = ["👍", "🙏", "😂", "❤️", "🔥", "😢", "👀", "✅"];

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "system";
  message: string | null;
  image: string | null;
  isRead: boolean;
  createdAt: string;
}

interface OrderState {
  id: string;
  status: "seller_confirmed" | "completed" | "cancelled";
  buyerId: string;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLastSeen(date: string | Date | null) {
  if (!date) return "Offline";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Active just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return "Offline";
}

export function ChatWindow({
  conversationId,
  currentUserId,
  role,
  otherUser,
  product,
  initialMessages,
  initialOrder,
  hasReviewed,
}: {
  conversationId: string;
  currentUserId: string;
  role: "buyer" | "seller";
  otherUser: { id: string; name: string; username: string };
  product: {
    name: string;
    slug: string;
    priceCents: number;
    image: string | null;
    status: "available" | "reserved" | "sold" | "hidden";
  };
  initialMessages: ChatMessage[];
  initialOrder: OrderState | null;
  hasReviewed: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [order, setOrder] = useState<OrderState | null>(initialOrder);
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [orderActionError, setOrderActionError] = useState<string | null>(null);
  const [isOrderActionPending, setIsOrderActionPending] = useState(false);
  const [showBuyerRating, setShowBuyerRating] = useState(false);
  const [buyerRating, setBuyerRating] = useState(0);
  const [buyerRatingNote, setBuyerRatingNote] = useState("");
  const [buyerRatingSubmitted, setBuyerRatingSubmitted] = useState(hasReviewed);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [presence, setPresence] = useState<{
    isOnline: boolean;
    lastActiveAt: string | null;
    isTyping: boolean;
  }>({ isOnline: false, lastActiveAt: null, isTyping: false });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Poll for new messages, order status, and the other party's presence.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setMessages(data.messages ?? []);
        setOrder(data.order ?? null);
        setPresence({
          isOnline: data.otherUser?.isOnline ?? false,
          lastActiveAt: data.otherUser?.lastActiveAt ?? null,
          isTyping: data.otherUser?.isTyping ?? false,
        });
      } catch {
        // Ignore — next poll will retry.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  // Heartbeat so this user shows as "online" to the other party.
  useEffect(() => {
    const beat = () => fetch("/api/presence/heartbeat", { method: "POST" });
    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const setTypingState = async (isTyping: boolean) => {
    if (isTypingRef.current === isTyping) return;
    isTypingRef.current = isTyping;
    try {
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      });
    } catch {
      // Best-effort — typing indicators aren't critical.
    }
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    setTypingState(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => setTypingState(false),
      TYPING_STOP_DELAY_MS
    );
  };

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed && !pendingImage) return;

    setIsSending(true);
    setTypingState(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed || null, image: pendingImage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setDraft("");
        setPendingImage(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setPendingImage(blob.url);
    } catch {
      // Silent — user can just try again.
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const runOrderAction = async (
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setOrderActionError(null);
    setIsOrderActionPending(true);
    try {
      const result = await action();
      if (!result.success) {
        setOrderActionError(result.error ?? "Something went wrong.");
        return;
      }
      // Refresh from the server for the authoritative state (messages,
      // order status) rather than trying to hand-reconcile everything.
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setOrder(data.order ?? null);
      }
    } finally {
      setIsOrderActionPending(false);
    }
  };

  const handleSubmitBuyerRating = async () => {
    if (!order || buyerRating === 0) return;
    setIsSubmittingRating(true);
    setOrderActionError(null);
    try {
      const result = await submitBuyerReviewAction({
        orderId: order.id,
        rating: buyerRating,
        description: buyerRatingNote,
      });
      if (!result.success) {
        setOrderActionError(result.error);
        return;
      }
      setBuyerRatingSubmitted(true);
      setShowBuyerRating(false);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const lastOwnMessage = [...messages]
    .reverse()
    .find((m) => m.senderId === currentUserId && m.type === "text");

  const productStatusLabel =
    product.status === "sold"
      ? "Sold"
      : product.status === "reserved"
        ? "Reserved"
        : "Available";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] shrink-0">
        <Link
          href="/dashboard/messages"
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-black/5"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="relative h-11 w-11 shrink-0 rounded-lg border border-[var(--border-subtle)] bg-black/5 overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt="" fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-black/20">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${product.slug}`}
            className="text-sm font-semibold truncate hover:underline block"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-black/50">
            <span>{formatPrice(product.priceCents)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3" />
              {otherUser.name}
            </span>
            <span>·</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-medium ${
                product.status === "available"
                  ? "bg-green-50 text-green-700"
                  : product.status === "reserved"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-black/5 text-black/50"
              }`}
            >
              {productStatusLabel}
            </span>
          </div>
          <p className="text-xs text-black/40 mt-0.5">
            {presence.isTyping ? (
              <span className="italic">{otherUser.name} is typing...</span>
            ) : presence.isOnline ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Online
              </span>
            ) : (
              formatLastSeen(presence.lastActiveAt)
            )}
          </p>
        </div>
      </div>

      {/* Order status / action bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--brand-orange-light)] px-4 py-3 shrink-0">
        {orderActionError && (
          <p className="text-xs text-red-600 mb-2">{orderActionError}</p>
        )}

        {!order && role === "seller" && product.status === "available" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-black/60">
              Handed the item over and got paid offline?
            </p>
            <Button
              variant="brand"
              size="sm"
              disabled={isOrderActionPending}
              onClick={() => runOrderAction(() => markAsSoldAction(conversationId))}
            >
              {isOrderActionPending ? "Marking..." : "Mark as Sold"}
            </Button>
          </div>
        )}

        {!order && role === "buyer" && (
          <p className="text-xs text-black/50">
            Once you agree on a price and meetup, the seller will mark this
            as sold here.
          </p>
        )}

        {order && order.status === "seller_confirmed" && role === "buyer" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              The seller marked this as sold. Did you receive the product?
            </p>
            <div className="flex gap-2">
              <Button
                variant="brand"
                size="sm"
                disabled={isOrderActionPending}
                onClick={() =>
                  runOrderAction(() => confirmReceiptAction(order.id, true))
                }
              >
                Yes, I received it
              </Button>
              <Button
                variant="elevated"
                size="sm"
                disabled={isOrderActionPending}
                onClick={() =>
                  runOrderAction(() => confirmReceiptAction(order.id, false))
                }
              >
                No
              </Button>
            </div>
          </div>
        )}

        {order && order.status === "seller_confirmed" && role === "seller" && (
          <p className="text-xs text-black/60">
            Waiting for the buyer to confirm they received the item.
          </p>
        )}

        {order && order.status === "seller_confirmed" && (
          <div className="mt-2">
            <button
              type="button"
              disabled={isOrderActionPending}
              onClick={() => runOrderAction(() => cancelOrderAction(order.id))}
              className="text-xs text-black/40 hover:text-black/70 underline"
            >
              Cancel this order
            </button>
          </div>
        )}

        {order && order.status === "completed" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Order completed
              </p>
              {role === "buyer" && (
                <Link href={`/product/${product.slug}#reviews`}>
                  <Button variant="elevated" size="sm">
                    Leave a review
                  </Button>
                </Link>
              )}
              {role === "seller" && !buyerRatingSubmitted && !showBuyerRating && (
                <Button
                  variant="elevated"
                  size="sm"
                  onClick={() => setShowBuyerRating(true)}
                >
                  Rate this buyer
                </Button>
              )}
              {role === "seller" && buyerRatingSubmitted && (
                <p className="text-xs text-black/50">You rated this buyer</p>
              )}
            </div>

            {role === "seller" && showBuyerRating && !buyerRatingSubmitted && (
              <div className="flex flex-col gap-2 bg-white border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-xs font-medium">
                  How was buying with {otherUser.name}?
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBuyerRating(value)}
                        aria-label={`Rate ${value} stars`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            value <= buyerRating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-transparent text-black/20"
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={buyerRatingNote}
                  onChange={(e) => setBuyerRatingNote(e.target.value)}
                  placeholder="Any notes about this buyer? (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-[var(--brand-orange)]"
                />
                <Button
                  variant="brand"
                  size="sm"
                  className="self-start"
                  disabled={buyerRating === 0 || isSubmittingRating}
                  onClick={handleSubmitBuyerRating}
                >
                  {isSubmittingRating ? "Submitting..." : "Submit rating"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((m) => {
          if (m.type === "system") {
            return (
              <div key={m.id} className="flex justify-center my-1">
                <p className="text-xs text-black/50 bg-black/5 rounded-full px-3 py-1.5 text-center max-w-[85%]">
                  {m.message}
                </p>
              </div>
            );
          }

          const isMine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[75%] ${isMine ? "self-end items-end" : "self-start items-start"}`}
            >
              <div
                className={`rounded-2xl px-3.5 py-2 ${
                  isMine
                    ? "bg-orange-200 text-foreground"
                    : "bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-cartoon-sm)]"
                }`}
              >
                {m.image && (
                  <div className="relative w-48 aspect-square rounded-md overflow-hidden mb-1">
                    <Image src={m.image} alt="Attachment" fill className="object-cover" />
                  </div>
                )}
                {m.message && (
                  <p className="text-sm whitespace-pre-line break-words">{m.message}</p>
                )}
              </div>
              <span className="text-[11px] text-black/40 mt-0.5 px-1">
                {formatTime(m.createdAt)}
                {isMine && m.id === lastOwnMessage?.id && (
                  <> · {m.isRead ? "Read" : "Sent"}</>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border-subtle)] p-3 shrink-0">
        {pendingImage && (
          <div className="relative h-16 w-16 mb-2 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
            <Image src={pendingImage} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="absolute top-0.5 right-0.5 flex items-center justify-center h-5 w-5 rounded-full bg-black text-white"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {showEmoji && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setDraft((d) => d + emoji)}
                className="text-lg hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-black/5 shrink-0"
            aria-label="Emoji"
          >
            <Smile className="h-4 w-4 text-black/50" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-black/5 shrink-0 disabled:opacity-50"
            aria-label="Attach image"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black/50" />
            ) : (
              <ImagePlus className="h-4 w-4 text-black/50" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          <textarea
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message about price, condition, or pickup..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus-visible:border-[var(--brand-orange)] focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]/15 max-h-32"
          />

          <Button
            variant="brand"
            size="icon"
            className="rounded-lg"
            onClick={handleSend}
            disabled={isSending || (!draft.trim() && !pendingImage)}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
