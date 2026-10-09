
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle({ scope }) {
    const { getTheme, toggleTheme } = useTheme();

    const theme = getTheme(scope);
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle-button"
            onClick={() => toggleTheme(scope)}
            aria-label={
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            }
            aria-pressed={isDark}
            title={
                isDark
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
            }
        >
            {isDark ? (
                <Sun size={18} />
            ) : (
                <Moon size={18} />
            )}

            <span>
                {isDark ? "Light Mode" : "Dark Mode"}
            </span>
        </button>
    );
}

export default ThemeToggle;

