// actions/projects.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
});

export type ActionResult = {
  success: boolean;
  message: string;
  data?: any;
};

export async function createProject(
  formData: z.infer<typeof projectSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized. Please log in." };
    }
    if (session.user.role !== "ADMIN") {
      return { success: false, message: "Only Admins can create projects." };
    }

    const parsed = projectSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.errors[0].message };
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        ownerId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/projects");

    return { success: true, message: "Project created!", data: project };
  } catch (error) {
    console.error("Create project error:", error);
    return { success: false, message: "Failed to create project." };
  }
}

export async function getProjects() {
  const session = await auth();
  if (!session?.user) return [];

  const projects = await prisma.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return projects;
}

export async function getProjectById(id: string) {
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return project;
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, message: "Unauthorized." };
    }
    if (session.user.role !== "ADMIN") {
      return { success: false, message: "Only Admins can delete projects." };
    }

    await prisma.project.delete({ where: { id: projectId } });

    revalidatePath("/dashboard");
    revalidatePath("/projects");

    return { success: true, message: "Project deleted." };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, message: "Failed to delete project." };
  }
}
