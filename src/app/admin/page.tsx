import { auth } from "@/auth";
import { db } from "@/db";
import { users, products, tenants, studentVerifications, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  AdminDashboardClient,
  type AdminUserData,
  type AdminProductData,
  type AdminVerificationData,
  type AdminOrderData,
} from "@/components/admin/admin-dashboard-client";
import { ShieldCheck } from "@/components/ui/material-symbol";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  // 1. Fetch Users
  const rawUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      studentStatus: users.studentStatus,
      isAdmin: users.isAdmin,
      trustScore: users.trustScore,
      branch: users.branch,
      hostel: users.hostel,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  // Get roll numbers mapping from studentVerifications
  const rawRollNos = await db
    .select({
      userId: studentVerifications.userId,
      ptuRollNo: studentVerifications.ptuRollNo,
    })
    .from(studentVerifications);

  const rollMap = new Map<string, string>();
  for (const r of rawRollNos) {
    if (r.ptuRollNo) rollMap.set(r.userId, r.ptuRollNo);
  }

  const usersList: AdminUserData[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    studentStatus: u.studentStatus,
    isAdmin: u.isAdmin,
    trustScore: u.trustScore,
    branch: u.branch,
    hostel: u.hostel,
    ptuRollNo: rollMap.get(u.id) || null,
    createdAt: u.createdAt.toISOString(),
  }));

  // 2. Fetch Products
  const rawProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceCents: products.priceCents,
      condition: products.condition,
      status: products.status,
      views: products.views,
      isArchived: products.isArchived,
      images: products.images,
      createdAt: products.createdAt,
      sellerName: users.name,
      sellerEmail: users.email,
      storeName: tenants.storeName,
    })
    .from(products)
    .innerJoin(tenants, eq(products.tenantId, tenants.id))
    .innerJoin(users, eq(tenants.ownerId, users.id))
    .where(eq(products.isArchived, false))
    .orderBy(desc(products.createdAt));

  const productsList: AdminProductData[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    condition: p.condition,
    status: p.status as "available" | "sold" | "hidden",
    views: p.views,
    isArchived: p.isArchived,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    sellerName: p.sellerName,
    sellerEmail: p.sellerEmail,
    storeName: p.storeName,
    createdAt: p.createdAt.toISOString(),
  }));

  // 3. Fetch Verifications
  const rawVerifications = await db
    .select({
      id: studentVerifications.id,
      userId: studentVerifications.userId,
      ptuRollNo: studentVerifications.ptuRollNo,
      portalScreenshotUrl: studentVerifications.portalScreenshotUrl,
      liveVerificationCode: studentVerifications.liveVerificationCode,
      status: studentVerifications.status,
      rejectionReason: studentVerifications.rejectionReason,
      createdAt: studentVerifications.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(studentVerifications)
    .innerJoin(users, eq(studentVerifications.userId, users.id))
    .orderBy(desc(studentVerifications.createdAt));

  const verificationsList: AdminVerificationData[] = rawVerifications.map((v) => ({
    id: v.id,
    userId: v.userId,
    userName: v.userName,
    userEmail: v.userEmail,
    ptuRollNo: v.ptuRollNo,
    portalScreenshotUrl: v.portalScreenshotUrl,
    liveVerificationCode: v.liveVerificationCode,
    status: v.status as "pending" | "approved" | "rejected",
    rejectionReason: v.rejectionReason,
    createdAt: v.createdAt.toISOString(),
  }));

  // 4. Fetch Orders
  const rawOrders = await db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      status: orders.status,
      createdAt: orders.createdAt,
      productName: products.name,
      productSlug: products.slug,
      buyerName: users.name,
      buyerEmail: users.email,
      sellerName: tenants.storeName,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .innerJoin(tenants, eq(orders.tenantId, tenants.id))
    .orderBy(desc(orders.createdAt));

  const ordersList: AdminOrderData[] = rawOrders.map((o) => ({
    id: o.id,
    totalCents: o.totalCents,
    status: o.status as "seller_confirmed" | "completed" | "cancelled",
    productName: o.productName,
    productSlug: o.productSlug,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    sellerName: o.sellerName,
    createdAt: o.createdAt.toISOString(),
  }));

  // Metrics
  const pendingVerifications = verificationsList.filter((v) => v.status === "pending").length;
  const totalVolumeCents = ordersList.reduce((acc, curr) => acc + curr.totalCents, 0);

  const metrics = {
    totalUsers: usersList.length,
    totalListings: productsList.length,
    pendingVerifications,
    totalOrders: ordersList.length,
    totalVolumeRupees: Math.round(totalVolumeCents / 100),
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 pb-24 md:pb-10 space-y-5 sm:space-y-8 min-w-0">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-2 border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>CampusCart Administrator Portal</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black font-display text-slate-900 tracking-tight">
            Admin Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage students, approve PTU identity verifications, moderate marketplace listings, and resolve orders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Admin: {session.user.name?.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Main Admin Dashboard */}
      <AdminDashboardClient
        currentAdminId={session.user.id}
        initialUsers={usersList}
        initialProducts={productsList}
        initialVerifications={verificationsList}
        initialOrders={ordersList}
        metrics={metrics}
      />
    </div>
  );
}
