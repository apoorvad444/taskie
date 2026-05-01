// app/projects/[id]/page.tsx
import { getProjectById } from "@/actions/projects";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { format, isPast } from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  User,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskCard from "@/components/TaskCard";
import { getAllUsers } from "@/actions/tasks";

interface PageProps {
  params: { id: string };
}

function StatusBadge({ status, dueDate }: { status: string; dueDate?: Date | null }) {
  const isOverdue =
    dueDate &&
    isPast(new Date(dueDate)) &&
    status !== "DONE";

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
        <AlertTriangle className="w-3 h-3" /> Overdue
      </span>
    );
  }

  const map: Record<string, { label: string; className: string; icon: any }> = {
    TODO: {
      label: "To Do",
      className: "bg-slate-800 text-slate-300 border border-slate-700",
      icon: ListTodo,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
      icon: Clock,
    },
    DONE: {
      label: "Done",
      className: "bg-green-500/10 text-green-400 border border-green-500/30",
      icon: CheckCircle2,
    },
  };

  const config = map[status] || map.TODO;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const [project, session, users] = await Promise.all([
    getProjectById(params.id),
    auth(),
    getAllUsers(),
  ]);

  if (!project) notFound();

  const isAdmin = session?.user?.role === "ADMIN";

  const tasksByStatus = {
    TODO: project.tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: project.tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: project.tasks.filter((t) => t.status === "DONE"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-slate-400 text-sm mt-1">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {project.owner.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(project.createdAt), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5" />
                {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {isAdmin && (
            <CreateTaskModal
              projectId={project.id}
              users={users}
            />
          )}
        </div>
      </div>

      {/* Task Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "To Do",
            count: tasksByStatus.TODO.length,
            color: "text-slate-300",
            bg: "bg-slate-800",
            border: "border-slate-700",
          },
          {
            label: "In Progress",
            count: tasksByStatus.IN_PROGRESS.length,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/30",
          },
          {
            label: "Done",
            count: tasksByStatus.DONE.length,
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/30",
          },
        ].map(({ label, count, color, bg, border }) => (
          <div
            key={label}
            className={`${bg} border ${border} rounded-xl p-4 text-center`}
          >
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      {project.tasks.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <ListTodo className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tasks yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {isAdmin
              ? "Click 'Add Task' to create your first task."
              : "No tasks have been created yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => {
            const tasks = tasksByStatus[status];
            if (tasks.length === 0) return null;

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status={status} />
                  <span className="text-slate-600 text-xs">
                    {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      isAdmin={isAdmin}
                      currentUserId={session?.user?.id || ""}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
