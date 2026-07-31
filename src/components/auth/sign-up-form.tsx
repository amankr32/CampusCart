"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUpAction } from "@/lib/actions/auth";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          Full Name
        </label>
        <div className="relative">
          <Input
            {...register("name")}
            type="text"
            placeholder="Aman Kumar"
            className="pl-10 h-11 rounded-2xl border-slate-200"
          />
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {errors.name && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Input
            {...register("email")}
            type="email"
            placeholder="student@example.com"
            className="pl-10 h-11 rounded-2xl border-slate-200"
          />
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
          Password
        </label>
        <div className="relative">
          <Input
            {...register("password")}
            type="password"
            placeholder="At least 8 characters"
            className="pl-10 h-11 rounded-2xl border-slate-200"
          />
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all mt-2"
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

      <p className="text-center text-xs text-slate-500 pt-2">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
