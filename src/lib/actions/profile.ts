"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, reports, auditLogs } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * Updates user profile details (avatar, name, bio, branch, year/semester, hostel)
 */
export async function updateProfileAction(input: {
  name: string;
  bio?: string;
  branch?: string;
  yearSemester?: string;
  hostel?: string;
  avatarUrl?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to update your profile." };
  }

  const { name, bio, branch, yearSemester, hostel, avatarUrl } = input;

  if (!name.trim() || name.trim().length < 2) {
    return { success: false, error: "Full name must be at least 2 characters long." };
  }

  await db
    .update(users)
    .set({
      name: name.trim(),
      bio: bio?.trim() || null,
      branch: branch?.trim() || null,
      yearSemester: yearSemester?.trim() || null,
      hostel: hostel?.trim() || null,
      avatarUrl: avatarUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, message: "Profile updated successfully!" };
}

/**
 * Changes user password with Argon2 hashing
 */
export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in." };
  }

  const { currentPassword, newPassword } = input;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const newHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "PASSWORD_CHANGED",
  });

  return { success: true, message: "Password updated successfully!" };
}

/**
 * Reports a product or seller for moderation
 */
export async function reportTargetAction(input: {
  targetType: "product" | "user";
  targetId: string;
  reason: string;
  details?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to submit a report." };
  }

  const { targetType, targetId, reason, details } = input;

  if (!reason.trim()) {
    return { success: false, error: "Please specify a reason for the report." };
  }

  // Rate limit reports per user
  const rateCheck = checkRateLimit(`report:${session.user.id}`, 3, 60 * 60 * 1000);
  if (!rateCheck.success) {
    return { success: false, error: "Too many report submissions. Please wait an hour." };
  }

  await db.insert(reports).values({
    reporterId: session.user.id,
    targetType,
    targetId,
    reason: reason.trim(),
    details: details?.trim() || null,
    status: "pending",
  });

  return {
    success: true,
    message: "Thank you for reporting. Our moderation team will investigate.",
  };
}
