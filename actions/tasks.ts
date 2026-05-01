// actions/tasks.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";
import { notifyAllAdmins } from "@/actions/notifications";

const taskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
});

const updateTaskSchema = taskSchema.partial().extend({
  id: z.string(),
});

export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createTask(
  formData: z.infer<typeof taskSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = taskSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.errors[0].message };
    }

    const { title, description, status, priority, dueDate, projectId, assigneeId } =
      parsed.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return { success: false, message: "Project not found." };
    }

    // Only admin or project owner can create tasks
    if (
      session.user.role !== "ADMIN" &&
      project.ownerId !== session.user.id
    ) {
      return {
        success: false,
        message: "Only Admins can create tasks.",
      };
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status as TaskStatus,
        priority: priority as Priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectId,
        assigneeId: assigneeId || undefined,
      },
    });

    // Notify assignee
    if (assigneeId && assigneeId !== session.user.id) {
      const proj = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          message: `You have been assigned a new task "${title}" in project "${proj?.name ?? ""}".`,
          taskId: task.id,
          projectId,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "TASK_CREATED",
        entityType: "TASK",
        entityId: task.id,
        meta: { title, projectId, priority, status },
        userId: session.user.id,
        userName: session.user.name ?? "Unknown",
      },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Task created!", data: task };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, message: "Failed to create task." };
  }
}

export async function updateTask(
  formData: z.infer<typeof updateTaskSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = updateTaskSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.errors[0].message };
    }

    const { id, title, description, status, dueDate, assigneeId } =
      parsed.data;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) return { success: false, message: "Task not found." };

    // Members can only update status of their own assigned tasks
    if (session.user.role === "MEMBER") {
      if (task.assigneeId !== session.user.id) {
        return { success: false, message: "You can only update your own tasks." };
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as TaskStatus }),
        ...(formData.priority && { priority: formData.priority as Priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId !== undefined && {
          assigneeId: assigneeId || null,
        }),
      },
    });

    // Notify new assignee if changed
    if (
      assigneeId &&
      assigneeId !== task.assigneeId &&
      assigneeId !== session.user.id
    ) {
      const taskTitle = title ?? task.title;
      const proj = await prisma.project.findUnique({ where: { id: task.projectId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          message: `You have been assigned task "${taskTitle}" in project "${proj?.name ?? ""}".`,
          taskId: id,
          projectId: task.projectId,
        },
      });
    }

    // Notify admins when status changes (by any user)
    if (status && status !== task.status) {
      await notifyAllAdmins(
        `Task "${task.title}" status changed to ${status.replace("_", " ")} by ${session.user.name ?? "a member"}.`,
        id,
        task.projectId
      );
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: status && status !== task.status ? "TASK_STATUS_CHANGED" : "TASK_UPDATED",
        entityType: "TASK",
        entityId: id,
        meta: {
          title: title ?? task.title,
          ...(status && { from: task.status, to: status }),
        },
        userId: session.user.id,
        userName: session.user.name ?? "Unknown",
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Task updated!", data: updated };
  } catch (error) {
    console.error("Update task error:", error);
    return { success: false, message: "Failed to update task." };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized." };
    }
    if (session.user.role !== "ADMIN") {
      return { success: false, message: "Only Admins can delete tasks." };
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, message: "Task not found." };

    await prisma.task.delete({ where: { id: taskId } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "TASK_DELETED",
        entityType: "TASK",
        entityId: taskId,
        meta: { title: task.title, projectId: task.projectId },
        userId: session.user.id,
        userName: session.user.name ?? "Unknown",
      },
    });

    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath("/dashboard");

    return { success: true, message: "Task deleted." };
  } catch (error) {
    console.error("Delete task error:", error);
    return { success: false, message: "Failed to delete task." };
  }
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();

  const [totalTasks, inProgress, done, overdue, recentProjects, allUsers] =
    await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: "DONE" },
        },
      }),
      prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { name: true } },
          tasks: true,
        },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return {
    totalTasks,
    inProgress,
    done,
    overdue,
    todo: totalTasks - inProgress - done,
    recentProjects,
    allUsers,
  };
}

export async function getAllUsers() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function getMyTasks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.task.findMany({
    where: { assigneeId: session.user.id },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}
