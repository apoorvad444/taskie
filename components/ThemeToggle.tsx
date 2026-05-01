"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={{
        color: isDark ? "rgb(148 163 184)" : "rgb(100 116 139)",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? "rgb(30 41 59)" : "rgb(241 245 249)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
