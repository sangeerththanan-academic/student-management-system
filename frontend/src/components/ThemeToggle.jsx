
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-pressed={theme === "dark"}
            title="Change system theme"
        >
            <span aria-hidden="true">
                {theme === "light" ? "🌙" : "☀️"}
            </span>

            <span>
                {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
        </button>
    );
}

export default ThemeToggle;