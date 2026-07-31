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
  ListOrdered,
  User,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

const POLL_INTERVAL_MS = 15_000;

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const studentStatus = session?.user?.studentStatus || "unverified";
  const isAdmin = session?.user?.isAdmin;

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
        // Silently ignore
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.user]);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Browse Items", href: "/browse", icon: Search },
    { label: "Sell an Item", href: "/sell", icon: PlusCircle },
    { label: "My Listings", href: "/dashboard/my-listings", icon: ListOrdered },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Student Verification", href: "/student-verification", icon: ShieldCheck },
    { label: "Orders", href: "/orders", icon: Package },
    { label: "Messages", href: "/dashboard/messages", icon: MessageCircle, showUnread: true },
  ];

  if (isAdmin) {
    navItems.push({
      label: "Admin Verification Desk",
      href: "/admin/verifications",
      icon: ShieldCheck,
    });
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white sticky top-[84px] h-[calc(100vh-5.25rem)] overflow-y-auto">
      <nav className="flex-1 flex flex-col gap-1.5 p-4">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map(({ label, href, icon: Icon, showUnread }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-100"
                  : "text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500"}`} strokeWidth={2} />
                <span>{label}</span>
              </span>
              {showUnread && unreadCount > 0 && (
                <span className={`flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold ${
                  isActive ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                }`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Student Status Quick Card */}
      {session?.user && (
        <div className="m-4 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2">
            {studentStatus === "verified" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-900">
              {studentStatus === "verified" ? "Verified Student" : "Unverified Seller"}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {studentStatus === "verified"
              ? "You have unlimited selling privileges on Campus Cart."
              : "Unverified sellers can list up to 2 items. Verify your PTU portal to unlock unlimited listings."}
          </p>
          {studentStatus !== "verified" && (
            <Link href="/student-verification" className="block pt-1">
              <span className="inline-block w-full text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl transition-colors shadow-xs">
                Get Student Verified
              </span>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
