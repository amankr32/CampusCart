"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/profile";
import { getTrustScoreBadge } from "@/lib/trust-score-client";

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
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setAvatarUrl(data.url);
    } catch {
      setErr("Failed to upload avatar photo.");
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
      setIsEditing(false);
      setIsSaving(false);
    } catch {
      setErr("Failed to update profile.");
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
        setIsChangingPass(false);
        return;
      }

      setPasswordMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setIsChangingPass(false);
    } catch {
      setPasswordErr("Failed to update password.");
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Upload Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl overflow-hidden border-4 border-white shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
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

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Link href={`/seller/${profile.username}`}>
                  <Button variant="outline" size="sm" className="rounded-2xl text-xs gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> Public View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs"
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Verified
              </span>

              {profile.studentStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Student
                </span>
              ) : (
                <Link
                  href="/student-verification"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Unverified Seller (Verify Now)
                </Link>
              )}

              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${trustBadge.colorClass}`}>
                Trust Score: {profile.trustScore}/100
              </span>
            </div>

            {profile.bio && <p className="text-xs text-slate-600 pt-1 leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block">Listings</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1">
              <Package className="w-4 h-4 text-indigo-600" /> {stats.activeListingsCount}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block">Successful Sales</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> {stats.totalSalesCount}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block">Avg Rating</span>
            <span className="text-lg font-bold text-slate-900 flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />{" "}
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block">Member Since</span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" /> {msg}
        </div>
      )}
      {err && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {err}
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in">
          <h2 className="text-xl font-bold font-display text-slate-900">Edit Profile Details</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-2xl" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Branch / Department
                </label>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. CSE, ECE, ME" className="h-11 rounded-2xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Year / Semester
                </label>
                <Input value={yearSemester} onChange={(e) => setYearSemester(e.target.value)} placeholder="e.g. 3rd Year / 6th Sem" className="h-11 rounded-2xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Hostel / Campus Residency
                </label>
                <Input value={hostel} onChange={(e) => setHostel(e.target.value)} placeholder="e.g. Boys Hostel 2, Room 304" className="h-11 rounded-2xl" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Bio / About Seller
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other students what you study or sell..."
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-2xl">
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Change Password */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Update your account password secured with Argon2 hashing.</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-medium">
            {passwordMsg}
          </div>
        )}
        {passwordErr && (
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-medium">
            {passwordErr}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 rounded-2xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                New Password (Min 8 chars)
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-2xl"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isChangingPass}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs h-10 px-5"
            >
              {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
