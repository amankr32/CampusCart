"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordAction,
  resetPasswordWithOtpAction,
} from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Inline 6-digit reset code form state
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsPending(true);
    try {
      const res = await forgotPasswordAction({ email });
      if (!res.success) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setSubmitted(true);
      setIsPending(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit reset code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordWithOtpAction({
        email,
        code: code.trim(),
        password: newPassword,
      });

      if (!res.success) {
        setError(res.error);
        setIsResetting(false);
        return;
      }

      setResetSuccessMsg("Password updated permanently! Taking you to sign in...");
      setTimeout(() => {
        router.push("/sign-in?reset=true");
      }, 1200);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-3xl border border-[var(--border-subtle)] shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-[var(--brand-primary-light)] border border-blue-500/20 text-[var(--brand-primary)] shadow-xs mb-3">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {submitted
              ? "Click the reset link in your email, or enter the 6-digit code below."
              : "Enter your email and we'll send you a reset link and 6-digit code."}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
            {error}
          </div>
        )}

        {resetSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{resetSuccessMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-emerald-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Reset Email Sent</span>
              </div>
              <p>
                We sent a password reset link and 6-digit code to{" "}
                <span className="font-semibold break-all">{email}</span> (valid for 15 minutes).
              </p>
            </div>

            <form onSubmit={handleResetWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  6-Digit Reset Code
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code from email"
                  className="h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] font-mono text-center text-lg tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-10 pr-10 h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="pl-10 pr-10 h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isResetting}
                className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-100 transition-all cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setError(null);
                  setCode("");
                }}
                className="font-medium text-[var(--text-muted)] hover:text-[var(--brand-primary)] cursor-pointer"
              >
                Use different email
              </button>
              <Link href="/sign-in" className="font-semibold text-[var(--brand-primary)] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-100 transition-all mt-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reset Email...
                </>
              ) : (
                "Send Reset Link & Code"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link href="/sign-in" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--brand-primary)]">
                <ArrowLeft className="w-3 h-3" /> Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
