"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, X, UserPlus, UserMinus } from "lucide-react";
import { addProjectMember, removeProjectMember } from "@/actions/projects";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ManageProjectMembersModalProps {
  projectId: string;
  ownerId: string;
  allUsers: User[];
  projectMembers: User[];
}

export default function ManageProjectMembersModal({
  projectId,
  ownerId,
  allUsers,
  projectMembers,
}: ManageProjectMembersModalProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<User[]>(projectMembers);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const memberIds = new Set(members.map((m) => m.id));

  const handleAdd = (user: User) => {
    startTransition(async () => {
      const result = await addProjectMember(projectId, user.id);
      if (result.success) {
        setMembers((prev) => [...prev, user]);
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeProjectMember(projectId, userId);
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.id !== userId));
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200"
      >
        <Users className="w-4 h-4" /> Manage Members
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Manage Project Members</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 flex-1 pr-1">
              {/* Current Members */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Current Members ({members.length})
                </h3>
                {members.length === 0 ? (
                  <p className="text-slate-600 text-sm">No members added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{user.name}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                        {user.id === ownerId ? (
                          <span className="text-xs text-indigo-400 font-medium border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                            Created by
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRemove(user.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition disabled:opacity-50"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add Members */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Add Members
                </h3>
                {allUsers.filter((u) => !memberIds.has(u.id)).length === 0 ? (
                  <p className="text-slate-600 text-sm">All team members are already in this project.</p>
                ) : (
                  <ul className="space-y-2">
                    {allUsers
                      .filter((u) => !memberIds.has(u.id))
                      .map((user) => (
                        <li
                          key={user.id}
                          className="flex items-center justify-between bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-slate-300 text-sm font-medium">{user.name}</p>
                              <p className="text-slate-500 text-xs">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAdd(user)}
                            disabled={isPending}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition disabled:opacity-50"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
