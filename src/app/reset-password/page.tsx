"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/actions/auth";

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    try {
      const res = await resetPasswordAction({ token, password });
      if (!res.success) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setSuccessMsg("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/sign-in?reset=true");
      }, 1500);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs mb-3">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Set New Password
          </h1>
          <p className="text-sm text-slate-600">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        {!token ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600" /> Invalid Reset Link
            </div>
            <p>
              This reset link is missing a valid security token or has expired. Please request a new password reset link.
            </p>
            <div className="pt-2">
              <Link href="/forgot-password">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl">
                  Request New Link
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-10 h-11 rounded-2xl border-slate-200"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="pl-10 h-11 rounded-2xl border-slate-200"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all mt-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password & Sign In"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
