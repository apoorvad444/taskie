// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus, CheckSquare } from "lucide-react";
import { registerUser } from "@/actions/auth";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await registerUser(data);

    if (result.success) {
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-2xl mb-2 shadow-lg shadow-indigo-500/30">
          <CheckSquare className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Taskie</h1>
        <p className="text-slate-400 text-sm">Team Task Manager</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Create account</h2>
          <p className="text-slate-400 text-sm mt-1">Join your team on Taskie</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Full Name</label>
            <input
              {...register("name")}
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {errors.name && (
              <p className="text-red-400 text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="Min. 6 characters"
              className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
            />
            {errors.password && (
              <p className="text-red-400 text-xs">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
