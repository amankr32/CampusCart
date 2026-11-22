"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUpAction } from "@/lib/actions/auth";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    setError(null);
    setIsPending(true);

    try {
      const res = await signUpAction(data);
      if (!res.success) {
        setError(res.error);
        setIsPending(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Full Name
        </label>
        <div className="relative">
          <Input
            {...register("name")}
            type="text"
            placeholder="Aman Kumar"
            className="pl-10 h-11 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        </div>
        {errors.name && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Input
            {...register("email")}
            type="email"
            placeholder="student@ptu.ac.in"
            className="pl-10 h-11 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Password
        </label>
        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="pl-10 pr-10 h-11 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            className="pl-10 pr-10 h-11 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none transition-colors p-1"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs mt-2 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Campus Cart Account"
        )}
      </Button>

      <p className="text-center text-xs text-[var(--text-muted)] pt-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-[var(--brand-primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
