import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/sell", "/orders"];

// This is an *optimistic* check only: it confirms a valid session cookie
// exists so we can redirect anonymous visitors early, before a page even
// renders. It is not the authoritative access check — each protected page
// (and every server action / route handler that mutates data) must still
// call `auth()` itself and verify the session server-side. Never rely on
// this proxy alone to gate access to sensitive data or actions.
export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/sell/:path*", "/orders/:path*"],
};
