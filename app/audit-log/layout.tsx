// app/audit-log/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getUnreadCount } from "@/actions/notifications";

export default async function AuditLogLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const unreadCount = await getUnreadCount();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar user={session.user} unreadCount={unreadCount} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
