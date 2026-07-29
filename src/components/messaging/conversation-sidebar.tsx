"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageOff, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type { ConversationSummary } from "@/db/queries/messages";

const POLL_INTERVAL_MS = 5000;

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

    const poll = async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setConversations(data.conversations ?? []);
      } catch {
        // Ignore — next poll will retry.
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
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
      className={`${isIndex ? "flex" : "hidden md:flex"} w-full md:w-80 shrink-0 flex-col border-r border-[var(--border-subtle)] h-full`}
    >
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h1 className="font-display font-bold text-xl mb-3">Messages</h1>
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 pl-8"
          />
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-black/50 text-center py-8 px-4">
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
                className={`flex items-center gap-3 p-4 border-b border-[var(--border-subtle)] hover:bg-black/[0.03] transition-colors ${
                  isActive ? "bg-[var(--brand-orange-light)]" : ""
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 rounded-lg border border-[var(--border-subtle)] bg-black/5 overflow-hidden">
                  {cover ? (
                    <Image src={cover} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-black/20">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {conversation.otherUser?.name ?? "Deleted user"}
                    </p>
                    <span className="text-xs text-black/40 shrink-0">
                      {timeAgo(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-black/50 truncate">
                    {conversation.product.name} · {formatPrice(conversation.product.priceCents)}
                  </p>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      unreadCount > 0
                        ? "font-semibold text-black"
                        : "text-black/50"
                    }`}
                  >
                    {lastMessagePreview}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[var(--brand-orange)] text-white text-[11px] font-medium shrink-0">
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
