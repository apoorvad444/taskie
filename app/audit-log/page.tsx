// app/audit-log/page.tsx
import { getAuditLogs } from "@/actions/audit";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  LogIn,
  RefreshCw,
} from "lucide-react";

const actionConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  TASK_CREATED: { label: "Task Created", icon: Plus, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  TASK_UPDATED: { label: "Task Updated", icon: Edit2, color: "text-blue-400", bg: "bg-blue-500/10" },
  TASK_STATUS_CHANGED: { label: "Status Changed", icon: RefreshCw, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  TASK_DELETED: { label: "Task Deleted", icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
  USER_REGISTERED: { label: "User Registered", icon: UserPlus, color: "text-green-400", bg: "bg-green-500/10" },
  PROJECT_CREATED: { label: "Project Created", icon: Plus, color: "text-purple-400", bg: "bg-purple-500/10" },
  PROJECT_DELETED: { label: "Project Deleted", icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
};

export default async function AuditLogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const logs = await getAuditLogs(200);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">
          All activity across the platform — {logs.length} recent entries
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No audit entries yet</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {logs.map((log) => {
              const cfg = actionConfig[log.action] ?? {
                label: log.action,
                icon: Shield,
                color: "text-slate-400",
                bg: "bg-slate-800",
              };
              const Icon = cfg.icon;
              const meta = log.meta as Record<string, any> | null;

              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/40 transition">
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {meta?.title && (
                        <span className="text-white text-sm font-medium">"{meta.title}"</span>
                      )}
                      {meta?.from && meta?.to && (
                        <span className="text-slate-400 text-xs">
                          {meta.from.replace("_", " ")} → {meta.to.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      by <span className="text-slate-300">{log.userName}</span>
                      {meta?.email && ` (${meta.email})`}
                    </p>
                  </div>
                  <span className="text-slate-600 text-xs flex-shrink-0">
                    {format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
