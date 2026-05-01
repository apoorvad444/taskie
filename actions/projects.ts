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
        members: {
          create: { userId: session.user.id },
        },
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
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return project;
}

export async function deleteProject(projectId: string): Promise<ActionResult> {  try {
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

export async function getProjectMembers(projectId: string) {
  const session = await auth();
  if (!session?.user) return [];

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return members.map((m) => m.user);
}

export async function addProjectMember(projectId: string, userId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized." };
    }
    await prisma.projectMember.create({ data: { projectId, userId } });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, message: "Member added to project." };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { success: false, message: "User is already a member." };
    }
    console.error("Add project member error:", error);
    return { success: false, message: "Failed to add member." };
  }
}

export async function removeProjectMember(projectId: string, userId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized." };
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true, message: "Member removed from project." };
  } catch (error) {
    console.error("Remove project member error:", error);
    return { success: false, message: "Failed to remove member." };
  }
}
