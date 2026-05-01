// app/my-tasks/page.tsx
import { getMyTasks } from "@/actions/tasks";
import { auth } from "@/auth";
import { format, isPast } from "date-fns";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Calendar,
  FolderKanban,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  Zap,
} from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; className: string }> = {
  TODO: { label: "To Do", className: "bg-slate-800 text-slate-300 border border-slate-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30" },
  DONE: { label: "Done", className: "bg-green-500/10 text-green-400 border border-green-500/30" },
};

const priorityConfig: Record<string, { label: string; className: string; icon: any }> = {
  LOW: { label: "Low", className: "text-slate-400 bg-slate-800 border border-slate-700", icon: ArrowDown },
  MEDIUM: { label: "Medium", className: "text-blue-400 bg-blue-500/10 border border-blue-500/30", icon: Minus },
  HIGH: { label: "High", className: "text-orange-400 bg-orange-500/10 border border-orange-500/30", icon: ArrowUp },
  URGENT: { label: "Urgent", className: "text-red-400 bg-red-500/10 border border-red-500/30", icon: Zap },
};

export default async function MyTasksPage() {
  const [tasks, session] = await Promise.all([getMyTasks(), auth()]);

  const todo = tasks.filter((t) => t.status === "TODO");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");
  const overdue = tasks.filter(
    (t) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "DONE"
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">
          All tasks assigned to {session?.user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "To Do", value: todo.length, color: "text-slate-300", bg: "bg-slate-800", border: "border-slate-700" },
          { label: "In Progress", value: inProgress.length, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
          { label: "Done", value: done.length, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
          { label: "Overdue", value: overdue.length, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <ListTodo className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tasks assigned to you yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isTaskOverdue =
              task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
            const sCfg = statusConfig[task.status] ?? statusConfig.TODO;
            const pKey = (task.priority ?? "MEDIUM") as keyof typeof priorityConfig;
            const pCfg = priorityConfig[pKey] ?? priorityConfig.MEDIUM;
            const PIcon = pCfg.icon;

            return (
              <Link
                key={task.id}
                href={`/projects/${task.project.id}`}
                className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-sm font-medium ${
                        task.status === "DONE" ? "text-slate-500 line-through" : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.className}`}>
                      <PIcon className="w-3 h-3" />
                      {pCfg.label}
                    </span>
                    {isTaskOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" /> {task.project.name}
                    </span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isTaskOverdue ? "text-red-400" : ""}`}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sCfg.className}`}>
                  {sCfg.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
