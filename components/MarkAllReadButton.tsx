"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { markAllRead } from "@/actions/notifications";

export default function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markAllRead();
          router.refresh();
        })
      }
      disabled={isPending}
      className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-2 rounded-xl transition disabled:opacity-50"
    >
      <CheckCheck className="w-4 h-4" />
      {isPending ? "Marking..." : "Mark all read"}
    </button>
  );
}
