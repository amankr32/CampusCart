"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  ShieldCheck,
  ShieldAlert,
  ShoppingBag,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Shield,
  Loader2,
  Check,
  AlertTriangle,
} from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import {
  adminUpdateUserStudentStatusAction,
  adminToggleUserRoleAction,
  adminDeleteUserAction,
  adminUpdateProductStatusAction,
  adminDeleteProductAction,
  adminUpdateOrderStatusAction,
} from "@/lib/actions/admin";

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  username: string;
  studentStatus: "unverified" | "pending" | "verified" | "rejected";
  isAdmin: boolean;
  trustScore: number;
  branch: string | null;
  hostel: string | null;
  ptuRollNo: string | null;
  createdAt: string;
}

export interface AdminProductData {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  condition: string;
  status: "available" | "sold" | "hidden";
  views: number;
  isArchived: boolean;
  images: string[];
  sellerName: string;
  sellerEmail: string;
  storeName: string;
  createdAt: string;
}

export interface AdminVerificationData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ptuRollNo: string;
  portalScreenshotUrl: string;
  liveVerificationCode: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminOrderData {
  id: string;
  totalCents: number;
  status: "seller_confirmed" | "completed" | "cancelled";
  productName: string;
  productSlug: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  createdAt: string;
}

interface AdminDashboardClientProps {
  currentAdminId: string;
  initialUsers: AdminUserData[];
  initialProducts: AdminProductData[];
  initialVerifications: AdminVerificationData[];
  initialOrders: AdminOrderData[];
  metrics: {
    totalUsers: number;
    totalListings: number;
    pendingVerifications: number;
    totalOrders: number;
    totalVolumeRupees: number;
  };
}

