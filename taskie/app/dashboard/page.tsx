// app/dashboard/page.tsx
import { getDashboardStats } from "@/actions/tasks";
import { getProjects } from "@/actions/projects";
import { auth } from "@/auth";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  FolderKanban,
  ArrowRight,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import CreateProjectModal from "@/components/CreateProjectModal";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    TODO: {
      label: "To Do",
      className: "bg-slate-800 text-slate-300 border border-slate-700",
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    },
    DONE: {
      label: "Done",
      className: "bg-green-500/10 text-green-400 border border-green-500/30",
    },
  };
  const config = map[status] || map.TODO;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export default async function DashboardPage() {
  const [stats, session] = await Promise.all([
    getDashboardStats(),
    auth(),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  if (!stats) {
    return (
      <div className="text-slate-400">Failed to load dashboard data.</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, {session?.user?.name} 👋
          </p>
        </div>
        {isAdmin && <CreateProjectModal />}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          icon={ListTodo}
          color="text-indigo-400"
          bgColor="bg-indigo-500/10"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          label="Completed"
          value={stats.done}
          icon={CheckCircle2}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition font-medium"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentProjects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No projects yet</p>
            <p className="text-slate-600 text-sm mt-1">
              {isAdmin
                ? "Create your first project to get started."
                : "No projects have been created yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.recentProjects.map((project) => {
              const taskCount = project.tasks.length;
              const doneCount = project.tasks.filter(
                (t) => t.status === "DONE"
              ).length;
              const progress =
                taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition">
                      <FolderKanban className="w-5 h-5 text-indigo-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-100 transition">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-400 font-medium">
                        {doneCount}/{taskCount} tasks
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 text-xs">
                      by {project.owner.name}
                    </span>
                    <span className="text-slate-600 text-xs">
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Members */}
      {isAdmin && stats.allUsers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Team Members</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.allUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/50 transition"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 text-sm">
                      {user.email}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === "ADMIN"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
