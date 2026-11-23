"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { upload } from "@vercel/blob/client";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Lock,
  Loader2,
  CheckCircle,
  ExternalLink,
  Star,
  Package,
  ShoppingBag,
  Mail,
  Camera,
  Trash2,
  Sliders,
  Sparkles,
} from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/profile";
import { getTrustScoreBadge } from "@/lib/trust-score-client";
import { toast } from "@/lib/toast";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  branch: string | null;
  yearSemester: string | null;
  hostel: string | null;
  emailVerifiedAt: Date | null;
  studentStatus: "unverified" | "pending" | "verified" | "rejected";
  trustScore: number;
  rejectionReason: string | null;
  createdAt: Date;
}

export function UserProfileClient({
  user,
  stats,
}: {
  user: UserProfileData;
  stats: {
    activeListingsCount: number;
    totalSalesCount: number;
    averageRating: number;
  };
}) {
  const { update } = useSession();
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || "");
  const [branch, setBranch] = useState(profile.branch || "");
  const [yearSemester, setYearSemester] = useState(profile.yearSemester || "");
  const [hostel, setHostel] = useState(profile.hostel || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const trustBadge = getTrustScoreBadge(profile.trustScore, profile.studentStatus);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErr(null);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setAvatarUrl(blob.url);
      toast.success("Avatar uploaded", { description: "Your profile picture has been updated." });
    } catch {
      setErr("Failed to upload avatar photo.");
      toast.error("Avatar upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await updateProfileAction({
        name,
        bio,
        branch,
        yearSemester,
        hostel,
        avatarUrl,
      });

      if (!res.success) {
        setErr(res.error);
        toast.error("Profile update failed", { description: res.error });
        setIsSaving(false);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        name,
        bio,
        branch,
        yearSemester,
        hostel,
        avatarUrl,
      }));
      setMsg("Profile updated successfully!");
      toast.success("Profile Updated!", {
        description: "Your student details have been saved.",
      });
      setIsEditing(false);
      setIsSaving(false);
      void update();
    } catch {
      setErr("Failed to update profile.");
      toast.error("Failed to update profile.");
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    setPasswordMsg(null);
    setPasswordErr(null);

    try {
      const res = await changePasswordAction({ currentPassword, newPassword });
      if (!res.success) {
        setPasswordErr(res.error);
        toast.error("Password change failed", { description: res.error });
        setIsChangingPass(false);
        return;
      }

      setPasswordMsg("Password changed successfully!");
      toast.success("Password Updated!", {
        description: "Your security credentials have been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setIsChangingPass(false);
    } catch {
      setPasswordErr("Failed to update password.");
      toast.error("Failed to update password.");
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Upload Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl overflow-hidden border-4 border-white shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition-colors">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900">{profile.name}</h1>
                <p className="text-xs text-slate-500 font-mono">@{profile.username}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <Link href={`/seller/${profile.username}`}>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium">
                    <ExternalLink className="w-3.5 h-3.5" /> Public View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Verified
              </span>

              {profile.studentStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Student
                </span>
              ) : (
                <Link
                  href="/student-verification"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Unverified Member (Verify Now)
                </Link>
              )}

              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${trustBadge.colorClass}`}>
                <Sparkles className="w-3.5 h-3.5" /> Trust Score: {profile.trustScore}/100
              </span>
            </div>

            {profile.bio ? (
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-xs text-slate-400 italic pt-1">No bio added yet. Click &quot;Edit Profile&quot; to add details.</p>
            )}

            {/* Campus Info row if provided */}
            {(profile.branch || profile.yearSemester || profile.hostel) && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
                {profile.branch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Dept: {profile.branch}
                  </span>
                )}
                {profile.yearSemester && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Year: {profile.yearSemester}
                  </span>
                )}
                {profile.hostel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    Hostel: {profile.hostel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-xs font-medium text-slate-500 block">Listings</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Package className="w-4 h-4 text-blue-600" /> {stats.activeListingsCount}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-xs font-medium text-slate-500 block">Completed Sales</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> {stats.totalSalesCount}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-xs font-medium text-slate-500 block">Avg Rating</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />{" "}
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "New"}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center">
            <span className="text-xs font-medium text-slate-500 block">Joined</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {err}
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold font-display text-slate-900">Edit Profile Details</h2>
            <p className="text-xs text-slate-500">Update your public campus information visible to fellow students.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Branch / Department
                </label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CSE, ECE, Mechanical"
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Year / Semester
                </label>
                <Input
                  value={yearSemester}
                  onChange={(e) => setYearSemester(e.target.value)}
                  placeholder="e.g. 3rd Year / 6th Sem"
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hostel / Campus Residency
                </label>
                <Input
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Boys Hostel 2, Room 304"
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Bio / About Seller
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other students what you study, what items you frequently buy/sell, or preferred campus meetup spots..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-slate-400 transition-colors"
              />
            </div>

            {avatarUrl && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAvatarUrl("")}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Profile Photo
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 font-semibold shadow-xs"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-slate-900">Security &amp; Password</h2>
            <p className="text-xs text-slate-500">Update your account password secured with modern Argon2 hashing.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
            {passwordMsg}
          </div>
        )}
        {passwordErr && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium">
            {passwordErr}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                New Password (Min 8 chars)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isChangingPass}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10 px-5 shadow-xs"
            >
              {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
