"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Palette,
  Sun,
  Moon,
  Zap,
  AlertTriangle,
  LogOut,
  UserX,
  CheckCircle2,
  X,
  Loader2,
  ArrowLeft,
  Sliders,
} from "@/components/ui/material-symbol";
import Link from "next/link";

import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function SettingsClient({
  user,
}: {
  user: { name: string; email: string };
}) {
  const { theme, setTheme } = useTheme();
  
  // Modals state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivated, setDeactivated] = useState(false);

  const themeOptions: {
    id: Theme;
    name: string;
    description: string;
    icon: typeof Sun;
    previewBg: string;
    previewCard: string;
    previewAccent: string;
    previewText: string;
  }[] = [
    {
      id: "light",
      name: "Light",
      description: "Clean, high-contrast light mode with slate accents.",
      icon: Sun,
      previewBg: "#f8fafc",
      previewCard: "#ffffff",
      previewAccent: "#4f46e5",
      previewText: "#0f172a",
    },
    {
      id: "dark",
      name: "Dark",
      description: "Deep obsidian dark mode for easy night browsing.",
      icon: Moon,
      previewBg: "#090d16",
      previewCard: "#111827",
      previewAccent: "#6366f1",
      previewText: "#f8fafc",
    },
    {
      id: "dracula",
      name: "Dracula",
      description: "Iconic purple and pink Dracula developer theme.",
      icon: Zap,
      previewBg: "#282a36",
      previewCard: "#44475a",
      previewAccent: "#bd93f9",
      previewText: "#f8f8f2",
    },
  ];

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    // Simulate deactivation process then sign out cleanly
    setTimeout(() => {
      setIsDeactivating(false);
      setDeactivated(true);
      setTimeout(() => {
        signOut({ callbackUrl: "/" });
      }, 1500);
    }, 1000);
  };

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs">
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--brand-primary)] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-[var(--text-primary)] flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-[var(--brand-primary)]" /> Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Customize theme appearance, manage account preferences, and danger zone actions.
          </p>
        </div>
      </div>

      {/* 1. APPEARANCE & THEME SECTION */}
      <section className="bg-[var(--card-bg)] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="p-2.5 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">Appearance & Theme</h2>
            <p className="text-xs text-[var(--text-muted)]">Choose your preferred visual theme across CampusCart.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  toast.success("Theme changed", {
                    description: `Switched to ${opt.name} Mode`,
                  });
                }}
                className={`relative flex flex-col text-left p-5 rounded-2xl border-2 transition-all group cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/20 shadow-md"
                    : "border-[var(--border-subtle)] hover:border-indigo-300"
                }`}
              >
                {/* Checkmark indicator */}
                {isSelected && (
                  <span className="absolute top-3.5 right-3.5 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}

                {/* Theme Card Live Preview Box */}
                <div
                  className="w-full h-24 rounded-xl p-3 mb-4 border flex flex-col justify-between overflow-hidden shadow-inner"
                  style={{
                    backgroundColor: opt.previewBg,
                    borderColor: isSelected ? opt.previewAccent : "#cbd5e1",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="h-3 w-16 rounded-md"
                      style={{ backgroundColor: opt.previewAccent }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: opt.previewAccent }}
                    />
                  </div>
                  <div
                    className="p-2 rounded-lg text-[10px] font-bold truncate flex items-center justify-between"
                    style={{
                      backgroundColor: opt.previewCard,
                      color: opt.previewText,
                    }}
                  >
                    <span>CampusCart Preview</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-extrabold text-white"
                      style={{ backgroundColor: opt.previewAccent }}
                    >
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span className="font-bold text-sm text-[var(--text-primary)] font-display">{opt.name} Mode</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. DANGER ZONE SECTION */}
      {/* 2. DANGER ZONE SECTION */}
      <section className="bg-rose-500/5 border border-rose-500/20 p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-rose-500">Danger Zone</h2>
            <p className="text-xs text-[var(--text-muted)]">Irreversible and destructive account operations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deactivate Account Card */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-rose-500/20 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm mb-1 font-display">
                <UserX className="w-4 h-4" /> Deactivate Account
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Temporarily or permanently disable your seller profile and pause all your active listings on CampusCart.
              </p>
            </div>

            <Button
              onClick={() => setShowDeactivateModal(true)}
              variant="outline"
              className="w-full text-rose-500 border-rose-500/30 hover:bg-rose-500/10 rounded-xl font-bold text-xs"
            >
              Deactivate Account
            </Button>
          </div>

          {/* Log Out Card */}
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-sm mb-1 font-display">
                <LogOut className="w-4 h-4 text-[var(--text-muted)]" /> Log Out of Account
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sign out of your CampusCart session on this device. You will need your credentials to sign back in.
              </p>
            </div>

            <Button
              onClick={() => setShowLogoutModal(true)}
              className="w-full bg-[var(--text-primary)] hover:opacity-90 text-[var(--background)] rounded-xl font-bold text-xs"
            >
              Log Out ({user.name?.split(" ")[0]})
            </Button>
          </div>
        </div>
      </section>

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[var(--border-subtle)] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowDeactivateModal(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto">
              <UserX className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Deactivate CampusCart Account?</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Are you sure you want to deactivate <span className="font-semibold text-[var(--text-primary)]">{user.email}</span>? Your active listings will be paused and hidden from marketplace buyers.
              </p>
            </div>

            {deactivated ? (
              <div className="p-4 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Account deactivated. Redirecting...
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => setShowDeactivateModal(false)}
                  variant="outline"
                  className="flex-1 rounded-xl font-semibold text-xs border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
                >
                  {isDeactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Deactivate"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-[var(--border-subtle)] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-500/10 text-[var(--brand-primary)] mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">Sign Out of CampusCart?</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                You are currently signed in as <span className="font-semibold text-[var(--text-primary)]">{user.email}</span>. Click confirm to log out.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => setShowLogoutModal(false)}
                variant="outline"
                className="flex-1 rounded-xl font-semibold text-xs border-[var(--border-subtle)] text-[var(--text-primary)]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
              >
                Confirm Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