export function AdminDashboardClient({
  currentAdminId,
  initialUsers,
  initialProducts,
  initialVerifications,
  initialOrders,
  metrics,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "products" | "verifications" | "orders">("users");

  // State data
  const [usersList, setUsersList] = useState(initialUsers);
  const [productsList, setProductsList] = useState(initialProducts);
  const [verificationsList, setVerificationsList] = useState(initialVerifications);
  const [ordersList, setOrdersList] = useState(initialOrders);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "verified" | "pending" | "unverified" | "admin">("all");

  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "available" | "sold" | "hidden">("all");

  const [orderSearch, setOrderSearch] = useState("");

  // Loading indicator for active action
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  // Screenshot modal preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Permanent User Delete Modal
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUserData | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // -------------------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------------------
  const handleUpdateStudentStatus = async (
    userId: string,
    status: "unverified" | "pending" | "verified" | "rejected"
  ) => {
    setPendingActionId(`user-status-${userId}`);
    try {
      const res = await adminUpdateUserStudentStatusAction(userId, status);
      if (!res.success) {
        toast.error("Failed to update student status", { description: res.error });
        return;
      }

      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, studentStatus: status, trustScore: status === "verified" ? 85 : u.trustScore } : u))
      );
      setVerificationsList((prev) =>
        prev.map((v) =>
          v.userId === userId
            ? {
                ...v,
                status: status === "verified" ? "approved" : status === "rejected" ? "rejected" : "pending",
              }
            : v
        )
      );
      toast.success("Student status updated", {
        description: `User marked as ${status}.`,
      });
    } catch {
      toast.error("Error updating user");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    const makeAdmin = !currentAdmin;
    setPendingActionId(`user-role-${userId}`);
    try {
      const res = await adminToggleUserRoleAction(userId, makeAdmin);
      if (!res.success) {
        toast.error("Role update failed", { description: res.error });
        return;
      }

      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: makeAdmin } : u))
      );
      toast.success(makeAdmin ? "Granted Admin Access" : "Revoked Admin Access");
    } catch {
      toast.error("Error updating role");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setIsDeletingUser(true);
    try {
      const res = await adminDeleteUserAction(deleteUserTarget.id);
      if (!res.success) {
        toast.error("Failed to delete account", { description: res.error });
        return;
      }

      const deleted = deleteUserTarget;
      setUsersList((prev) => prev.filter((u) => u.id !== deleted.id));
      setProductsList((prev) => prev.filter((p) => p.sellerEmail !== deleted.email));
      setVerificationsList((prev) => prev.filter((v) => v.userId !== deleted.id));
      setOrdersList((prev) =>
        prev.filter((o) => o.buyerEmail !== deleted.email && o.sellerName !== deleted.name)
      );
      setDeleteUserTarget(null);
      toast.success("Account permanently deleted", {
        description: `${deleted.name} (${deleted.email}) and all associated data were removed.`,
      });
      router.refresh();
    } catch {
      toast.error("Error deleting user account");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // -------------------------------------------------------------------------
  // PRODUCT ACTIONS
  // -------------------------------------------------------------------------
  const handleUpdateProductStatus = async (
    productId: string,
    status: "available" | "sold" | "hidden"
  ) => {
    setPendingActionId(`prod-status-${productId}`);
    try {
      const res = await adminUpdateProductStatusAction(productId, status);
      if (!res.success) {
        toast.error("Failed to change product status", { description: res.error });
        return;
      }

      setProductsList((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p))
      );
      toast.success(`Listing status changed to ${status}`);
    } catch {
      toast.error("Error changing status");
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this listing from the marketplace?")) return;

    setPendingActionId(`prod-del-${productId}`);
    try {
      const res = await adminDeleteProductAction(productId);
      if (!res.success) {
        toast.error("Failed to delete listing", { description: res.error });
        return;
      }

      setProductsList((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Listing deleted successfully");
    } catch {
      toast.error("Error deleting listing");
    } finally {
      setPendingActionId(null);
    }
  };

  // -------------------------------------------------------------------------
  // ORDER ACTIONS
  // -------------------------------------------------------------------------
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: "seller_confirmed" | "completed" | "cancelled"
  ) => {
    setPendingActionId(`order-${orderId}`);
    try {
      const res = await adminUpdateOrderStatusAction(orderId, status);
      if (!res.success) {
        toast.error("Failed to update order", { description: res.error });
        return;
      }

      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order status set to ${status}`);
    } catch {
      toast.error("Error updating order");
    } finally {
      setPendingActionId(null);
    }
  };

  // -------------------------------------------------------------------------
  // FILTERED LISTS
  // -------------------------------------------------------------------------
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.ptuRollNo && u.ptuRollNo.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (userFilter === "verified") return u.studentStatus === "verified";
    if (userFilter === "pending") return u.studentStatus === "pending";
    if (userFilter === "unverified") return u.studentStatus === "unverified";
    if (userFilter === "admin") return u.isAdmin;
    return true;
  });

  const filteredProducts = productsList.filter((p) => {
    const q = productSearch.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.storeName.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (productFilter !== "all" && p.status !== productFilter) return false;
    return true;
  });

  const filteredOrders = ordersList.filter((o) => {
    const q = orderSearch.toLowerCase();
    return (
      o.productName.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.sellerName.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. TOP STATS / METRICS CARDS (Pure Light Figma Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Total Students
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              {metrics.totalUsers}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">registered</span>
          </div>
        </div>

        {/* Total Listings */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Marketplace Items
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              {metrics.totalListings}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">in catalog</span>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Pending Verifications
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-amber-600">
              {metrics.pendingVerifications}
            </span>
            <span className="text-[10px] sm:text-[11px] text-amber-600 font-medium">needs review</span>
          </div>
        </div>

        {/* Campus Volume */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
              Campus Volume
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display font-black text-xl sm:text-3xl text-slate-900">
              ₹{metrics.totalVolumeRupees.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">in {metrics.totalOrders} deals</span>
          </div>
        </div>
      </div>

      {/* 2. ADMIN NAVIGATION TABS */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Listings ({productsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("verifications")}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "verifications"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Desk ({verificationsList.length})</span>
            {metrics.pendingVerifications > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {metrics.pendingVerifications}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders ({ordersList.length})</span>
          </button>
        </div>

        <div className="hidden sm:block text-xs text-slate-500 font-semibold px-2">
          Administrator Desk
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: USERS & STUDENTS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, roll number..."
                className="pl-9 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {(["all", "verified", "pending", "unverified", "admin"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    userFilter === filter
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Student Status</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Trust</th>
                    <th className="py-3 px-4">Campus Info</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{user.name}</div>
                              <div className="text-slate-500 text-[11px]">{user.email}</div>
                              <div className="text-slate-400 text-[10px]">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Student Verification Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                user.studentStatus === "verified"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : user.studentStatus === "pending"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {user.studentStatus === "verified" ? (
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                              )}
                              <span className="capitalize">{user.studentStatus}</span>
                            </span>
                            {user.ptuRollNo && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Roll: {user.ptuRollNo}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          {user.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Student</span>
                          )}
                        </td>

                        {/* Trust Score */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{user.trustScore} pts</span>
                        </td>

                        {/* Campus Info */}
                        <td className="py-3.5 px-4 text-slate-500">
                          <div>{user.branch || "General"}</div>
                          <div className="text-[10px] text-slate-400">{user.hostel || "Day Scholar"}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Verification toggles */}
                            {user.studentStatus !== "verified" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingActionId === `user-status-${user.id}`}
                                onClick={() => handleUpdateStudentStatus(user.id, "verified")}
                                className="h-7 px-2.5 text-[11px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              >
                                {pendingActionId === `user-status-${user.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 mr-1" /> Verify
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingActionId === `user-status-${user.id}`}
                                onClick={() => handleUpdateStudentStatus(user.id, "unverified")}
                                className="h-7 px-2 text-[11px] font-semibold text-slate-500 border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                              >
                                Revoke
                              </Button>
                            )}

                            {/* Toggle Admin */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pendingActionId === `user-role-${user.id}`}
                              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                              className={`h-7 px-2 text-[11px] font-semibold rounded-lg cursor-pointer ${
                                user.isAdmin
                                  ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                  : "text-purple-600 border-purple-200 hover:bg-purple-50"
                              }`}
                            >
                              {user.isAdmin ? "Demote" : "Make Admin"}
                            </Button>

                            {/* Permanently Delete User */}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={user.id === currentAdminId || isDeletingUser}
                              onClick={() => setDeleteUserTarget(user)}
                              title={
                                user.id === currentAdminId
                                  ? "You cannot delete your own account"
                                  : "Permanently delete user account"
                              }
                              aria-label={`Delete ${user.name}`}
                              className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: MARKETPLACE LISTINGS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search listings by title, seller..."
                className="pl-9 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {(["all", "available", "sold", "hidden"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProductFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    productFilter === filter
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No listings found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const img = prod.images?.[0] || "/placeholder-item.jpg";
                      const priceRs = Math.round(prod.priceCents / 100);

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Item Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 relative overflow-hidden shrink-0 border border-slate-200">
                                <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/product/${prod.slug}`}
                                  className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 transition-colors"
                                >
                                  {prod.name}
                                </Link>
                                <div className="text-[11px] text-slate-400 capitalize">
                                  {prod.condition.replace("_", " ")} • {new Date(prod.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-blue-600 text-sm">₹{priceRs}</span>
                          </td>

                          {/* Seller */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{prod.sellerName}</div>
                            <div className="text-[10px] text-slate-400">{prod.storeName}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                prod.status === "available"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : prod.status === "sold"
                                  ? "bg-slate-100 text-slate-800 border border-slate-300"
                                  : "bg-amber-50 text-amber-600 border border-amber-200"
                              }`}
                            >
                              {prod.status}
                            </span>
                          </td>

                          {/* Views */}
                          <td className="py-3.5 px-4 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-400" /> {prod.views}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {prod.status !== "available" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pendingActionId === `prod-status-${prod.id}`}
                                  onClick={() => handleUpdateProductStatus(prod.id, "available")}
                                  className="h-7 px-2 text-[11px] font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                  title="Make Available"
                                >
                                  Mark Active
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pendingActionId === `prod-status-${prod.id}`}
                                  onClick={() => handleUpdateProductStatus(prod.id, "hidden")}
                                  className="h-7 px-2 text-[11px] font-semibold text-amber-600 border-amber-200 hover:bg-amber-50 rounded-lg cursor-pointer"
                                  title="Hide from search"
                                >
                                  Hide
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={pendingActionId === `prod-del-${prod.id}`}
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: VERIFICATION DESK */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Student ID &amp; PTU Portal Proof Queue
            </h3>
            <p className="text-xs text-slate-500">
              Inspect student portal screenshots containing their live anti-fraud safety codes before granting verified status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {verificationsList.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                No verification requests found.
              </div>
            ) : (
              verificationsList.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{req.userName}</h4>
                        <p className="text-xs text-slate-500">{req.userEmail}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : req.status === "pending"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        {req.status === "approved" ? "verified" : req.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                      <div>
                        <strong className="text-slate-700">PTU Roll No:</strong>{" "}
                        <span className="font-mono text-slate-900 font-semibold">{req.ptuRollNo}</span>
                      </div>
                      <div>
                        <strong className="text-slate-700">Required Code:</strong>{" "}
                        <span className="font-mono font-bold text-blue-600">{req.liveVerificationCode}</span>
                      </div>
                    </div>

                    {/* Screenshot thumbnail */}
                    {req.portalScreenshotUrl && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">Uploaded Portal Proof:</span>
                        <div
                          onClick={() => setPreviewImage(req.portalScreenshotUrl)}
                          className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group"
                        >
                          <img
                            src={req.portalScreenshotUrl}
                            alt="Portal proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <Eye className="w-4 h-4" /> Click to enlarge
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={pendingActionId === `verify-${req.userId}`}
                        onClick={() => handleUpdateStudentStatus(req.userId, "verified")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pendingActionId === `verify-${req.userId}`}
                        onClick={() => handleUpdateStudentStatus(req.userId, "rejected")}
                        className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-bold h-9"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: ORDERS & TRANSACTIONS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by item, buyer, seller..."
                className="pl-9 h-10 text-xs rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total campus transaction volume:{" "}
              <strong className="text-slate-900 font-bold">
                ₹{metrics.totalVolumeRupees.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const amountRs = Math.round(order.totalCents / 100);

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <Link href={`/product/${order.productSlug}`} className="hover:text-blue-600 transition-colors">
                              {order.productName}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-blue-600 text-sm">
                            ₹{amountRs}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{order.buyerName}</div>
                            <div className="text-[10px] text-slate-400">{order.buyerEmail}</div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {order.sellerName}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === "completed"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                  : order.status === "seller_confirmed"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status !== "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pendingActionId === `order-${order.id}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                                  className="h-7 px-2 text-[11px] font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                >
                                  Mark Completed
                                </Button>
                              )}
                              {order.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={pendingActionId === `order-${order.id}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                  className="h-7 px-2 text-[11px] font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. IMAGE ENLARGE MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full bg-white rounded-2xl overflow-hidden p-2">
            <img
              src={previewImage}
              alt="Proof full preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* 5. DELETE USER CONFIRMATION MODAL */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-900">
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {deleteUserTarget.email}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 font-semibold">{deleteUserTarget.name}</strong>{" "}
              (<span className="font-mono text-xs">@{deleteUserTarget.username}</span>)? This will erase their account, storefront, listings, messages, verification requests, and related orders from the database.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteUserTarget(null)}
                disabled={isDeletingUser}
                className="rounded-xl h-10 border-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-4 text-xs font-bold shadow-xs cursor-pointer"
              >
                {isDeletingUser ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Permanently Delete Account"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
