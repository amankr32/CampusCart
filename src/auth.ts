import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { signInSchema } from "@/lib/validations/auth";
import { verifyInternalAuthToken } from "@/lib/auth-token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        preVerifiedToken: { label: "Token", type: "text" },
      },
      authorize: async (rawCredentials) => {
        const parsed = signInSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const preVerifiedToken =
          typeof rawCredentials === "object" &&
          rawCredentials !== null &&
          "preVerifiedToken" in rawCredentials
            ? (rawCredentials.preVerifiedToken as string)
            : undefined;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()))
          .limit(1);

        if (!user) {
          return null;
        }

        // Skip redundant Argon2 verification if the server action already confirmed it
        const isPreVerified = verifyInternalAuthToken(preVerifiedToken, user.id);
        if (!isPreVerified) {
          const isValidPassword = await verifyPassword(
            password,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }
        }

        // Email Verification Check: Must be verified before logging in
        if (!user.emailVerifiedAt) {
          throw new Error("UNVERIFIED_EMAIL");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
          studentStatus: user.studentStatus,
          trustScore: user.trustScore,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        const u = user as unknown as {
          id: string;
          username: string;
          isAdmin: boolean;
          studentStatus?: string;
          trustScore?: number;
        };
        token.id = u.id;
        token.username = u.username;
        token.isAdmin = u.isAdmin;
        token.studentStatus = u.studentStatus;
        token.trustScore = u.trustScore;
      }

      const userId = (token.id as string) || (token.sub as string);

      if (trigger === "update" && userId) {
        // Re-read latest status and scores directly from DB as source of truth
        const [freshUser] = await db
          .select({
            studentStatus: users.studentStatus,
            trustScore: users.trustScore,
            isAdmin: users.isAdmin,
            username: users.username,
            name: users.name,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (freshUser) {
          token.studentStatus = freshUser.studentStatus;
          token.trustScore = freshUser.trustScore;
          token.isAdmin = freshUser.isAdmin;
          if (freshUser.username) token.username = freshUser.username;
          if (freshUser.name) token.name = freshUser.name;
          if (freshUser.avatarUrl) token.picture = freshUser.avatarUrl;
        }
      }

      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.studentStatus = token.studentStatus as string;
        session.user.trustScore = token.trustScore as number;
      }
      return session;
    },
  },
});
