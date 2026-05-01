"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/actions/auth";
import { useRouter } from "next/navigation";

interface RoleSelectorProps {
  userId: string;
  currentRole: "ADMIN" | "MEMBER";
}

export default function RoleSelector({ userId, currentRole }: RoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as "ADMIN" | "MEMBER";
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setRole(newRole);
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={isPending}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        role === "ADMIN"
          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
          : "bg-slate-800 text-slate-400 border-slate-700"
      }`}
    >
      <option value="MEMBER">MEMBER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  );
}
