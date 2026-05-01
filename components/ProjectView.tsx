"use client";

import { useState } from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import TaskCard from "./TaskCard";

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

interface ProjectViewProps {
  tasks: Task[];
  users: { id: string; name: string; email: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function ProjectView({ tasks, users, isAdmin, currentUserId }: ProjectViewProps) {
  const [view, setView] = useState<"list" | "kanban">("list");

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-end">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              view === "list"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              view === "kanban"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* List view */}
      {view === "list" && (
        <div className="space-y-8">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => {
            const colTasks = tasksByStatus[status];
            if (colTasks.length === 0) return null;

            const statusLabel =
              status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" : "Done";
            const statusClass =
              status === "TODO"
                ? "bg-slate-800 text-slate-300 border border-slate-700"
                : status === "IN_PROGRESS"
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                : "bg-green-500/10 text-green-400 border border-green-500/30";

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                  </span>
                  <span className="text-slate-600 text-xs">
                    {colTasks.length} task{colTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      isAdmin={isAdmin}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <KanbanBoard tasks={tasks} isAdmin={isAdmin} currentUserId={currentUserId} />
      )}
    </div>
  );
}
