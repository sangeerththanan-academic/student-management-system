
import { useTheme } from "../context/ThemeContext";

function ThemeToggle({ section }) {
    const { getTheme, toggleTheme } = useTheme();
    const theme = getTheme(section);
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => toggleTheme(section)}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
        >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
    );
}

export default ThemeToggle;
