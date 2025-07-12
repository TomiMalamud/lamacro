"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    const timeoutId = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md flex items-center justify-center">
        <div className="w-4 h-4"></div>
      </div>
    );
  }

  // Determine the current and next theme
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const nextTheme = currentTheme === "light" ? "dark" : "light";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="relative rounded-md w-8 h-8 flex items-center justify-center p-1.5 hover:bg-gray-200 dark:hover:bg-[#313131] transition-all duration-200 group"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="sr-only">Toggle theme</span>

      <div className="relative w-5 h-5">
        {/* Moon icon for dark mode */}
        <div
          className={`absolute inset-0 transition-transform duration-200 hover:rotate-12 ${
            currentTheme === "dark"
              ? "rotate-0 opacity-100"
              : "rotate-90 opacity-0"
          }`}
        >
          <Moon size={20} />
        </div>

        {/* Sun icon for light mode */}
        <div
          className={`absolute inset-0 transition-transform duration-200 hover:rotate-12 ${
            currentTheme === "dark"
              ? "-rotate-90 opacity-0"
              : "rotate-0 opacity-100"
          }`}
        >
          <Sun size={20} />
        </div>
      </div>
    </button>
  );
}
