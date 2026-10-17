"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ExternalLink,
  ImageOff,
  Search,
  Filter,
} from "@/components/ui/material-symbol";

import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export interface OrderItem {
  id: string;
  totalCents: number;
  status: "seller_confirmed" | "completed" | "cancelled";
  createdAt: Date | string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[] | unknown;
  };
  tenant?: {
    storeName: string;
    slug: string;
  };
  buyer?: {
    id: string;
    name: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  seller_confirmed: "Pending Confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  seller_confirmed: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-subtle)]",
};

export function OrdersDashboardClient({
  buyerOrders,
  salesOrders,
}: {
  buyerOrders: OrderItem[];
  salesOrders: OrderItem[];
}) {
  const [activeMode, setActiveMode] = useState<"purchases" | "sales">("purchases");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const currentList = activeMode === "purchases" ? buyerOrders : salesOrders;

  const filteredOrders = currentList.filter((order) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "pending"
        ? order.status === "seller_confirmed"
        : order.status === statusFilter;

    const matchesSearch =
      order.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (order.tenant?.storeName || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.buyer?.name || "").toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[var(--text-primary)]">
            Orders & Sales
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Track your campus purchases and sales. Payment and item exchange happen safely in person on campus.
          </p>
        </div>

        {/* Purchases / Sales Mode Toggle */}
        <div className="inline-flex p-1 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-subtle)] shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveMode("purchases");
              setStatusFilter("all");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === "purchases"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Purchases ({buyerOrders.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("sales");
              setStatusFilter("all");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === "sales"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Package className="w-4 h-4" /> Sales ({salesOrders.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border-subtle)]">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
            }`}
          >
            All ({currentList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
            }`}
          >
            Pending ({currentList.filter((o) => o.status === "seller_confirmed").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
            }`}
          >
            Completed ({currentList.filter((o) => o.status === "completed").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "cancelled"
                ? "bg-[var(--border-subtle)] text-[var(--text-primary)]"
                : "bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
            }`}
          >
            Cancelled ({currentList.filter((o) => o.status === "cancelled").length})
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeMode}...`}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium focus:border-[var(--brand-primary)] outline-none"
          />
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Orders Grid List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-subtle)] p-8 space-y-4 shadow-xs max-w-md mx-auto">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] shadow-sm">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-[var(--text-primary)] font-display text-lg">
              {search.trim()
                ? `No ${activeMode} matching "${search}"`
                : statusFilter !== "all"
                  ? `No ${statusFilter} ${activeMode}`
                  : `No ${activeMode} yet`}
            </h3>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed max-w-sm mx-auto">
              {search.trim()
                ? "Try searching for a different item name or clear your search query."
                : activeMode === "purchases"
                  ? "When you buy an item and the seller marks it sold, your campus order receipt will appear here."
                  : "When you agree on a trade with a buyer and mark it sold, it will be tracked here."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            {search.trim() && (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="rounded-2xl text-xs font-bold px-4 h-10 border-[var(--border-subtle)] cursor-pointer"
              >
                Clear Search
              </Button>
            )}
            <Link href="/browse">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-bold px-5 h-10 shadow-md shadow-indigo-500/20 cursor-pointer">
                Browse Marketplace →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const images = Array.isArray(order.product.images) ? order.product.images : [];
            const cover = images[0] as string | undefined;

            return (
              <div
                key={order.id}
                className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--border-subtle)] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-subtle)] overflow-hidden shrink-0">
                    {cover ? (
                      <Image src={cover} alt={order.product.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[var(--text-muted)]/40">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full px-2.5 py-0.5 border ${STATUS_STYLES[order.status] ?? ""}`}>
                        {order.status === "completed" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {order.status === "seller_confirmed" && <Clock className="w-3 h-3 text-amber-600" />}
                        {order.status === "cancelled" && <XCircle className="w-3 h-3 text-[var(--text-muted)]" />}
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">{order.product.name}</h3>

                    <p className="text-xs text-[var(--text-muted)]">
                      {activeMode === "purchases" ? (
                        <>Store: <span className="font-semibold text-[var(--text-primary)]">{order.tenant?.storeName || "Seller Store"}</span></>
                      ) : (
                        <>Buyer: <span className="font-semibold text-[var(--text-primary)]">{order.buyer?.name || "Student Buyer"}</span></>
                      )}
                    </p>

                    <p className="font-extrabold text-[var(--brand-primary)] text-base font-display">
                      {formatPrice(order.totalCents)}
                    </p>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <Link href={`/product/${order.product.slug}`} className="inline-flex items-center gap-1 font-semibold text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
                    <ExternalLink className="w-3.5 h-3.5" /> View Listing
                  </Link>

                  <Link href="/dashboard/messages">
                    <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1 border-indigo-500/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]">
                      <MessageSquare className="w-3.5 h-3.5" /> Messages Chat
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
