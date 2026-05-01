// app/projects/page.tsx
import { getProjects } from "@/actions/projects";
import { auth } from "@/auth";
import Link from "next/link";
import { FolderKanban, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";
import CreateProjectModal from "@/components/CreateProjectModal";

export default async function ProjectsPage() {
  const [projects, session] = await Promise.all([getProjects(), auth()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isAdmin && <CreateProjectModal />}
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-lg">No projects yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {isAdmin
              ? "Click 'New Project' to create your first project."
              : "No projects have been created yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
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
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition">
                    <FolderKanban className="w-5 h-5 text-indigo-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="text-white font-semibold text-base mb-1.5">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Completion</span>
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
  );
}
