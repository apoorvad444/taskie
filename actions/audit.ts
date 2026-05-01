// actions/audit.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getAuditLogs(take = 100) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}
