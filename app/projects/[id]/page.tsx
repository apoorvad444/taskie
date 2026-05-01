// app/projects/[id]/page.tsx
import { getProjectById, getProjectMembers } from "@/actions/projects";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ListTodo,
  User,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import CreateTaskModal from "@/components/CreateTaskModal";
import { getAllUsers } from "@/actions/tasks";
import ManageProjectMembersModal from "@/components/ManageProjectMembersModal";
import ProjectView from "@/components/ProjectView";

interface PageProps {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const [project, session, users, projectMembers] = await Promise.all([
    getProjectById(params.id),
    auth(),
    getAllUsers(),
    getProjectMembers(params.id),
  ]);

  if (!project) notFound();

  const isAdmin = session?.user?.role === "ADMIN";

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdueTasks = project.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

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
          <div className="flex-1">
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
                {totalTasks} task{totalTasks !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Progress</span>
                  <span className={`font-medium ${progress === 100 ? "text-green-400" : "text-slate-400"}`}>
                    {doneTasks}/{totalTasks} done · {progress}%
                    {overdueTasks > 0 && (
                      <span className="ml-2 text-red-400">{overdueTasks} overdue</span>
                    )}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === 100 ? "bg-green-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <ManageProjectMembersModal
                projectId={project.id}
                ownerId={project.owner.id}
                allUsers={users}
                projectMembers={projectMembers}
              />
              <CreateTaskModal projectId={project.id} users={users} />
            </div>
          )}
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "To Do", count: project.tasks.filter((t) => t.status === "TODO").length, color: "text-slate-300", bg: "bg-slate-800", border: "border-slate-700" },
          { label: "In Progress", count: project.tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
          { label: "Done", count: doneTasks, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tasks (list + kanban toggle) */}
      {project.tasks.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <ListTodo className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tasks yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {isAdmin ? "Click 'Add Task' to create your first task." : "No tasks have been created yet."}
          </p>
        </div>
      ) : (
        <ProjectView
          tasks={project.tasks}
          users={users}
          isAdmin={isAdmin}
          currentUserId={session?.user?.id || ""}
        />
      )}
    </div>
  );
}
