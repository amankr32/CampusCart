import { MessageCircle } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-black/40 gap-3">
      <MessageCircle className="h-10 w-10" />
      <p className="text-sm">Select a conversation to view messages</p>
    </div>
  );
}
