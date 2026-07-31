import Link from "next/link";
import { MessageCircle, Plus, ListOrdered, User, ShieldCheck, ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { getTenantByOwnerId } from "@/db/queries/tenants";
import { getProductsByTenantId } from "@/db/queries/products";
import { Button } from "@/components/ui/button";
import { ListingRow } from "@/components/store/listing-row";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const tenant = await getTenantByOwnerId(session.user.id);
  const studentStatus = session.user.studentStatus || "unverified";

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
            Welcome back, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-600">
            Manage your store items, messages, and student profile.
          </p>
        </div>

        <Link href="/sell">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-100">
            <Plus className="h-5 w-5 mr-1" /> Sell New Item
          </Button>
        </Link>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/my-listings"
          className="flex items-center gap-3.5 p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <ListOrdered className="h-6 w-6" />
          </span>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Dashboard</span>
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">My Listings</span>
          </div>
        </Link>

        <Link
          href="/dashboard/messages"
          className="flex items-center gap-3.5 p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <MessageCircle className="h-6 w-6" />
          </span>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat</span>
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">Messages</span>
          </div>
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-3.5 p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <User className="h-6 w-6" />
          </span>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</span>
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base">My Profile</span>
          </div>
        </Link>
      </div>

      {/* Student Status Card */}
      {studentStatus !== "verified" && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-950 font-display">Unverified Seller Status</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Unverified sellers can list up to 2 items max. Get Student Verified using your PTU Portal to unlock unlimited listings and higher trust rank!
              </p>
            </div>
          </div>
          <Link href="/student-verification" className="shrink-0">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold px-4">
              Get Verified
            </Button>
          </Link>
        </div>
      )}

      {/* Listings Section */}
      {!tenant ? (
        <div className="p-8 rounded-3xl border border-slate-200 bg-white text-center space-y-3">
          <h2 className="font-display font-bold text-lg text-slate-900">
            Create Your Seller Storefront
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Set up your storefront in one click to post unused books, lab tools, or electronics.
          </p>
          <Link href="/sell">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl">Create Storefront</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-slate-900">
              Active Store Items
            </h2>
            <Link href="/dashboard/my-listings">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600">
                View All Listings →
              </Button>
            </Link>
          </div>

          <ListingsList tenantId={tenant.id} />
        </div>
      )}
    </div>
  );
}

async function ListingsList({ tenantId }: { tenantId: string }) {
  const listings = await getProductsByTenantId(tenantId);

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
        <p className="text-slate-500 text-sm">
          No listings yet — click &quot;Sell New Item&quot; to post your first textbook or item.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listings.map((product) => (
        <ListingRow key={product.id} product={product} />
      ))}
    </div>
  );
}
