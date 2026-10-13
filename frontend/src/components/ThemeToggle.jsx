
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}