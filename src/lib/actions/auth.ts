"use server";

import { eq, or } from "drizzle-orm";
import { AuthError } from "next-auth";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function signUpAction(
  input: SignUpInput
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const { name, username, email, password, hostel, branch } = parsed.data;

  const existing = await db
    .select({ id: users.id, email: users.email, username: users.username })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1);

  if (existing[0]?.email === email) {
    return { success: false, error: "An account with that email already exists." };
  }

  if (existing[0]?.username === username) {
    return { success: false, error: "That username is taken." };
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    name,
    username,
    email,
    passwordHash,
    hostel: hostel || null,
    branch: branch || null,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "Account created, but sign-in failed. Try signing in manually.",
      };
    }
    throw error;
  }

  return { success: true };
}
