"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Edit3,
  ImageOff,
  ImagePlus,
  Loader2,
  MoreVertical,
  Send,
  Smile,
  Star,
  Trash2,
  X,
  AlertCircle,
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
import { getAvatarInitials } from "@/lib/avatar";

const FALLBACK_SYNC_INTERVAL_MS = 2_500;
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
  editedAt?: string | null;
  deletedForEveryoneAt?: string | null;
  createdAt: string;
}

function upsertMessage(prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (prev.some((m) => m.id === incoming.id)) {
    return prev.map((m) => (m.id === incoming.id ? incoming : m));
  }
  return [...prev, incoming];
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
      a.image !== b.image ||
      a.editedAt !== b.editedAt ||
      a.deletedForEveryoneAt !== b.deletedForEveryoneAt
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
  const [openMenuMessageId, setOpenMenuMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const prevMessageCountRef = useRef(initialMessages.length);

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
          setMessages((prev) => upsertMessage(prev, newMsg));
          // If incoming message is from the other party, mark as read and refresh unread badges
          if (newMsg.senderId !== currentUserId) {
            void fetch(`/api/conversations/${conversationId}/messages`).catch(() => {});
            refreshUnreadCount();
          }
        } catch {}
      });

      es.addEventListener("message_updated", (e: MessageEvent) => {
        if (cancelled) return;
        try {
          const updatedMsg: ChatMessage = JSON.parse(e.data);
          setMessages((prev) =>
            prev.some((m) => m.id === updatedMsg.id)
              ? prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
              : prev
          );
          refreshUnreadCount();
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
    void syncMessagesAndPresence();

    // Active sync every 2.5s while visible ensures instant delivery across serverless workers
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
    if (messages.length > prevMessageCountRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Close message action menu when clicking outside
  useEffect(() => {
    if (!openMenuMessageId) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-message-menu]")) {
        setOpenMenuMessageId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openMenuMessageId]);

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
    if (isSending) return;
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
        setMessages((prev) => upsertMessage(prev, data.message));
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

  const handleStartEdit = (m: ChatMessage) => {
    setOpenMenuMessageId(null);
    setEditingMessageId(m.id);
    setEditingDraft(m.message ?? "");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingDraft("");
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editingDraft.trim();
    if (!trimmed || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to edit message.");
        return;
      }

      setMessages((prev) => upsertMessage(prev, data.message));
      setEditingMessageId(null);
      setEditingDraft("");
      toast.success("Message edited");
    } catch {
      toast.error("Network error. Could not edit message.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    scope: "me" | "everyone"
  ) => {
    setOpenMenuMessageId(null);
    setDeletingMessageId(messageId);
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}?scope=${scope}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to delete message.");
        return;
      }

      if (scope === "me") {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Message deleted for you");
      } else if (data.message) {
        setMessages((prev) => upsertMessage(prev, data.message));
        if (editingMessageId === messageId) {
          handleCancelEdit();
        }
        toast.success("Message deleted for everyone");
      }
      refreshUnreadCount();
    } catch {
      toast.error("Network error. Could not delete message.");
    } finally {
      setDeletingMessageId(null);
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
    .find(
      (m) =>
        m.senderId === currentUserId &&
        m.type === "text" &&
        !m.deletedForEveryoneAt
    );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/messages"
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Student Avatar */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs">
              {getAvatarInitials(otherUser.name, "U")}
            </div>
            {presence.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {otherUser.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {presence.isTyping ? (
                <span className="italic text-blue-600 font-semibold">typing...</span>
              ) : presence.isOnline ? (
                <span className="text-emerald-600 font-semibold">Active now</span>
              ) : (
                formatLastSeen(presence.lastActiveAt)
              )}
            </p>
          </div>
        </div>

        {/* Compact Product Pill (Right) */}
        <Link
          href={`/product/${product.slug}`}
          className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-500/40 transition-colors max-w-[180px] sm:max-w-xs shrink-0 group"
        >
          <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
            {product.image ? (
              <Image src={product.image} alt="" fill className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <ImageOff className="h-3 w-3" />
              </div>
            )}
          </div>
          <div className="hidden sm:flex flex-col min-w-0 text-left">
            <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {product.name}
            </span>
            <span className="text-[11px] font-bold text-blue-600">
              {formatPrice(product.priceCents)}
            </span>
          </div>
        </Link>
      </div>

      {/* Mobile Compact Product Strip */}
      <Link
        href={`/product/${product.slug}`}
        className="sm:hidden flex items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-100 bg-slate-50/80 shrink-0"
      >
        <span className="text-xs font-semibold text-slate-800 truncate min-w-0">
          {product.name}
        </span>
        <span className="text-xs font-bold text-blue-600 shrink-0">
          {formatPrice(product.priceCents)}
        </span>
      </Link>

      {/* Order status / action bar */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--brand-primary-light)]/40 px-3.5 sm:px-4 py-2.5 sm:py-3 shrink-0">
        {orderActionError && (
          <p className="text-xs text-red-600 font-medium mb-2">{orderActionError}</p>
        )}

        {!order && role === "seller" && product.status === "available" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs text-[var(--text-primary)] font-medium">
              Handed the item over and got paid offline?
            </p>
            <Button
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 shrink-0"
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
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
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
                  className="rounded-xl text-xs font-bold border-blue-500/30 text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
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
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  size="sm"
                  className="self-start bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 bg-slate-50/70">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto my-auto">
            <div className="h-14 w-14 rounded-full bg-blue-50 text-blue-600 font-bold text-xl flex items-center justify-center shadow-xs">
              {getAvatarInitials(otherUser.name, "U")}
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Chatting with {otherUser.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Coordinate handoffs at safe public campus spots like the <strong>Central Library</strong> or <strong>Canteen</strong>.
              </p>
            </div>
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tap to send a quick message:
              </p>
              {[
                "👋 Hi! Is this item still available?",
                "📍 Where on campus can we meet for pickup?",
                "💰 Would you accept a slight student discount?",
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setDraft(starter)}
                  className="w-full text-left text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-400 text-slate-800 transition-all cursor-pointer shadow-2xs"
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
                <div key={m.id} className="flex justify-center my-1.5">
                  <p className="text-[11px] font-medium text-slate-500 bg-slate-200/70 rounded-full px-3.5 py-1 text-center max-w-[85%]">
                    {m.message}
                  </p>
                </div>
              );
            }

            const isMine = m.senderId === currentUserId;
            const isDeletedForAll = Boolean(m.deletedForEveryoneAt);
            const isEditing = editingMessageId === m.id;
            const isMenuOpen = openMenuMessageId === m.id;
            const isDeletingThis = deletingMessageId === m.id;

            return (
              <div
                key={m.id}
                className={`group flex flex-col max-w-[85%] sm:max-w-[72%] ${
                  isMine ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  className={`flex items-end gap-1.5 ${
                    isMine ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {isDeletedForAll ? (
                    <div
                      className={`px-3.5 py-2 rounded-2xl border text-xs italic ${
                        isMine
                          ? "bg-slate-100 border-slate-200 text-slate-500 rounded-br-xs"
                          : "bg-white border-slate-200 text-slate-400 rounded-bl-xs"
                      }`}
                    >
                      This message was deleted
                    </div>
                  ) : isEditing ? (
                    <div className="w-64 sm:w-80 rounded-2xl border border-blue-300 bg-white p-2.5 shadow-sm space-y-2">
                      <textarea
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleSaveEdit(m.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        rows={2}
                        autoFocus
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(m.id)}
                          disabled={isSavingEdit || !editingDraft.trim()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingEdit ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 shadow-2xs ${
                        isMine
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-xs"
                          : "bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-xs"
                      }`}
                    >
                      {m.image && (
                        <div className="relative w-48 sm:w-56 aspect-square rounded-xl overflow-hidden mb-2 border border-black/10">
                          <Image src={m.image} alt="Attachment" fill className="object-cover" />
                        </div>
                      )}
                      {m.message && (
                        <p className="text-xs sm:text-sm whitespace-pre-line break-words leading-relaxed font-normal">
                          {m.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message Action Menu (Edit / Delete for me / Delete for everyone) */}
                  {!isEditing && (
                    <div className="relative shrink-0" data-message-menu>
                      <button
                        type="button"
                        disabled={isDeletingThis}
                        onClick={() =>
                          setOpenMenuMessageId((prev) => (prev === m.id ? null : m.id))
                        }
                        aria-label="Message actions"
                        className={`flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-all cursor-pointer ${
                          isMenuOpen
                            ? "opacity-100 bg-slate-200/70 text-slate-700"
                            : "opacity-75 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                        }`}
                      >
                        {isDeletingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isMenuOpen && (
                        <div
                          className={`absolute bottom-full mb-1 z-30 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100 ${
                            isMine ? "right-0" : "left-0"
                          }`}
                        >
                          {isMine && m.message && !isDeletedForAll && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(m)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit message</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleDeleteMessage(m.id, "me")}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>Delete for me</span>
                          </button>

                          {isMine && !isDeletedForAll && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteMessage(m.id, "everyone")}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              <span>Delete for everyone</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium flex items-center gap-1.5">
                  <span>{formatTime(m.createdAt)}</span>
                  {m.editedAt && !isDeletedForAll && (
                    <span className="text-slate-400 italic">• Edited</span>
                  )}
                  {isMine && m.id === lastOwnMessage?.id && (
                    <span className="text-blue-500 font-semibold">
                      {m.isRead ? "✓✓ Read" : "✓ Sent"}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 p-3 sm:p-4 shrink-0 bg-white">
        {/* Campus Quick Reply Chips for Students */}
        {role === "buyer" && messages.length <= 1 && !draft && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none">
            {["Is this still available?", "Can we meet at the Library?", "Can we meet at the Canteen?", "Is the price negotiable?"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setDraft(chip)}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--border-subtle)] hover:border-blue-500/50 hover:text-blue-600 text-[var(--text-primary)] transition-colors cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

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

        <div className="flex items-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-slate-100 shrink-0 text-slate-500 transition-colors cursor-pointer"
            aria-label="Emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-slate-100 shrink-0 text-slate-500 transition-colors disabled:opacity-50 cursor-pointer"
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
            placeholder="Type a message..."
            rows={1}
            className="min-w-0 flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 text-slate-900 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
          />

          <Button
            size="icon"
            className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs cursor-pointer transition-colors"
            onClick={handleSend}
            disabled={isSending || (!draft.trim() && !pendingImage)}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

