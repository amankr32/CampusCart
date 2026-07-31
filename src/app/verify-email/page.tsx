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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs mb-3">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-sm text-slate-600">
            We sent a 6-digit verification code to <span className="font-semibold text-slate-900">{email || "your email"}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {!emailParam && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-11 rounded-2xl border-slate-200"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 text-center">
              6-Digit Verification Code
            </label>
            <Input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1 2 3 4 5 6"
              className="h-14 rounded-2xl border-slate-200 text-center text-2xl font-bold tracking-[0.5em] focus:tracking-[0.5em]"
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={isPending || code.length !== 6}
            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all"
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

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Link href="/sign-in" className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-indigo-600">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <VerifyEmailFormContent />
    </Suspense>
  );
}
