"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs mb-3">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-600">
            Enter your email and we&apos;ll send you a single-use password reset link.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Reset Link Sent
            </div>
            <p>
              If an account with <span className="font-semibold">{email}</span> exists, we have sent a secure password reset link to your email.
            </p>
            <p className="text-xs text-slate-500">
              The link will expire in 15 minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <div className="pt-2">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full rounded-2xl">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="pl-10 h-11 rounded-2xl border-slate-200"
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                  Sending Link...
                </>
              ) : (
                "Send Password Reset Link"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link href="/sign-in" className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600">
                <ArrowLeft className="w-3 h-3" /> Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
