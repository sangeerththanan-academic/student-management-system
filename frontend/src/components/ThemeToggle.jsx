import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
                isDark ? "light" : "dark"
            } mode`}
            aria-pressed={isDark}
            title={`Switch to ${
                isDark ? "light" : "dark"
            } mode`}
        >
            {isDark ? (
                <Sun size={18} aria-hidden="true" />
            ) : (
                <Moon size={18} aria-hidden="true" />
            )}

            <span>
                {isDark ? "Light Mode" : "Dark Mode"}
            </span>
        </button>
    );
}

export default ThemeToggle;