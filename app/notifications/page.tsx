// app/notifications/page.tsx
import { getMyNotifications } from "@/actions/notifications";
import { auth } from "@/auth";
import { format } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import MarkAllReadButton from "@/components/MarkAllReadButton";

export default async function NotificationsPage() {
  const [notifications, session] = await Promise.all([
    getMyNotifications(),
    auth(),
  ]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unread > 0 ? `${unread} unread` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
          <p className="text-slate-600 text-sm mt-1">
            You&apos;ll see task assignments here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 rounded-2xl border transition ${
                n.read
                  ? "bg-slate-900 border-slate-800 opacity-60"
                  : "bg-slate-900 border-indigo-500/30 shadow-sm shadow-indigo-500/10"
              }`}
            >
              <div
                className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.read ? "bg-slate-800" : "bg-indigo-500/15"
                }`}
              >
                <Bell
                  className={`w-4 h-4 ${n.read ? "text-slate-500" : "text-indigo-400"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? "text-slate-400" : "text-white"}`}>
                  {n.message}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {format(new Date(n.createdAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              {!n.read && (
                <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
