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
  AlertCircle,
  MessageSquare,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import {
  cancelOrderAction,
  confirmReceiptAction,
  markAsSoldAction,
} from "@/lib/actions/orders";
import { submitBuyerReviewAction } from "@/lib/actions/reviews";
import { refreshUnreadCount } from "@/lib/unread-store";

const FALLBACK_SYNC_INTERVAL_MS = 30_000;
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

function areMessagesEqual(prev: ChatMessage[], next: ChatMessage[]): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.isRead !== b.isRead ||
      a.message !== b.message ||
      a.image !== b.image
    ) {
      return false;
    }
  }
  return true;
}

function areOrdersEqual(prev: OrderState | null, next: OrderState | null): boolean {
  if (!prev && !next) return true;
  if (!prev || !next) return false;
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.buyerId === next.buyerId
  );
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
  const [sendError, setSendError] = useState<string | null>(null);
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

  // Real-time chat via Server-Sent Events (SSE) with resilient 30s background sync
  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let abortController: AbortController | null = null;

    const syncMessagesAndPresence = async () => {
      if (document.hidden || cancelled) return;
      try {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          signal: abortController.signal,
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setMessages((prev) =>
          areMessagesEqual(prev, data.messages ?? []) ? prev : data.messages ?? []
        );
        setOrder((prev) =>
          areOrdersEqual(prev, data.order ?? null) ? prev : data.order ?? null
        );
        setPresence({
          isOnline: data.otherUser?.isOnline ?? false,
          lastActiveAt: data.otherUser?.lastActiveAt ?? null,
          isTyping: data.otherUser?.isTyping ?? false,
        });
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        // Ignore — next sync or SSE event will retry
      }
    };

    const setupSSE = () => {
      if (typeof window === "undefined" || !window.EventSource) return;
      if (document.hidden || cancelled) return;

      if (eventSource) {
        eventSource.close();
      }

      const es = new EventSource(`/api/conversations/${conversationId}/stream`);
      eventSource = es;

      es.addEventListener("message", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const newMsg: ChatMessage = JSON.parse(e.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev.map((m) => (m.id === newMsg.id ? newMsg : m));
            }
            return [...prev, newMsg];
          });
          // If incoming message is from the other party, mark as read and refresh unread badges
          if (newMsg.senderId !== currentUserId) {
            void fetch(`/api/conversations/${conversationId}/messages`).catch(() => {});
            refreshUnreadCount();
          }
        } catch {}
      });

      es.addEventListener("typing", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(e.data);
          if (data.userId === otherUser.id) {
            setPresence((prev) => ({
              ...prev,
              isTyping: Boolean(data.isTyping),
            }));
          }
        } catch {}
      });

      es.addEventListener("order", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const orderData: OrderState = JSON.parse(e.data);
          setOrder((prev) => (areOrdersEqual(prev, orderData) ? prev : orderData));
        } catch {}
      });

      es.addEventListener("read", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(e.data);
          if (data.readerId === otherUser.id) {
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === currentUserId ? { ...m, isRead: true } : m
              )
            );
          }
        } catch {}
      });

      es.addEventListener("presence", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(e.data);
          if (data.userId === otherUser.id) {
            setPresence((prev) => ({
              ...prev,
              isOnline: Boolean(data.isOnline),
              lastActiveAt: data.lastActiveAt ?? null,
            }));
          }
        } catch {}
      });

      es.onerror = () => {
        // SSE disconnected (e.g. device sleep) - EventSource auto-reconnects
      };
    };

    setupSSE();

    // Fallback sync (every 30s instead of 3s) as a resilient safety net
    fallbackTimer = setInterval(syncMessagesAndPresence, FALLBACK_SYNC_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Tab visible: immediate sync & reconnect SSE if closed
        void syncMessagesAndPresence();
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          setupSSE();
        }
      } else {
        // Tab hidden: disconnect SSE to conserve server resources
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (abortController) abortController.abort();
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [conversationId, currentUserId, otherUser.id]);

  // Heartbeat so this user shows as "online" to the other party.
  useEffect(() => {
    const beat = () => {
      if (document.hidden) return;
      fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    };
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
        setSendError(null);
        refreshUnreadCount();
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || "Failed to send message. Please try again.");
      }
    } catch {
      setSendError("Network error. Could not send message.");
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
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      toast.success("Order status updated successfully!");
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
        toast.error(result.error);
        return;
      }
      setBuyerRatingSubmitted(true);
      setShowBuyerRating(false);
      toast.success("Buyer review submitted!");
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
    <div className="flex flex-col h-full bg-[var(--card-bg)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--card-bg)]">
        <Link
          href="/dashboard/messages"
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-primary)]"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="relative h-11 w-11 shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt="" fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]/40">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/product/${product.slug}`}
            className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] truncate hover:underline block"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-bold text-[var(--brand-primary)]">{formatPrice(product.priceCents)}</span>
            <span>·</span>
            <span className="flex items-center gap-1 font-medium">
              <Store className="h-3 w-3" />
              {otherUser.name}
            </span>
            <span>·</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                product.status === "available"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : product.status === "reserved"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              }`}
            >
              {productStatusLabel}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {presence.isTyping ? (
              <span className="italic text-indigo-600 font-semibold">{otherUser.name} is typing...</span>
            ) : presence.isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              formatLastSeen(presence.lastActiveAt)
            )}
          </p>
        </div>
      </div>

      {/* Order status / action bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--brand-primary-light)]/40 px-4 py-3 shrink-0">
        {orderActionError && (
          <p className="text-xs text-red-600 font-medium mb-2">{orderActionError}</p>
        )}

        {!order && role === "seller" && product.status === "available" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-primary)] font-medium">
              Handed the item over and got paid offline?
            </p>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-4"
              disabled={isOrderActionPending}
              onClick={() => runOrderAction(() => markAsSoldAction(conversationId))}
            >
              {isOrderActionPending ? "Marking..." : "Mark as Sold"}
            </Button>
          </div>
        )}

        {!order && role === "buyer" && (
          <p className="text-xs text-[var(--text-muted)] font-medium">
            Once you agree on a price and meetup, the seller will mark this as sold here.
          </p>
        )}

        {order && order.status === "seller_confirmed" && role === "buyer" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              The seller marked this as sold. Did you receive the product?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4"
                disabled={isOrderActionPending}
                onClick={() =>
                  runOrderAction(() => confirmReceiptAction(order.id, true))
                }
              >
                Yes, I received it
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold text-[var(--text-primary)] border-[var(--border-subtle)]"
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
          <p className="text-xs text-[var(--text-muted)] font-medium">
            Waiting for the buyer to confirm they received the item.
          </p>
        )}

        {order && order.status === "seller_confirmed" && (
          <div className="mt-2">
            <button
              type="button"
              disabled={isOrderActionPending}
              onClick={() => runOrderAction(() => cancelOrderAction(order.id))}
              className="text-xs text-[var(--text-muted)] hover:text-rose-500 font-semibold underline"
            >
              Cancel this order
            </button>
          </div>
        )}

        {order && order.status === "completed" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Order completed
              </p>
              {role === "buyer" && (
                <Link href={`/product/${product.slug}#reviews`}>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                    Leave a review
                  </Button>
                </Link>
              )}
              {role === "seller" && !buyerRatingSubmitted && !showBuyerRating && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-indigo-500/30 text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                  onClick={() => setShowBuyerRating(true)}
                >
                  Rate this buyer
                </Button>
              )}
              {role === "seller" && buyerRatingSubmitted && (
                <p className="text-xs text-[var(--text-muted)] font-semibold">You rated this buyer</p>
              )}
            </div>

            {role === "seller" && showBuyerRating && !buyerRatingSubmitted && (
              <div className="flex flex-col gap-2 bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-3.5 shadow-xs">
                <p className="text-xs font-bold text-[var(--text-primary)]">
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
                              : "fill-transparent text-[var(--text-muted)]/40"
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
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  size="sm"
                  className="self-start bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto my-auto">
            <div className="relative">
              <div className="h-16 w-16 rounded-3xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] flex items-center justify-center shadow-md shadow-indigo-500/10">
                <MessageSquare className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[var(--text-primary)]">
                Start conversation with {otherUser.name}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Campus handoffs happen in public spots (Library, Hostel Gate, or Cafeteria). Always inspect the item before paying!
              </p>
            </div>
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Tap a conversation starter:
              </p>
              {[
                "👋 Hey! Is this item still available?",
                "📍 Where on campus can we meet for pickup?",
                "💰 Would you accept a slight student discount?",
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setDraft(starter)}
                  className="w-full text-left text-xs font-medium px-3.5 py-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--brand-primary-light)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 text-[var(--text-primary)] transition-all cursor-pointer shadow-2xs"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            if (m.type === "system") {
              return (
                <div key={m.id} className="flex justify-center my-1">
                  <p className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--input-bg)] rounded-full px-4 py-1 text-center max-w-[85%] border border-[var(--border-subtle)]">
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
                  className={`rounded-2xl px-4 py-2.5 shadow-xs ${
                    isMine
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {m.image && (
                    <div className="relative w-48 aspect-square rounded-xl overflow-hidden mb-1.5 border border-white/20">
                      <Image src={m.image} alt="Attachment" fill className="object-cover" />
                    </div>
                  )}
                  {m.message && (
                    <p className="text-xs sm:text-sm whitespace-pre-line break-words leading-relaxed font-medium">
                      {m.message}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-medium">
                  {formatTime(m.createdAt)}
                  {isMine && m.id === lastOwnMessage?.id && (
                    <> · {m.isRead ? "Read" : "Sent"}</>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border-subtle)] p-3.5 shrink-0 bg-[var(--card-bg)]">
        {sendError && (
          <div className="mb-2 p-2.5 text-xs bg-red-500/10 text-red-500 rounded-xl flex items-center justify-between border border-red-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{sendError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="text-red-500 font-semibold text-xs ml-2 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        {pendingImage && (
          <div className="relative h-16 w-16 mb-2 rounded-xl overflow-hidden border border-[var(--border-subtle)]">
            <Image src={pendingImage} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 rounded-full bg-black/70 text-white"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {showEmoji && (
          <div className="flex gap-1.5 mb-2.5 flex-wrap p-2 bg-[var(--input-bg)] border border-[var(--border-subtle)] rounded-xl">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setDraft((d) => d + emoji)}
                className="text-lg hover:scale-125 transition-transform p-1"
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
            className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-[var(--input-bg)] shrink-0 text-[var(--text-muted)]"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center h-10 w-10 rounded-xl hover:bg-[var(--input-bg)] shrink-0 text-[var(--text-muted)] disabled:opacity-50"
            aria-label="Attach image"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
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
            className="flex-1 resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
          />

          <Button
            size="icon"
            className="rounded-xl h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-xs"
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

