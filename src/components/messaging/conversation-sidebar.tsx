"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageOff, Search } from "@/components/ui/material-symbol";

import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type { ConversationSummary } from "@/db/queries/messages";

const POLL_INTERVAL_MS = 25_000;

function timeAgo(date: string | Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function areConversationsEqual(
  prev: ConversationSummary[],
  next: ConversationSummary[]
): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.id !== b.id ||
      a.unreadCount !== b.unreadCount ||
      a.lastMessage?.message !== b.lastMessage?.message ||
      a.lastMessage?.image !== b.lastMessage?.image ||
      new Date(a.lastMessage?.createdAt ?? 0).getTime() !==
        new Date(b.lastMessage?.createdAt ?? 0).getTime() ||
      new Date(a.updatedAt).getTime() !== new Date(b.updatedAt).getTime() ||
      a.otherUser?.id !== b.otherUser?.id
    ) {
      return false;
    }
  }
  return true;
}

export function ConversationSidebar({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationSummary[];
  currentUserId: string;
}) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");

  const isIndex = pathname === "/dashboard/messages";
  const activeId = pathname.startsWith("/dashboard/messages/")
    ? pathname.split("/").pop()
    : null;

  useEffect(() => {
    let cancelled = false;
    let abortController: AbortController | null = null;

    const poll = async () => {
      if (document.hidden || cancelled) return;
      try {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        const res = await fetch("/api/conversations", {
          signal: abortController.signal,
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setConversations((prev) =>
          areConversationsEqual(prev, data.conversations ?? [])
            ? prev
            : data.conversations ?? []
        );
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        // Ignore — next poll will retry.
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (abortController) abortController.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // When a conversation is open, treat its unread count as 0 immediately
  // instead of waiting for the next poll tick (derived at render time
  // rather than via a state-mutating effect).

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.product.name.toLowerCase().includes(q) ||
        c.otherUser?.name.toLowerCase().includes(q) ||
        c.otherUser?.username.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <div
      className={`${isIndex ? "flex" : "hidden md:flex"} w-full md:w-80 shrink-0 flex-col border-r border-[var(--border-subtle)] h-full bg-[var(--card-bg)]`}
    >
      <div className="p-4 border-b border-[var(--border-subtle)] space-y-3">
        <h1 className="font-display font-extrabold text-xl text-[var(--text-primary)]">Messages</h1>
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 pl-8 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          />
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-8 px-4">
            {conversations.length === 0
              ? "No conversations yet. Message a seller from a product page to get started."
              : "No conversations match your search."}
          </p>
        ) : (
          filtered.map((conversation) => {
            const cover = conversation.product.images?.[0];
            const isActive = conversation.id === activeId;
            const unreadCount = isActive ? 0 : conversation.unreadCount;
            const lastMessage = conversation.lastMessage;
            const lastMessagePreview = lastMessage
              ? lastMessage.senderId === currentUserId
                ? `You: ${lastMessage.message ?? "Sent a photo"}`
                : (lastMessage.message ?? "Sent a photo")
              : "Say hello!";

            return (
              <Link
                key={conversation.id}
                href={`/dashboard/messages/${conversation.id}`}
                className={`flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] transition-colors ${
                  isActive
                    ? "bg-[var(--brand-primary-light)]/80 border-l-4 border-l-indigo-600"
                    : "hover:bg-[var(--input-bg)]/50"
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] overflow-hidden">
                  {cover ? (
                    <Image src={cover} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]/40">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {conversation.otherUser?.name ?? "Campus Student"}
                    </p>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] shrink-0">
                      {timeAgo(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--brand-primary)] truncate">
                    {conversation.product.name} · {formatPrice(conversation.product.priceCents)}
                  </p>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      unreadCount > 0
                        ? "font-extrabold text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {lastMessagePreview}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );

}
