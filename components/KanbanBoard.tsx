"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/actions/tasks";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  User,
  Calendar,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Zap,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { format, isPast } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: Date | null;
  assignee?: { id: string; name: string } | null;
  projectId: string;
  _count?: { comments: number };
}

interface KanbanBoardProps {
  tasks: Task[];
  isAdmin: boolean;
  currentUserId: string;
}

const columns = [
  {
    key: "TODO",
    label: "To Do",
    icon: ListTodo,
    headerClass: "text-slate-300 border-slate-700",
    dotClass: "bg-slate-500",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    icon: Clock,
    headerClass: "text-yellow-400 border-yellow-500/30",
    dotClass: "bg-yellow-400",
  },
  {
    key: "DONE",
    label: "Done",
    icon: CheckCircle2,
    headerClass: "text-green-400 border-green-500/30",
    dotClass: "bg-green-400",
  },
];

const priorityConfig = {
  LOW: { label: "Low", className: "text-slate-400 border-slate-700 bg-slate-800", icon: ArrowDown },
  MEDIUM: { label: "Medium", className: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Minus },
  HIGH: { label: "High", className: "text-orange-400 border-orange-500/30 bg-orange-500/10", icon: ArrowUp },
  URGENT: { label: "Urgent", className: "text-red-400 border-red-500/30 bg-red-500/10", icon: Zap },
};

function KanbanCard({ task, isAdmin, currentUserId }: { task: Task; isAdmin: boolean; currentUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
  const canMove = isAdmin || task.assignee?.id === currentUserId;
  const pKey = (task.priority ?? "MEDIUM") as keyof typeof priorityConfig;
  const pCfg = priorityConfig[pKey] ?? priorityConfig.MEDIUM;
  const PIcon = pCfg.icon;

  const moveTo = (newStatus: string) => {
    startTransition(async () => {
      await updateTask({ id: task.id, status: newStatus as any });
      router.refresh();
    });
  };

  const nextStatuses = columns
    .filter((c) => c.key !== task.status)
    .map((c) => ({ key: c.key, label: c.label, Icon: c.icon }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all duration-200 space-y-2">
      {/* Priority */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${pCfg.className}`}>
        <PIcon className="w-3 h-3" />
        {pCfg.label}
      </span>

      {/* Title */}
      <p className={`text-sm font-medium leading-snug ${task.status === "DONE" ? "text-slate-500 line-through" : "text-white"}`}>
        {task.title}
      </p>

      {task.description && (
        <p className="text-slate-600 text-xs line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> {task.assignee.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </span>
        )}
        {isOverdue && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        )}
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {task._count?.comments ?? 0}
        </span>
      </div>

      {/* Move buttons */}
      {canMove && (
        <div className="flex gap-1 pt-1 border-t border-slate-800">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
          ) : (
            nextStatuses.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => moveTo(key)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-white hover:bg-slate-800 px-2 py-1 rounded-lg transition"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard({ tasks, isAdmin, currentUserId }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const ColIcon = col.icon;
        return (
          <div key={col.key} className="flex flex-col gap-3">
            {/* Column header */}
            <div className={`flex items-center gap-2 pb-2 border-b ${col.headerClass}`}>
              <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
              <ColIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="ml-auto text-xs opacity-60">{colTasks.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[80px]">
              {colTasks.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl h-16 flex items-center justify-center">
                  <p className="text-slate-700 text-xs">No tasks</p>
                </div>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
