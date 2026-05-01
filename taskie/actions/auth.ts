// actions/auth.ts
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MEMBER"]).optional().default("MEMBER"),
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

    const { name, email, password, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: "Email already in use." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
      },
    });

    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
