"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle, ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewStudentVerificationAction } from "@/lib/actions/verification";

interface VerificationItem {
  id: string;
  userId: string;
  ptuRollNo: string;
  portalScreenshotUrl: string;
  liveVerificationCode: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  createdAt: Date;
  userName: string;
  userEmail: string;
}

export function AdminVerificationList({
  initialRequests,
}: {
  initialRequests: VerificationItem[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = requests.filter((r) => {
    const matchesFilter = filter === "all" ? true : r.status === filter;
    const matchesSearch =
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.ptuRollNo.toLowerCase().includes(search.toLowerCase()) ||
      r.liveVerificationCode.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReview = async (verificationId: string, action: "approve" | "reject") => {
    setLoadingId(verificationId);
    try {
      const res = await reviewStudentVerificationAction({
        verificationId,
        action,
        rejectionReason: action === "reject" ? rejectReason : undefined,
      });

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === verificationId
              ? {
                  ...r,
                  status: action === "approve" ? "approved" : "rejected",
                  rejectionReason: action === "reject" ? rejectReason : null,
                }
              : r
          )
        );
        setActiveRejectId(null);
        setRejectReason("");
        router.refresh();
      } else {
        alert(res.error);
      }
    } catch {
      alert("Failed to update status.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab} ({requests.filter((r) => tab === "all" ? true : r.status === tab).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, roll no..."
            className="pl-9 h-10 text-xs rounded-xl"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Verification Requests Found</h3>
          <p className="text-sm text-slate-500">There are no student verification items matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start gap-6"
            >
              {/* Proof Image Preview */}
              <div className="w-full md:w-48 h-48 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group shrink-0">
                <img
                  src={req.portalScreenshotUrl}
                  alt="Portal proof"
                  className="w-full h-full object-cover"
                />
                <a
                  href={req.portalScreenshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity gap-1"
                >
                  View Full Image <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Request Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">{req.userName}</h3>
                    <p className="text-xs text-slate-500">{req.userEmail}</p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      req.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">PTU Roll Number:</span>
                    <span className="font-bold text-slate-900">{req.ptuRollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Required Anti-Fraud Code:</span>
                    <span className="font-extrabold text-indigo-600 font-mono tracking-widest">
                      {req.liveVerificationCode}
                    </span>
                  </div>
                </div>

                {req.rejectionReason && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">
                    <strong>Rejection Reason:</strong> {req.rejectionReason}
                  </p>
                )}

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      onClick={() => handleReview(req.id, "approve")}
                      disabled={loadingId === req.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9 px-4 shadow-sm"
                    >
                      {loadingId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve & Verify Student
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setActiveRejectId(activeRejectId === req.id ? null : req.id)}
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs h-9 px-4"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject Request
                    </Button>
                  </div>
                )}

                {activeRejectId === req.id && (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 mt-2">
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason (e.g. anti-fraud code missing)..."
                      className="text-xs h-9 rounded-xl bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveRejectId(null)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReview(req.id, "reject")}
                        className="bg-rose-600 text-white hover:bg-rose-700 text-xs h-8 rounded-xl"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
