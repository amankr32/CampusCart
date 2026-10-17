"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sun,
  Search,
  CreditCard,
  AlertOctagon,
} from "@/components/ui/material-symbol";

export function SafeHandoffChecklist() {
  const [isOpen, setIsOpen] = useState(true);

  const CHECKLIST_ITEMS = [
    {
      icon: Sun,
      title: "Meet in Daylight on Campus",
      desc: "Always trade at the Main Library, Campus Cafeteria, Student Centre, or Hostel Main Gate.",
      color: "text-amber-500",
    },
    {
      icon: Search,
      title: "Inspect Physical Condition First",
      desc: "Turn on calculators, inspect book bindings, or test cycle brakes before completing the deal.",
      color: "text-blue-500",
    },
    {
      icon: CreditCard,
      title: "Pay In-Person via UPI or Cash",
      desc: "Scan the seller's UPI QR or hand over cash only after you have physically received the item.",
      color: "text-emerald-500",
    },
    {
      icon: AlertOctagon,
      title: "Never Send Advance Deposits",
      desc: "CampusCart sellers never require advance booking tokens, delivery charges, or reservation fees.",
      color: "text-rose-500",
    },
  ];

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 overflow-hidden transition-all">
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer hover:bg-emerald-500/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Safe Campus Trade Guarantee
            </h4>
            <p className="text-[10px] text-[var(--text-muted)]">
              IKGPTU Student Verified In-Person Trade Checklist
            </p>
          </div>
        </div>

        <span className="text-[var(--text-muted)] p-1">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 space-y-2.5 border-t border-emerald-500/15">
          {CHECKLIST_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-[var(--card-bg)]/80 border border-[var(--border-subtle)] text-xs"
              >
                <div className={`mt-0.5 shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text-primary)] text-xs leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="pt-1 text-center">
            <p className="text-[10px] font-medium text-[var(--text-muted)]">
              Protected by IKGPTU Student Community Honor Code
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
