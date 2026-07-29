"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Package,
  MessageCircle,
  Heart,
  Tag,
  ClipboardList,
  User,
  Settings,
  Gift,
//   Instagram,
//   Twitter,
//   Linkedin,
} from "lucide-react";

const POLL_INTERVAL_MS = 15_000;

// Items with an `href` map to real, working routes. Items without one
// (`comingSoon: true`) mirror the reference design but have no backing
// feature in the schema/queries yet — they render as disabled rather than
// linking somewhere that 404s.
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse", href: "/browse", icon: Search },
  { label: "Sell an Item", href: "/sell", icon: PlusCircle },
  { label: "Orders", href: "/orders", icon: Package },
  { label: "Messages", href: "/dashboard/messages", icon: MessageCircle, showUnread: true },
  { label: "Saved Items", href: null, icon: Heart, comingSoon: true },
  { label: "Deals", href: null, icon: Tag, comingSoon: true },
  { label: "My Listings", href: "/dashboard/sales", icon: ClipboardList },
  { label: "Profile", href: null, icon: User, comingSoon: true },
  { label: "Settings", href: null, icon: Settings, comingSoon: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/messages/unread-count");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnreadCount(data.count ?? 0);
      } catch {
        // Silently ignore — the badge just won't update this cycle.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user]);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-white sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
      <nav className="flex-1 flex flex-col gap-1 p-4">
        {navItems.map(({ label, href, icon: Icon, showUnread, comingSoon }) => {
          const isActive = href && pathname.startsWith(href);

          if (comingSoon || !href) {
            return (
              <div
                key={label}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-black/30 cursor-not-allowed"
                title="Coming soon"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  <span className="text-sm font-medium">{label}</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-black/30">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-black/70 hover:bg-black/[0.03]"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                <span className="text-sm font-medium">{label}</span>
              </span>
              {showUnread && unreadCount > 0 && (
                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Decorative — there's no referral/rewards system behind this yet.
          Kept visually per the reference design; "Invite Now" does nothing. */}
      <div className="m-4 p-4 rounded-xl bg-indigo-50">
        <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-600 text-white mb-3">
          <Gift className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <p className="font-display font-semibold text-sm mb-1">Invite &amp; Earn</p>
        <p className="text-xs text-black/50 mb-3">
          Invite friends and earn exciting rewards.
        </p>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="w-full h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium opacity-60 cursor-not-allowed"
        >
          Invite Now
        </button>
      </div>

      {/* <div className="px-4 pb-4 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <p className="text-xs text-black/40">
          &copy; {new Date().getFullYear()} CampusCart
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com"
            aria-label="Instagram"
            className="text-black/30 hover:text-indigo-600 transition-colors"
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://twitter.com"
            aria-label="Twitter"
            className="text-black/30 hover:text-indigo-600 transition-colors"
          >
            <Twitter className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://linkedin.com"
            aria-label="LinkedIn"
            className="text-black/30 hover:text-indigo-600 transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        </div>
      </div> */}
    </aside>
  );
}
