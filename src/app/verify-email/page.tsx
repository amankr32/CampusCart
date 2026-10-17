"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, Loader2, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOtpAction, resendOtpAction } from "@/lib/actions/auth";

function VerifyEmailFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !code || code.length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsPending(true);
    try {
      const res = await verifyOtpAction({ email, code });
      if (!res.success) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setSuccessMsg("Email verified successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/sign-in?verified=true");
      }, 1500);
    } catch {
      setError("Failed to verify code. Please try again.");
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await resendOtpAction(email);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccessMsg("A new 6-digit verification code has been sent to your email.");
      setResendCooldown(60);
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-3xl border border-[var(--border-subtle)] shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--brand-primary-light)] border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] shadow-xs mb-3">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            We sent a 6-digit verification code to <span className="font-semibold text-[var(--text-primary)]">{email || "your email"}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {!emailParam && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-11 rounded-2xl bg-[var(--input-bg)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 text-center">
              6-Digit Verification Code
            </label>
            <Input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1 2 3 4 5 6"
              className="h-14 rounded-2xl bg-[var(--input-bg)] border-[var(--border-subtle)] text-center text-2xl font-bold tracking-[0.5em] focus:tracking-[0.5em] text-[var(--text-primary)]"
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={isPending || code.length !== 6}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying Code...
              </>
            ) : (
              "Verify Email & Activate Account"
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
          <Link href="/sign-in" className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    }>
      <VerifyEmailFormContent />
    </Suspense>
  );
}
