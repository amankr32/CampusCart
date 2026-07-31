"use server";

import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, studentVerifications, auditLogs } from "@/db/schema";
import { calculateUserTrustScore } from "@/lib/trust-score";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * Submits a new Student Verification Request with Anti-Fraud token
 */
export async function submitStudentVerificationAction(input: {
  ptuRollNo: string;
  portalScreenshotUrl: string;
  liveVerificationCode: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to verify your student status." };
  }

  const { ptuRollNo, portalScreenshotUrl, liveVerificationCode } = input;

  if (!ptuRollNo.trim() || !portalScreenshotUrl.trim() || !liveVerificationCode.trim()) {
    return { success: false, error: "Please fill out all fields and upload portal proof." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) {
    return { success: false, error: "User profile not found." };
  }

  if (!user.emailVerifiedAt) {
    return { success: false, error: "Please verify your email address before applying for student verification." };
  }

  // Insert verification request
  await db.insert(studentVerifications).values({
    userId: session.user.id,
    ptuRollNo: ptuRollNo.trim(),
    portalScreenshotUrl,
    liveVerificationCode,
    status: "pending",
  });

  // Update user studentStatus to pending
  await db
    .update(users)
    .set({
      studentStatus: "pending",
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  // Audit log
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "STUDENT_VERIFICATION_SUBMITTED",
    details: { ptuRollNo, liveVerificationCode },
  });

  return {
    success: true,
    message: "Verification request submitted! Our team will review your PTU portal verification shortly.",
  };
}

/**
 * Admin action to review (Approve or Reject) a student verification request
 */
export async function reviewStudentVerificationAction(input: {
  verificationId: string;
  action: "approve" | "reject";
  rejectionReason?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    return { success: false, error: "Unauthorized. Admin privileges required." };
  }

  const { verificationId, action, rejectionReason } = input;

  const [req] = await db
    .select()
    .from(studentVerifications)
    .where(eq(studentVerifications.id, verificationId))
    .limit(1);

  if (!req) {
    return { success: false, error: "Verification request not found." };
  }

  if (action === "approve") {
    // Mark request approved
    await db
      .update(studentVerifications)
      .set({
        status: "approved",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentVerifications.id, verificationId));

    // Update user status & recalculate trust score
    await db
      .update(users)
      .set({
        studentStatus: "verified",
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.userId));

    await calculateUserTrustScore(req.userId);

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "STUDENT_VERIFICATION_APPROVED",
      details: { targetUserId: req.userId, verificationId },
    });

    return { success: true, message: "Student verification approved successfully!" };
  } else {
    const reason = rejectionReason?.trim() || "Information or portal proof provided did not match.";

    await db
      .update(studentVerifications)
      .set({
        status: "rejected",
        rejectionReason: reason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentVerifications.id, verificationId));

    await db
      .update(users)
      .set({
        studentStatus: "rejected",
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.userId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "STUDENT_VERIFICATION_REJECTED",
      details: { targetUserId: req.userId, verificationId, reason },
    });

    return { success: true, message: "Student verification request rejected." };
  }
}
