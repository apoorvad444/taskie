// actions/tasks.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
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

    const { title, description, status, dueDate, projectId, assigneeId } =
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
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectId,
        assigneeId: assigneeId || undefined,
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
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId !== undefined && {
          assigneeId: assigneeId || null,
        }),
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
