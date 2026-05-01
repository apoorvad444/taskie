// actions/auth.ts
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { notifyAllAdmins } from "@/actions/notifications";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type RegisterResult = {
  success: boolean;
  message: string;
};

export async function registerUser(
  formData: z.infer<typeof registerSchema>
): Promise<RegisterResult> {
  try {
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0].message,
      };
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: "Email already in use." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER" as Role,
      },
    });

    // Audit log + notify admins
    await prisma.auditLog.create({
      data: {
        action: "USER_REGISTERED",
        entityType: "USER",
        entityId: newUser.id,
        meta: { name, email, role: "MEMBER" },
        userId: newUser.id,
        userName: name,
      },
    });
    await notifyAllAdmins(`New user "${name}" (${email}) has registered on the platform.`);

    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

export async function updateUserRole(
  targetUserId: string,
  newRole: Role
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized." };
    }
    if (session.user.id === targetUserId) {
      return { success: false, message: "You cannot change your own role." };
    }
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });
    return { success: true, message: "Role updated successfully." };
  } catch (error) {
    console.error("Update role error:", error);
    return { success: false, message: "Something went wrong." };
  }
}

const addMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function addMemberByAdmin(
  formData: z.infer<typeof addMemberSchema>
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = addMemberSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.errors[0].message };
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "A user with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role as Role },
    });

    return { success: true, message: "Member added successfully." };
  } catch (error) {
    console.error("Add member error:", error);
    return { success: false, message: "Something went wrong." };
  }
}
