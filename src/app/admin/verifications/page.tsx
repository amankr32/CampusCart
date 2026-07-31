import { auth } from "@/auth";
import { db } from "@/db";
import { studentVerifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminVerificationList } from "@/components/admin/admin-verification-list";
import { ShieldCheck } from "lucide-react";

export default async function AdminVerificationsPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  // Fetch all verification requests ordered by created date
  const requests = await db
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Admin Control Desk
          </div>
          <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
            Student Verification Desk
          </h1>
          <p className="text-sm text-slate-600">
            Review PTU portal screenshots and anti-fraud codes to grant Student Verified badges.
          </p>
        </div>
      </div>

      <AdminVerificationList initialRequests={requests} />
    </div>
  );
}
