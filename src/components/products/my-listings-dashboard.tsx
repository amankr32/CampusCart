"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  EyeOff,
  RotateCw,
  Plus,
  AlertTriangle,
  Loader2,
  Tag,
  Search,
  Sparkles,
} from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import {
  deleteProductAction,
  updateProductStatusAction,
  republishProductAction,
} from "@/lib/actions/store";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  status: "available" | "reserved" | "sold" | "hidden";
  condition: string;
  images: string[] | unknown;
  views: number;
  favoritesCount: number;
  createdAt: Date;
}

export function MyListingsDashboard({
  initialProducts,
  storeSlug,
}: {
  initialProducts: ProductItem[];
  storeSlug: string;
}) {
  const router = useRouter();
  const [productList, setProductList] = useState<ProductItem[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<"all" | "available" | "sold" | "hidden">("all");
  const [search, setSearch] = useState("");

  // Permanent Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const filteredProducts = productList.filter((p) => {
    const matchesTab = activeTab === "all" ? true : p.status === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await deleteProductAction(deleteTarget.id);
      if (res.success) {
        setProductList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast.success("Listing deleted permanently", {
          description: `"${deleteTarget.name}" has been removed.`,
        });
        router.refresh();
      } else {
        toast.error("Failed to delete", { description: res.error });
      }
    } catch {
      toast.error("Failed to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (
    productId: string,
    newStatus: "available" | "reserved" | "sold" | "hidden"
  ) => {
    setActionPendingId(productId);
    try {
      const res = await updateProductStatusAction(productId, newStatus);
      if (res.success) {
        setProductList((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        );
        const statusLabel =
          newStatus === "sold"
            ? "Marked as Sold"
            : newStatus === "hidden"
              ? "Listing Paused / Hidden"
              : "Listing Status Updated";
        toast.success(statusLabel);
        router.refresh();
      } else {
        toast.error("Update failed", { description: res.error });
      }
    } catch {
      toast.error("Failed to update product status.");
    } finally {
      setActionPendingId(null);
    }
  };

  const handleRepublish = async (productId: string) => {
    setActionPendingId(productId);
    try {
      const res = await republishProductAction(productId);
      if (res.success) {
        setProductList((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: "available" } : p))
        );
        toast.success("Listing Republished!", {
          description: "Your item is now active and visible to campus buyers.",
        });
        router.refresh();
      } else {
        toast.error("Republish failed", { description: res.error });
      }
    } catch {
      toast.error("Failed to republish listing.");
    } finally {
      setActionPendingId(null);
    }
  };

  const totalListings = productList.length;
  const activeListings = productList.filter((p) => p.status === "available").length;
  const soldListings = productList.filter((p) => p.status === "sold").length;
  const totalValueRupees = Math.round(
    productList
      .filter((p) => p.status === "available")
      .reduce((acc, p) => acc + p.priceCents, 0) / 100
  );

  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Cards (FlipEarn Figma step_30_media_0.png) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Listings */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Total Listings
            </span>
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              {totalListings}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">items posted</span>
          </div>
        </div>

        {/* Active Listings */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Active Listings
            </span>
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-emerald-600">
              {activeListings}
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">available now</span>
          </div>
        </div>

        {/* Items Sold */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Items Sold
            </span>
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              {soldListings}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">campus deals</span>
          </div>
        </div>

        {/* Total Value */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Total Active Value
            </span>
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              ₹{totalValueRupees.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">in inventory</span>
          </div>
        </div>
      </div>

      {/* Header controls & tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {(["all", "available", "sold", "hidden"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl capitalize transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab} ({productList.filter((p) => (tab === "all" ? true : p.status === tab)).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your listings..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <Link href="/sell">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shrink-0 h-9 px-3.5 text-xs font-bold shadow-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1" /> Post Item
            </Button>
          </Link>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-sm">
            <Tag className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-display text-slate-900">
              {search.trim()
                ? `No items matching "${search}"`
                : activeTab !== "all"
                  ? `No ${activeTab} items found`
                  : "You haven't listed any items yet"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {search.trim()
                ? "Try searching for a different keyword or clear the search input."
                : activeTab !== "all"
                  ? `You don't have any items currently marked as ${activeTab}.`
                  : "Sell your unused textbooks, drafters, calculators, or hostel gear to students on campus in minutes."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {search.trim() ? (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="rounded-2xl text-xs font-bold px-5 h-10 border-slate-200 cursor-pointer"
              >
                Clear Search
              </Button>
            ) : activeTab !== "all" ? (
              <Button
                variant="outline"
                onClick={() => setActiveTab("all")}
                className="rounded-2xl text-xs font-bold px-5 h-10 border-slate-200 cursor-pointer"
              >
                Show All Items
              </Button>
            ) : null}

            <Link href="/sell">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 h-10 font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer">
                <Plus className="w-4 h-4 mr-1" /> Post First Listing
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const images = Array.isArray(product.images) ? (product.images as string[]) : [];
            const primaryImg = images[0] || "/placeholder-item.jpg";
            const priceRs = Math.round(product.priceCents / 100);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image & Status Badge */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden group">
                    <img
                      src={primaryImg}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs backdrop-blur-md ${
                          product.status === "available"
                            ? "bg-emerald-500/90 text-white"
                            : product.status === "sold"
                            ? "bg-slate-900/90 text-white"
                            : "bg-amber-500/90 text-white"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
                      <Eye className="w-3.5 h-3.5" />
                      {product.views} views
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 line-clamp-1 font-display text-base">
                        {product.name}
                      </h3>
                      <span className="font-bold text-blue-600 text-lg shrink-0">
                        ₹{priceRs}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="capitalize bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-700">
                        Condition: {product.condition.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-3.5 sm:p-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Edit button */}
                    <Link href={`/sell/${product.id}`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </Link>

                    {/* Toggle Sold / Available */}
                    {product.status === "available" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionPendingId === product.id}
                        onClick={() => handleStatusToggle(product.id, "sold")}
                        className="text-xs text-emerald-700 hover:bg-emerald-50 rounded-xl h-9 px-2.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Sold
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionPendingId === product.id}
                        onClick={() => handleRepublish(product.id)}
                        className="text-xs text-blue-600 hover:bg-blue-50 rounded-xl h-9 px-2.5"
                      >
                        <RotateCw className="w-3.5 h-3.5 mr-1" /> Mark Available
                      </Button>
                    )}

                    {/* Toggle Hide / Pause */}
                    {product.status === "available" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={actionPendingId === product.id}
                        onClick={() => handleStatusToggle(product.id, "hidden")}
                        className="h-9 w-9 text-amber-600 hover:bg-amber-50 rounded-xl"
                        title="Pause / Hide Listing"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    ) : product.status === "hidden" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={actionPendingId === product.id}
                        onClick={() => handleRepublish(product.id)}
                        className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl"
                        title="Republish Listing"
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>

                  {/* Delete Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(product)}
                    className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="Permanently Delete Listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Delete Listing Permanently?
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">&quot;{deleteTarget.name}&quot;</strong>? This will remove all listing details and associated photos from storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-2xl h-11 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-11 px-5 shadow-md shadow-rose-100"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Permanently Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
