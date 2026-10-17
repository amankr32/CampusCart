import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h3 className="font-bold text-[var(--text-primary)] text-base font-display">Your Campus Messages</h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm">
        Select a conversation from the left to view messages, negotiate prices, or coordinate safe campus pickup locations.
      </p>
    </div>
  );
}

