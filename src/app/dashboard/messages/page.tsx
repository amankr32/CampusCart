import { MessageSquare, ShieldCheck } from "@/components/ui/material-symbol";

export default function MessagesIndexPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-8 text-center bg-slate-50/60">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-slate-900 text-lg font-display">
        Your Campus Messages
      </h3>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
        Select a conversation from the left to view messages, agree on prices, and pick safe campus meetup spots.
      </p>
      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Safe campus trading • Meet in public areas</span>
      </div>
    </div>
  );
}

