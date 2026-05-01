// actions/notifications.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getMyNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

export async function markAllRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
}

export async function markOneRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  revalidatePath("/notifications");
}

/** Send a notification to every ADMIN user. */
export async function notifyAllAdmins(
  message: string,
  taskId?: string,
  projectId?: string
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      message,
      taskId,
      projectId,
    })),
  });
}

/** Fire overdue notifications for admins (once per overdue task, idempotent). */
export async function checkAndNotifyOverdue() {
  const now = new Date();

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: "DONE" },
    },
    include: { project: { select: { name: true } } },
  });

  if (overdueTasks.length === 0) return;

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (admins.length === 0) return;

  for (const task of overdueTasks) {
    for (const admin of admins) {
      // Skip if already notified about this overdue task
      const exists = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          taskId: task.id,
          message: { contains: "overdue" },
        },
      });
      if (exists) continue;

      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `Task "${task.title}" in project "${task.project.name}" is overdue.`,
          taskId: task.id,
          projectId: task.projectId,
        },
      });
    }
  }
}
