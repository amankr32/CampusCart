"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Mail,
  Loader2,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
} from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { verifyOtpAction, resendOtpAction } from "@/lib/actions/auth";

function VerifyEmailFormContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [manualEmail, setManualEmail] = useState("");
  const email = emailParam || manualEmail;
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input box on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const code = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // If pasted multiple digits
    if (cleaned.length > 1) {
      handlePasteDigits(cleaned);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned[0];
    setDigits(nextDigits);

    // Auto advance to next box
    if (index < 5 && cleaned[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Jump back to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    handlePasteDigits(pasted);
  };

  const handlePasteDigits = (text: string) => {
    const chars = text.slice(0, 6).split("");
    const nextDigits = ["", "", "", "", "", ""];
    chars.forEach((c, i) => {
      nextDigits[i] = c;
    });
    setDigits(nextDigits);
    const focusIdx = Math.min(chars.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Please provide a valid email address.");
      return;
    }

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsPending(true);
    try {
      const res = await verifyOtpAction({ email: email.trim(), code });
      if (!res.success) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      setSuccessMsg("Account verified! Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 800);
    } catch {
      setError("Failed to verify code. Please check your internet connection and try again.");
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await resendOtpAction(email.trim());
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSuccessMsg("A fresh 6-digit code has been sent to your email!");
      setResendCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend code. Please try again in a moment.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-600 text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <ShoppingBag className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="text-left leading-none">
              <span className="font-display font-black text-2xl tracking-tight text-slate-900 dark:text-white">
                campuscart<span className="text-blue-600 font-black">.</span>
              </span>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                IKGPTU Marketplace
              </p>
            </div>
          </Link>
        </div>

        {/* Human-Centered White Verification Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3">
              <Mail className="h-6 w-6" strokeWidth={2} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-slate-900 dark:text-slate-200 break-all">
                {email || "your email address"}
              </span>
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {!emailParam && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
                Enter 6-Digit Code
              </label>

              {/* 6 Tactile, Individual PIN Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-2xl font-bold text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Solid E-Commerce Button */}
            <Button
              type="submit"
              disabled={isPending || code.length !== 6}
              className="w-full h-11.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </span>
              ) : (
                "Verify Email & Continue"
              )}
            </Button>
          </form>

          {/* Resend & Email Spam Hint */}
          <div className="pt-2 text-center space-y-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Didn&apos;t receive the code? Be sure to check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
            </p>
            <div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1 font-medium hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>

            <Link
              href="/sign-up"
              className="font-medium hover:text-slate-900 dark:hover:text-white"
            >
              Change email
            </Link>
          </div>
        </div>

        {/* Campus Verification Reassurance Footnote */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Verifying your email OTP automatically activates your verified CampusCart account</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailFormContent />
    </Suspense>
  );
}
