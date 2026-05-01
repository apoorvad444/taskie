"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getTaskComments, addComment, deleteComment } from "@/actions/comments";
import { format } from "date-fns";
import { Send, Trash2, Loader2, User } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string };
}

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export default function TaskComments({ taskId, projectId, currentUserId, isAdmin }: TaskCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getTaskComments(taskId).then((data) => {
      setComments(data as Comment[]);
      setLoading(false);
    });
  }, [taskId]);

  const handleAdd = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await addComment({ content: text.trim(), taskId, projectId });
      if (result.success) {
        setText("");
        const updated = await getTaskComments(taskId);
        setComments(updated as Comment[]);
        router.refresh();
      }
    });
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId, projectId);
    const updated = await getTaskComments(taskId);
    setComments(updated as Comment[]);
    router.refresh();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="space-y-3">
      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-slate-600 text-xs text-center py-2">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group/comment">
              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-300">{c.user.name}</span>
                  <span className="text-slate-600 text-xs">
                    {format(new Date(c.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{c.content}</p>
              </div>
              {(c.user.id === currentUserId || isAdmin) && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover/comment:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex items-center gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAdd()}
          placeholder="Write a comment…"
          className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || isPending}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white transition"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
