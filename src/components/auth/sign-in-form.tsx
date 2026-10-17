"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { credentialsSignInAction } from "@/lib/actions/auth";

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    setError(null);
    setUnverifiedEmail(null);
    setIsPending(true);

    try {
      const res = await credentialsSignInAction(data);

      if (!res.success) {
        if (res.isUnverified && res.email) {
          setUnverifiedEmail(res.email);
          setError(res.error);
        } else {
          setError(res.error);
        }
        setIsPending(false);
        return;
      }

      // Hard redirect to dashboard so session cookie hydrates RootLayout & Navbar immediately
      window.location.href = "/dashboard";
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
          {unverifiedEmail && (
            <div className="pt-1">
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
              >
                Verify Email Code Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Input
            {...register("email")}
            type="email"
            placeholder="student@example.com"
            className="pl-10 h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)]"
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10 h-11 rounded-2xl border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)]"
          />
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none transition-colors p-1"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all mt-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In to Campus Cart"
        )}
      </Button>

      <p className="text-center text-xs text-[var(--text-muted)] pt-2">
        New to Campus Cart?{" "}
        <Link href="/sign-up" className="font-semibold text-[var(--brand-primary)] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
