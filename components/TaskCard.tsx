// components/TaskCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask, deleteTask } from "@/actions/tasks";
import {
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  ChevronDown,
  Loader2,
  MessageSquare,
  ChevronRight,
  ArrowUp,
  Minus,
  ArrowDown,
  Zap,
} from "lucide-react";
import { format, isPast } from "date-fns";
import TaskComments from "./TaskComments";

interface TaskProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority?: string | null;
    dueDate?: Date | null;
    assignee?: { id: string; name: string } | null;
    projectId: string;
    _count?: { comments: number };
  };
  users: { id: string; name: string; email: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

const statusConfig = {
  TODO: {
    label: "To Do",
    className: "bg-slate-800 text-slate-300 border-slate-700",
    icon: ListTodo,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  DONE: {
    label: "Done",
    className: "bg-green-500/10 text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
};

const priorityConfig = {
  LOW: { label: "Low", className: "text-slate-400 bg-slate-800 border-slate-700", icon: ArrowDown },
  MEDIUM: { label: "Medium", className: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: Minus },
  HIGH: { label: "High", className: "text-orange-400 bg-orange-500/10 border-orange-500/30", icon: ArrowUp },
  URGENT: { label: "Urgent", className: "text-red-400 bg-red-500/10 border-red-500/30", icon: Zap },
};

export default function TaskCard({ task, users, isAdmin, currentUserId }: TaskProps) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOverdue =
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    task.status !== "DONE";

  const canUpdateStatus = isAdmin || task.assignee?.id === currentUserId;

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    setShowStatusMenu(false);
    await updateTask({ id: task.id, status: newStatus as any });
    router.refresh();
    setStatusLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setDeleteLoading(true);
    await deleteTask(task.id);
    router.refresh();
    setDeleteLoading(false);
  };

  const config = statusConfig[task.status as keyof typeof statusConfig] ?? statusConfig.TODO;
  const StatusIcon = config.icon;
  const priorityKey = (task.priority ?? "MEDIUM") as keyof typeof priorityConfig;
  const pConfig = priorityConfig[priorityKey] ?? priorityConfig.MEDIUM;
  const PriorityIcon = pConfig.icon;
  const commentCount = task._count?.comments ?? 0;

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4
              className={`text-sm font-medium ${
                task.status === "DONE" ? "text-slate-500 line-through" : "text-white"
              }`}
            >
              {task.title}
            </h4>

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${pConfig.className}`}>
              <PriorityIcon className="w-3 h-3" />
              {pConfig.label}
            </span>

            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-slate-500 text-xs mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {task.assignee && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {task.assignee.name}
              </span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </span>
            )}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-white transition"
            >
              <MessageSquare className="w-3 h-3" />
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
              <ChevronRight className={`w-3 h-3 transition-transform ${showComments ? "rotate-90" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {canUpdateStatus && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={statusLoading}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${config.className}`}
              >
                {statusLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <StatusIcon className="w-3 h-3" />
                )}
                {config.label}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                    {Object.entries(statusConfig).map(([status, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-700 transition ${
                            task.status === status ? "text-white bg-slate-700" : "text-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              {deleteLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {showComments && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3">
          <TaskComments
            taskId={task.id}
            projectId={task.projectId}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  );
}
