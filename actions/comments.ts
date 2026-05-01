// actions/comments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  taskId: z.string(),
  projectId: z.string(),
});

export async function addComment(data: z.infer<typeof commentSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Unauthorized." };

  const parsed = commentSchema.safeParse(data);
  if (!parsed.success) return { success: false, message: parsed.error.errors[0].message };

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      taskId: parsed.data.taskId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  revalidatePath("/my-tasks");
  return { success: true, message: "Comment added." };
}

export async function deleteComment(commentId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Unauthorized." };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { success: false, message: "Comment not found." };

  if (comment.userId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false, message: "Not authorized to delete this comment." };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-tasks");
  return { success: true, message: "Comment deleted." };
}

export async function getTaskComments(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}
