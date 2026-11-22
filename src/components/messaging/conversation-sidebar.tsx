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
      className={`${isIndex ? "flex" : "hidden md:flex"} w-full md:w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 h-full bg-white dark:bg-slate-900`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <h1 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">Messages</h1>
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="h-9 pl-8 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8 px-4">
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
            const studentInitial = (conversation.otherUser?.name || "U").slice(0, 1).toUpperCase();

            return (
              <Link
                key={conversation.id}
                href={`/dashboard/messages/${conversation.id}`}
                className={`flex items-center gap-3 p-3.5 transition-colors ${
                  isActive
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                {/* User Avatar with Product Thumbnail overlay */}
                <div className="relative shrink-0">
                  <div className="h-11 w-11 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    {studentInitial}
                  </div>
                  {cover && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-md border border-white dark:border-slate-900 overflow-hidden shadow-2xs">
                      <Image src={cover} alt="" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {conversation.otherUser?.name ?? "Campus Student"}
                    </p>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {timeAgo(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {conversation.product.name} · {formatPrice(conversation.product.priceCents)}
                  </p>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      unreadCount > 0
                        ? "font-bold text-slate-900 dark:text-white"
                        : "text-slate-500"
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
