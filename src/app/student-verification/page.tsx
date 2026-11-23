"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ShieldCheck, ShieldAlert, Upload, Loader2, CheckCircle2, Copy, AlertTriangle } from "@/components/ui/material-symbol";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitStudentVerificationAction } from "@/lib/actions/verification";
import { toast } from "@/lib/toast";

export default function StudentVerificationPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [ptuRollNo, setPtuRollNo] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [antiFraudCode, setAntiFraudCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate 6-character anti-fraud session token e.g. CART-8492
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAntiFraudCode(`CART-${randomNum}`);

    // Refresh JWT session once on mount to reflect latest admin approval or status changes
    void update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    router.push("/sign-in?callbackUrl=/student-verification");
    return null;
  }

  const studentStatus = session.user.studentStatus || "unverified";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setScreenshotUrl(blob.url);
    } catch {
      setError("Failed to upload screenshot image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(antiFraudCode);
    setCopied(true);
    toast.success("Verification code copied!", {
      description: `Code "${antiFraudCode}" copied to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ptuRollNo.trim()) {
      setError("Please enter your PTU Roll Number / Student Registration ID.");
      toast.error("Roll number required");
      return;
    }

    if (!screenshotUrl) {
      setError("Please upload your PTU portal verification screenshot.");
      toast.error("Proof screenshot required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitStudentVerificationAction({
        ptuRollNo,
        portalScreenshotUrl: screenshotUrl,
        liveVerificationCode: antiFraudCode,
      });

      if (!res.success) {
        setError(res.error);
        toast.error("Submission failed", { description: res.error });
        setIsSubmitting(false);
        return;
      }

      setSuccess(res.message || "Verification request submitted successfully!");
      toast.success("Verification Request Submitted!", {
        description: "Our admin desk will review your PTU screenshot shortly.",
      });
      setIsSubmitting(false);
      await update();
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch {
      setError("Failed to submit verification. Please try again.");
      toast.error("Submission error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-primary-light)] border border-blue-500/20 text-[var(--brand-primary)] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" /> Safe & Trusted Campus Community
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--text-primary)] tracking-tight">
          Student Identity Verification
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto">
          Get verified using your PTU Student Portal to unlock unlimited listing privileges, higher search rank, and your Student Verified Badge!
        </p>
      </div>

      {studentStatus === "verified" ? (
        <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950 font-display">You Are a Verified Student!</h2>
          <p className="text-sm text-emerald-800 max-w-md mx-auto">
            Your PTU student status is active. You have full unlimited marketplace privileges, top search placement, and the Verified Student Trust Badge.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => router.push("/sell")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-11 shadow-xs font-medium"
            >
              Post Unlimited Listings
            </Button>
          </div>
        </div>
      ) : studentStatus === "pending" ? (
        <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center space-y-4 shadow-2xs">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-200 font-display">Verification Under Review</h2>
          <p className="text-sm text-amber-800 dark:text-amber-300 max-w-md mx-auto">
            Your verification request with your PTU portal screenshot is currently being reviewed by our campus admin desk. This usually takes 1-12 hours.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 space-y-8">
          {studentStatus === "rejected" && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-500">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Previous Request Rejected
              </div>
              <p className="text-xs text-[var(--text-muted)]">Please resubmit with a clear screenshot of your PTU portal containing the live code below.</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {success}
            </div>
          )}

          {/* Anti-Fraud Code Banner */}
          <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Anti-Fraud Safety Code
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-medium text-slate-300 hover:text-white inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-widest font-mono text-blue-400">
                {antiFraudCode}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Required:</strong> To verify your student ID, your uploaded proof screenshot must show your university portal with this verification code displayed or written on a note next to it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                1. PTU Roll Number / University ID
              </label>
              <Input
                type="text"
                value={ptuRollNo}
                onChange={(e) => setPtuRollNo(e.target.value)}
                placeholder="e.g. 21012345 or PTU/BC/2022/104"
                className="h-11 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                2. PTU Portal Proof Image (With Code {antiFraudCode})
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                {screenshotUrl ? (
                  <div className="space-y-3">
                    <img
                      src={screenshotUrl}
                      alt="PTU Portal Proof"
                      className="max-h-56 mx-auto rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshotUrl("")}
                      className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                    >
                      Remove & Upload Different Photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isUploading ? "Uploading Screenshot..." : "Click to Upload PTU Portal Photo"}
                    </span>
                    <span className="text-xs text-slate-500">
                      PNG, JPG, or WEBP (Max 5MB) showing portal profile + code {antiFraudCode}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !screenshotUrl || !ptuRollNo}
              className="w-full h-11.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                "Submit Verification Request"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
