"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, Upload, Loader2, CheckCircle2, Copy, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitStudentVerificationAction } from "@/lib/actions/verification";

export default function StudentVerificationPage() {
  const { data: session, status } = useSession();
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
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload screenshot.");
      }

      const data = await res.json();
      setScreenshotUrl(data.url);
    } catch {
      setError("Failed to upload screenshot image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(antiFraudCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!ptuRollNo.trim()) {
      setError("Please enter your PTU Roll Number / Student Registration ID.");
      return;
    }

    if (!screenshotUrl) {
      setError("Please upload your PTU portal verification screenshot.");
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
        setIsSubmitting(false);
        return;
      }

      setSuccess(res.message || "Verification request submitted successfully!");
      setIsSubmitting(false);
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch {
      setError("Failed to submit verification. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" /> Safe & Trusted Campus Community
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 tracking-tight">
          Student Identity Verification
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 h-11 shadow-md shadow-emerald-200"
            >
              Post Unlimited Listings
            </Button>
          </div>
        </div>
      ) : studentStatus === "pending" ? (
        <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4 shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-amber-950 font-display">Verification Under Review</h2>
          <p className="text-sm text-amber-800 max-w-md mx-auto">
            Your verification request with your PTU portal screenshot is currently being reviewed by our admin desk. This usually takes 1-12 hours.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
          {studentStatus === "rejected" && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Previous Request Rejected
              </div>
              <p>Please resubmit with a clear screenshot of your PTU portal containing the live code below.</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {success}
            </div>
          )}

          {/* Anti-Fraud Code Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Anti-Fraud Safety Code
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-medium text-indigo-300 hover:text-white inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-widest font-mono text-indigo-400">
                {antiFraudCode}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Required:</strong> To prevent fake screenshots, your uploaded proof image MUST clearly show this verification code written on a paper or displayed next to your PTU Portal profile!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                1. PTU Roll Number / University ID
              </label>
              <Input
                type="text"
                value={ptuRollNo}
                onChange={(e) => setPtuRollNo(e.target.value)}
                placeholder="e.g. 21012345 or PTU/BC/2022/104"
                className="h-12 rounded-2xl border-slate-200 text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                2. PTU Portal Proof Image (With Code {antiFraudCode})
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
                {screenshotUrl ? (
                  <div className="space-y-3">
                    <img
                      src={screenshotUrl}
                      alt="PTU Portal Proof"
                      className="max-h-56 mx-auto rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setScreenshotUrl("")}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove & Upload Different Photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
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
              className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-md shadow-indigo-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
