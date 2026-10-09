import { useSectionTheme } from "../context/ThemeContext";

function ThemeToggle({ section }) {
    const { theme, toggleTheme } = useSectionTheme(section);

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            <span aria-hidden="true">
                {isDark ? "☀️" : "🌙"}
            </span>

            <span>
                {isDark ? "Light Mode" : "Dark Mode"}
            </span>
        </button>
    );
}

export default ThemeToggle;